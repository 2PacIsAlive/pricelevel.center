const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const orderbook = require('./orderbook')

orderbook.getExchanges()
	.then((exchanges) => {

		http.listen(8081, () => {
			console.log('listening on *:8081')

			io.on('connection', (socket) => {
				console.log('a user connected')

				socket.emit('exchanges', exchanges)

				let timeout
				function stopFeed() {
					clearTimeout(timeout)
				}

				socket.on('subscribe', (data) => {
					console.log(`got subscription for market (${data.market}) at exchanges (${data.exchanges})`)

					async function feed() {
						console.log(`retrieving order books for market (${data.market}) at exchanges (${data.exchanges})`)
						socket.emit('feed', await orderbook.getOrderBooks(data.exchanges, data.market, data.bins))
						timeout = setTimeout(feed, data.refreshRate ? data.refreshRate : 30000)
					}

					feed()
				})

				socket.on('disconnect', () => {
					stopFeed()
				})

				socket.on('unsubscribe', () => {
					stopFeed()
				})
			})
		})
	}).catch((e) => {
		console.error('Couldn\'t load exchanges', e)
	})
