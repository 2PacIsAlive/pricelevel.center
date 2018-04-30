import Vue from 'vue'
import OrderBook from '@/components/OrderBook'

describe('OrderBook.vue', () => {
  it('should render correct contents', () => {
    const Constructor = Vue.extend(OrderBook)
    const vm = new Constructor().$mount()
    expect(vm.selected.exchanges)
      .to.deep.equal(['bittrex', 'poloniex', 'binance', 'gdax', 'kraken'])
    expect(vm.selected.market)
      .to.equal('ETH/BTC')
  })
})
