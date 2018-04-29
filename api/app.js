const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const orderbook = require('./orderbook')

orderbook.getExchanges()
	.then((exchanges) => {

		http.listen(8081, '127.0.0.1', () => {
			console.log('listening on *:8081')

			io.on('connection', (socket) => {
				console.log('a user connected')

				socket.emit('exchanges', exchanges)

				let timeout
				function stopFeed() {
					clearTimeout(timeout)
				}

				socket.on('subscribe', (data) => {
					console.log(`got subscription for market (${data.market}) at exchanges (${data.exchanges}) with `
						+ data.refreshEnabled
							? `refresh rate (${data.refreshRate})`
							: `refresh disabled`)

					stopFeed()

					async function feed() {
						console.log(`retrieving order books for market (${data.market}) at exchanges (${data.exchanges})`)
						socket.emit('feed', await orderbook.getOrderBooks(data.exchanges, data.market, data.bins))
						if (data.refreshEnabled) timeout = setTimeout(feed, data.refreshRate ? data.refreshRate : 30000)
					}

					feed().catch(e => {
						console.error('Error retrieving feed:', e)
						socket.emit('feedFailure', e)
					})
				})

				socket.on('disconnect', () => {
					stopFeed()
				})
			})
		})
	}).catch((e) => {
		console.error('Couldn\'t load exchanges', e)
	})
