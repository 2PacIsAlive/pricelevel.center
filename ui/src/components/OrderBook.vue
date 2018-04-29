<template>
  <v-container class="mt-5 mb-5" grid-list-md>
    <v-layout row wrap>
      <v-flex xs12 lg6 key="1">
        <v-card hover>
          <chart v-if="chart.data.bids.length > 0" :options="bidsChart" auto-resize></chart>
          <v-progress-linear indeterminate v-else/>
        </v-card>
      </v-flex>
      <v-flex xs12 lg6 key="2">
        <v-card hover>
          <chart v-if="chart.data.asks.length > 0" :options="asksChart" auto-resize></chart>
          <v-progress-linear indeterminate v-else/>
        </v-card>
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
      <v-flex xs12 sm4 key="5">
        <v-slider v-model="selectedBins" min="5" :label="binsSliderLabel"></v-slider>
      </v-flex>
      <v-flex xs12 sm4 key="6">
        <v-slider :disabled="!selectedRefreshEnabled" v-model="selectedRefresh" min="5" max="60" :label="refreshSliderLabel"></v-slider>
      </v-flex>
      <v-flex xs12 sm4 key="7">
        <v-switch
          label="refresh"
          v-model="selectedRefreshEnabled"
        ></v-switch>
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
        selectedExchanges: ['bittrex', 'poloniex', 'binance', 'gdax', 'kraken'],
        selectedMarket: 'ETH/BTC',
        selectedBins: 25,
        selectedRefresh: 30, // seconds
        selectedRefreshEnabled: true,
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
        },
        chartOptionsTemplate: {
          title: {
            textStyle: {
              fontFamily: 'Inconsolata',
              color: '#777'
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
            textStyle: {
              fontFamily: 'Inconsolata',
              color: '#777'
            }
          },
          toolbox: {
            feature: {
              dataView: {
                title: 'data',
                lang: ['binned order book data', 'back', 'save']
              },
              restore: {
                title: 'restore'
              },
              saveAsImage: {
                title: 'save'
              }
            }
          },
          grid: {
            left: '7%',
            bottom: '6%',
            containLabel: true,
            show: true
          },
          textStyle: {
            color: '#777'
          },
          xAxis: [
            {
              type: 'category',
              boundaryGap: true,
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
              nameLocation: 'end',
              nameTextStyle: {
                fontFamily: 'Inconsolata'
              },
              axisLabel: {
                fontFamily: 'Inconsolata',
                formatter: (value, index) => value
              }
            }
          ]
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
      },
      selectedRefreshEnabled: function (newSelectedRefreshEnabled, oldSelectedRefreshEnabled) {
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
        dark: state => state.dark,
        exchanges: state => state.exchanges
          .map(exchange => exchange.name),
        markets: state => Array.from(state.exchanges
          .reduce((acc, exchange) => {
            exchange.symbols.forEach(symbol => acc.add(symbol))
            return acc
          }, new Set()))
      }),
      bidsChart: function () {
        let template = JSON.parse(JSON.stringify(this.chartOptionsTemplate)) // deep copy
        template.title.text = 'bids:'
        template.legend.data = this.selectedExchanges
        template.color = tinygradient('darkgreen', 'lightgreen')
          .rgb(this.selectedExchanges.length)
          .map(color => color.toHexString())
        template.xAxis[0].data = this.chart.bins.bids
        template.xAxis[0].name = `price (${this.selectedMarket.split('/')[1]})`
        template.yAxis[0].name = `total volume (${this.selectedMarket.split('/')[0]})`
        template.textStyle.color = this.dark ? '#EEE' : '#333'
        template.legend.textStyle.color = this.dark ? '#EEE' : '#333'
        template.title.textStyle.color = this.dark ? '#EEE' : '#333'
        template.series = this.chart.data.bids
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
        return template
      },
      asksChart: function () {
        let template = JSON.parse(JSON.stringify(this.chartOptionsTemplate)) // deep copy
        template.title.text = 'asks:'
        template.legend.data = this.selectedExchanges
        template.color = tinygradient('darkred', 'lightpink')
          .rgb(this.selectedExchanges.length)
          .map(color => color.toHexString())
        template.xAxis[0].data = this.chart.bins.asks
        template.xAxis[0].name = `price (${this.selectedMarket.split('/')[1]})`
        template.yAxis[0].name = `total volume (${this.selectedMarket.split('/')[0]})`
        template.textStyle.color = this.dark ? '#EEE' : '#333'
        template.legend.textStyle.color = this.dark ? '#EEE' : '#333'
        template.title.textStyle.color = this.dark ? '#EEE' : '#333'
        template.series = this.chart.data.asks
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
        return template
      },
      binsSliderLabel: function () {
        return `${this.selectedBins} bins`
      },
      refreshSliderLabel: function () {
        return `refresh every ${this.selectedRefresh} seconds`
      }
    },
    methods: {
      subscribe: function () {
        this.$socket.emit('subscribe', {
          exchanges: this.selectedExchanges,
          market: this.selectedMarket,
          refreshRate: this.selectedRefresh * 1000,
          refreshEnabled: this.selectedRefreshEnabled,
          bins: this.selectedBins
        })
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
