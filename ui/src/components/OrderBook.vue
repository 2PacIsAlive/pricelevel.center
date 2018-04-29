<template>
  <v-container class="mt-5 mb-5" grid-list-md>
    <v-layout row wrap>
      <v-flex xs12 md6 key="1">
        <template>
          <chart :options="getChart('bids')" auto-resize></chart>
        </template>
      </v-flex>
      <v-flex xs12 md6 key="2">
        <template>
          <chart :options="getChart('asks')" auto-resize></chart>
        </template>
      </v-flex>
      <v-flex xs12 sm8 key="3">
        <v-select
          label="Exchanges"
          :items="exchanges"
          v-model="selectedExchanges"
          multiple
          max-height="400"
          hint="Choose a list of exchanges to monitor"
          persistent-hint
          chips
          autocomplete
        ></v-select>
      </v-flex>
      <v-flex xs12 sm4 key="4">
        <v-select
          label="Market"
          :items="markets"
          v-model="selectedMarket"
          max-height="400"
          hint="Choose a market to monitor"
          persistent-hint
          chips
          autocomplete
        ></v-select>
      </v-flex>
      <v-flex xs12 sm6 key="5">
        <v-slider v-model="selectedBins" min="5" :label="binsSliderLabel"></v-slider>
      </v-flex>
      <v-flex xs12 sm6 key="6">
        <v-slider v-model="selectedRefresh" min="5" max="60" :label="refreshSliderLabel"></v-slider>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import { mapState } from 'vuex'
  import tinygradient from 'tinygradient'
  import _ from 'lodash'

  export default {
    data () {
      return {
        selectedExchanges: ['gdax', 'kraken'],
        selectedMarket: 'BTC/USD',
        selectedBins: 25,
        selectedRefresh: 30, // seconds
        bins: 10,
        chart: {
          data: {
            asks: [],
            bids: []
          },
          bins: {
            asks: [],
            bids: []
          }
        }
      }
    },
    created: function () {
      this.debouncedSubscribe = _.debounce(this.subscribe, 2000)
      this.debouncedSubscribe()
    },
    watch: {
      selectedExchanges: function (newSelectedExchanges, oldSelectedExchanges) {
        this.debouncedSubscribe()
      },
      selectedMarket: function (newSelectedMarket, oldSelectedMarket) {
        this.debouncedSubscribe()
      },
      selectedRefresh: function (newSelectedRefresh, oldSelectedRefresh) {
        this.debouncedSubscribe()
      },
      selectedBins: function (newSelectedBins, oldSelectedBins) {
        this.debouncedSubscribe()
      }
    },
    sockets: {
      feed: function (data) {
        console.log('receiving new data...')
        this.chart.data.asks = data.orderBooks.map(exchange => {
          return {
            name: exchange.name,
            data: exchange.binnedAsks
          }
        })
        this.chart.bins.asks = data.bins.asks
        this.chart.data.bids = data.orderBooks.map(exchange => {
          return {
            name: exchange.name,
            data: exchange.binnedBids
          }
        })
        this.chart.bins.bids = data.bins.bids
      }
    },
    computed: {
      ...mapState({
        exchanges: state => state.exchanges
          .map(exchange => exchange.name),
        markets: state => Array.from(state.exchanges
          .reduce((acc, exchange) => {
            exchange.symbols.forEach(symbol => acc.add(symbol))
            return acc
          }, new Set()))
      }),
      binsSliderLabel: function () {
        return `${this.selectedBins} bins`
      },
      refreshSliderLabel: function () {
        return `refresh every ${this.selectedRefresh} seconds`
      }
    },
    methods: {
      subscribe: function () {
        this.$socket.emit('unsubscribe')
        this.$socket.emit('subscribe', {
          exchanges: this.selectedExchanges,
          market: this.selectedMarket,
          refreshRate: this.selectedRefresh * 1000,
          bins: this.selectedBins
        })
      },
      getChart: function (type) {
        return {
          title: {
            text: `${type}:`,
            textStyle: {
              fontFamily: 'Inconsolata'
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            },
            textStyle: {
              fontFamily: 'Inconsolata'
            }
          },
          legend: {
            data: this.selectedExchanges,
            textStyle: {
              fontFamily: 'Inconsolata'
            }
          },
          toolbox: {
            feature: {
              saveAsImage: {}
            }
          },
          grid: {
            left: '7%',
            bottom: '6%',
            containLabel: true,
            show: true
          },
          color: type === 'bids'
            ? tinygradient('darkgreen', 'lightgreen')
              .rgb(this.selectedExchanges.length)
              .map(color => color.toHexString())
            : tinygradient('darkred', 'lightpink')
              .rgb(this.selectedExchanges.length)
              .map(color => color.toHexString()),
          xAxis: [
            {
              type: 'category',
              boundaryGap: true,
              data: this.chart.bins[type],
              name: `price (${this.selectedMarket.split('/')[1]})`,
              nameLocation: 'center',
              nameTextStyle: {
                padding: 6,
                fontFamily: 'Inconsolata'
              },
              axisLabel: {
                fontFamily: 'Inconsolata',
                formatter: (value, index) => parseFloat(value).toFixed(6)
              }
            }
          ],
          yAxis: [
            {
              type: 'value',
              name: `total volume (${this.selectedMarket.split('/')[0]})`,
              nameLocation: 'end',
              nameTextStyle: {
                fontFamily: 'Inconsolata'
              },
              axisLabel: {
                fontFamily: 'Inconsolata',
                formatter: (value, index) => value
              }
            }
          ],
          series: this.chart.data[type]
            .reduce((acc, orderBook) => {
              acc.data.push({
                name: orderBook.name,
                type: 'bar',
                stack: 'orderBook',
                areaStyle: {
                  normal: {}
                },
                barCategoryGap: 0,
                data: orderBook.data
              })
              acc.color += 1
              return acc
            }, {
              data: [],
              color: 1
            }).data
        }
      }
    },
    name: 'OrderBook'
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .echarts {
    width: auto;
    height: 300px;
  }
</style>
