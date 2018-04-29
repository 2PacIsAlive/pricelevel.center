const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const NodeCache = require('node-cache')
const logger = require('./logger')
const orderbook = require('./orderbook')

const log = logger.getLogger('app')
const cache = new NodeCache({
  stdTTL: 5,
  checkperiod: 120
});

orderbook.getExchanges()
  .then((exchanges) => {

    http.listen(8081, '127.0.0.1', () => {
      log.info('listening on *:8081')

      io.on('connection', (socket) => {
        log.info(`${socket.id} connected`)

        socket.emit('exchanges', exchanges)

        let timeout
        function stopFeed() {
          clearTimeout(timeout)
        }

        socket.on('subscribe', (data) => {
          log.info(`got subscription from ${socket.id} for`,
            `${data.market} at ${data.exchanges} with`,
            (data.refreshEnabled
              ? `refresh rate ${data.refreshRate}`
              : `refresh disabled`),
            `combined in ${data.bins} bins`)

          stopFeed()

          async function feed() {
            socket.emit('feed', await orderbook
              .combineOrderBooks(cache,
                data.exchanges,
                data.market,
                data.bins))

            if (data.refreshEnabled) {
              timeout = setTimeout(feed, data.refreshRate
                ? data.refreshRate
                : 30000)
            }
          }

          feed().catch(e => {
            log.error(`error retrieving feed for ${socket.id}:`, e)
            socket.emit('feedFailure', e) // TODO: unhandled on ui
          })
        })

        socket.on('disconnect', () => {
          log.info(`${socket.id} disconnected`)
          stopFeed()
        })
      })
    })
  }).catch((e) => {
    log.error('Couldn\'t load exchanges', e)
  })
