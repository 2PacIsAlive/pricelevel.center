const orderbook = require('../orderbook')
const assert = require('assert')
const NodeCache = require('node-cache')

describe('Order Book', function () {
  this.cache = null

  before(function () {
    this.cache = new NodeCache({
      stdTTL: 30,
      checkperiod: 120
    })
  }.bind(this))

  describe('getExchanges', function () {
    this.requiredExchanges = ['bittrex', 'poloniex']
    this.requiredMarket = ['ETH/BTC']
    this.result = []

    before(function () {
      this.timeout(30000)
      return orderbook.getExchanges()
        .then(function (result) {
          this.result = result
        }.bind(this))
    })

    it('should return at least required exchanges and market', function () {
      for (const exchangeName in this.requiredExchanges) {
        console.log(this.requiredMarket)
        console.log(this.result)
        console.log(this.requiredExchanges)
        assert(this.result.some(function (exchange) {
          return exchange.name === exchangeName
            && exchange.symbols.includes(this.requiredMarket)
        }), `${exchangeName} with ${this.requiredMarket} market not found`)
      }
    })

    it('should remove nulls', function () {
      assert(!this.result.includes(null),
        'nulls found in exchange data')
    })
  })

  describe('getOrderBook', function () {
    this.result = {}
    this.targetExchange = 'poloniex'
    this.targetMarket = 'ETH/BTC'
    this.sides = ['asks', 'buys']

    before(function () {
      this.timeout(10000)
      return orderbook.getOrderBook(this.cache, this.targetExchange, this.targetMarket)
        .then(function (result) {
          this.result = result
        }.bind(this))
    }.bind(this))

    it('returns asks and bids', function () {
      for (const side in this.sides) {
        assert(this.result.hasOwnProperty(side),
          `result did not include ${side}`)
        assert(this.result[side][0].length = 2,
          `${side} entry format did not match [<price>, <amount>]`)
      }
    })

    it('caches order book data', function () {
      const targetKey = `${this.targetExchange}_${this.targetMarket}`
      assert(this.cache.get(targetKey) !== undefined,
        `cache miss for ${targetKey}`)
    }.bind(this))
  }.bind(this))

  describe('getOrderBooks', function () {
    this.result = {}
    this.targetExchanges = ['bittrex', 'poloniex']
    this.targetMarket = 'ETH/BTC'
    this.targetBins = 25
    this.sides = ['asks', 'buys']

    before(function () {
      return orderbook.combineOrderBooks(this.cache, this.targetExchanges, this.targetMarket, this.targetBins)
        .then(function (result) {
          this.result = result
        }.bind(this))
    }.bind(this))

    it('returns aggregated data', function () {
      for (const side in this.sides) {
        assert(this.result.bins.hasOwnProperty(side),
          `result did not have ${side} bins`)
        assert(this.result.bins[side].length === this.targetBins,
          `result did not have ${this.targetBins} ${side} bins`)
      }
      for (const exchange in this.targetExchanges) {
        assert(this.result.orderBooks.some(function (orderBook) {
          return orderBook.name === exchange
            && orderBook.binned.length === this.targetBins
        }))
      }
    })

    // TODO better test for aggregation logic
  }.bind(this))
})
