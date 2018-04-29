const ccxt = require('ccxt');
const histogram = require('histogramjs')
const logger = require('./logger')

const log = logger.getLogger('orderbook')

/**
 * Retrieves a promise resolving to all list of all exchanges,
 * each containing a list of the symbols they support.
 */
async function getExchanges() {
  log.debug('getting exchange data')

  return (await Promise.all(ccxt.exchanges.map(async (exchange) => {
    try {
      let markets = await new ccxt[exchange]().fetchMarkets()
      return {
        name: exchange,
        symbols: markets.map(market => market.symbol)
      }
    } catch (e) {
      log.error(`couldn't load markets for ${exchange}`, e)
      return null
    }
  }))).filter(exchange => exchange !== null)
}

/**
 * Retrieves the l2 (price-aggregated) order book for the
 * specified exchange and symbol. Data is returned from
 * the provided cache if it is present, and added to the
 * provided cache if absent.
 */
async function getOrderBook(cache, exchange, symbol) {
  log.debug(`getting order book for ${symbol} at ${exchange}`)

  let cacheKey = `${exchange}_${symbol}`
  let cachedData = cache.get(cacheKey)

  if (cachedData) {
    log.debug(`cache hit for ${cacheKey}`)
    return Promise.resolve(cachedData)
  }

  log.debug(`cache miss for ${cacheKey}`)
  // TODO: don't instantiate exchange instance every time
  let data = await new ccxt[exchange]().fetchL2OrderBook(symbol)
  cache.set(cacheKey, data)
  return Promise.resolve(data)
}

/**
 * Retrieves raw data for all specified order books along
 * with aggregated data split into the specified number
 * of bins.
 *
 * TODO: break this down into more manageable methods
 */
async function combineOrderBooks(cache, exchanges, symbol, bins) {
  log.debug(`combining order books for ${symbol} at ${exchanges}`)

  let orderBooks = (await Promise.all(exchanges.map(async (exchange) => {
    try {
      let orderBook = await getOrderBook(cache, exchange, symbol)
      return {
        bids: orderBook.bids,
        asks: orderBook.asks,
        name: exchange
      }
    } catch (e) {
      log.error('couldn\'t retrieve order book:', e)
      return null
    }
  }))).filter(orderBook => orderBook !== null)

  let sides = ['bids', 'asks']

  let orderBookBins = sides.reduce((acc, side) => {
    acc[side] = histogram({
      data: orderBooks
        .map(orderBook => orderBook[side]
          .map(entry => entry[0])) // price
        .reduce((acc, val) => acc.concat(val), []),
      bins: bins
    })
    return acc
  }, {})

  orderBooks.map(orderBook => {
    let binned = {
      bids: [],
      asks: []
    }

    sides.forEach(side => {
      orderBook[side].forEach(entry => {
        // add order book entry amount to appropriate bin
        for (let i = 0; i < orderBookBins[side].length; i++) {
          if (entry[0] /* price */ <= orderBookBins[side][i].x) {
            binned[side][i] = binned[side][i]
              ? binned[side][i] += entry[1] // bin total + amount
              : entry[1] // amount
            break
          }
        }
      })
    })

    orderBook.binned = binned
    return orderBook
  })

  return {
    bins: {
      asks: orderBookBins.asks.map(bin => bin.x),
      bids: orderBookBins.bids.map(bin => bin.x)
    },
    orderBooks: orderBooks
  }
}

module.exports = {
  getExchanges: getExchanges,
  getOrderBook: getOrderBook,
  combineOrderBooks: combineOrderBooks
}