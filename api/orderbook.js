const ccxt = require('ccxt');
const histogram = require('histogramjs')

function getExchanges() {
	//return Promise.resolve([{name: 'poloniex', symbols: ['ETH/BTC']}])
	return Promise.all(ccxt.exchanges.map(async (exchange) => {
		try {
			let markets = await new ccxt[exchange]().fetchMarkets()
			return {
				name: exchange,
				symbols: markets.map(market => market.symbol)
			}
		} catch (e) {
			console.error(`ERROR: couldn't load markets for ${exchange}`, e)
		}
	}))
}

function getOrderBook(exchange, symbol) {
	// TODO find a way to prevent instantiating exchange instance every time
	return new ccxt[exchange]().fetchL2OrderBook(symbol)
}

async function getOrderBooks(exchanges, symbol, bins) {
	let orderBooks = (await Promise.all(exchanges.map(async (exchange) => {
		try {
			let orderBook = await getOrderBook(exchange, symbol)
			return {
				bids: orderBook.bids,
				asks: orderBook.asks,
				name: exchange
			}
		} catch (e) {
			console.error('Error retrieving order book:', e)
			return null
		}
	}))).filter(orderbook => orderbook !== null)

	let bidsBins = histogram({
		data: orderBooks
			.map(orderbook => orderbook.bids
				.map(bid => bid[0])) // price
			.reduce((acc, val) => acc.concat(val), []),
		bins: bins
	})

	let asksBins = histogram({
		data: orderBooks
			.map(orderbook => orderbook.asks
				.map(ask => ask[0])) // price
			.reduce((acc, val) => acc.concat(val), []),
		bins: bins
	})

	try {
		orderBooks.map(orderBook => {
			let binnedBids = []
			orderBook.bids.forEach(bid => {
				for (let i = 0; i < bidsBins.length; i++) {
					if (bid[0] <= bidsBins[i].x) {
						binnedBids[i] = binnedBids[i] ? binnedBids[i] += bid[1] : bid[1]
						break
					}
				}
			})
			let binnedAsks = []
			orderBook.asks.forEach(ask => {
				for (let i = 0; i < asksBins.length; i++) {
					if (ask[0] <= asksBins[i].x) {
						binnedAsks[i] = binnedAsks[i] ? binnedAsks[i] += ask[1] : ask[1]
						break
					}
				}
			})
			orderBook.binnedBids = binnedBids
			orderBook.binnedAsks = binnedAsks
			return orderBook
		})
	} catch (e)
	{ console.error(e)}
	return {
		bins: {
			asks: asksBins.map(bin => bin.x),
			bids: bidsBins.map(bin => bin.x)
		},
		orderBooks: orderBooks
	}
	// let xAxis = histogram({
	// 	data: orderBooks.map(orderBook => orderBook.asks.map(ask => ask[0])).flatten(),
	// 	bins: 10
	// })

}

module.exports = {
	getExchanges: getExchanges,
	getOrderBook: getOrderBook,
	getOrderBooks: getOrderBooks

}