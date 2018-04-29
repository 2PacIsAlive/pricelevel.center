<template>
  <v-container class="mt-5 mb-5" grid-list-md>
    <v-layout row wrap>
      <v-flex xs12 lg6 key="1">
        <v-card hover height="400">
          <chart
            v-if="chart.bids.data.length > 0"
            :options="bidsChart"
            auto-resize>
          </chart>
          <v-progress-linear
            indeterminate
            v-else>
          </v-progress-linear>
        </v-card>
      </v-flex>
      <v-flex xs12 lg6 key="2">
        <v-card hover height="400">
          <chart
            v-if="chart.asks.data.length > 0"
            :options="asksChart"
            auto-resize>
          </chart>
          <v-progress-linear
            indeterminate
            v-else>
          </v-progress-linear>
        </v-card>
      </v-flex>
      <v-flex xs12 sm8 key="3">
        <v-select
          label="Exchanges"
          :items="exchanges"
          v-model="selected.exchanges"
          multiple
          max-height="400"
          hint="Choose a list of exchanges to monitor"
          persistent-hint
          chips
          autocomplete>
        </v-select>
      </v-flex>
      <v-flex xs12 sm4 key="4">
        <v-select
          label="Market"
          :items="markets"
          v-model="selected.market"
          max-height="400"
          hint="Choose a market to monitor"
          persistent-hint
          chips
          autocomplete>
        </v-select>
      </v-flex>
      <v-flex xs12 sm6 key="5">
        <v-slider
          v-model="selected.bins"
          min="5"
          :label="binsSliderLabel">
        </v-slider>
      </v-flex>
      <v-flex xs12 sm6 key="6">
        <v-slider
          :disabled="!selected.refreshEnabled"
          v-model="selected.refresh"
          min="5" max="60"
          :label="refreshSliderLabel">
        </v-slider>
      </v-flex>
      <v-flex xs12 key="7">
        <v-switch
          label="refresh"
          v-model="selected.refreshEnabled">
        </v-switch>
      </v-flex>
      <v-flex xs12 key="8">
        <v-alert
          type="error"
          :value="errors.feed"
          v-text="errors.feed">
        </v-alert>
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
        errors: {
          feed: false
        },
        selected: {
          exchanges: ['bittrex', 'poloniex', 'binance', 'gdax', 'kraken'],
          market: 'ETH/BTC',
          bins: 25,
          refresh: 30, // seconds
          refreshEnabled: true
        },
        chart: this.freshChartData()
      }
    },
    created: function () {
      this.debouncedSubscribe = _.debounce(this.subscribe, 2000)
      this.debouncedSubscribe()
    },
    watch: {
      'selected.market': function (newVal, oldVal) {
        this.chart = this.freshChartData()
        this.debouncedSubscribe()
      },
      'selected.bins': function (newVal, oldVal) {
        this.chart = this.freshChartData()
        this.debouncedSubscribe()
      },
      'selected.refresh': function (newVal, oldVal) {
        this.chart = this.freshChartData()
        this.debouncedSubscribe()
      },
      'selected.refreshEnabled': function (newVal, oldVal) {
        this.chart = this.freshChartData()
        this.debouncedSubscribe()
      }
    },
    sockets: {
      // TODO: move this to store?
      feed: function (data) {
        if (data.orderBooks.length > 0) {
          this.errors.feed = false
          Array.from(['bids', 'asks']).forEach(side => {
            this.chart[side].data = data.orderBooks.map(exchange => {
              return {
                name: exchange.name,
                data: exchange.binned[side]
              }
            })
            this.chart[side].bins = data.bins[side]
          })
        } else {
          this.chart = this.freshChartData()
          this.errors.feed = `None of the selected exchanges trade ${this.selected.market}`
        }
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
        return this.buildChart('bids')
      },
      asksChart: function () {
        return this.buildChart('asks')
      },
      binsSliderLabel: function () {
        return `${this.selected.bins} bins`
      },
      refreshSliderLabel: function () {
        return `refresh every ${this.selected.refresh} seconds`
      }
    },
    methods: {
      subscribe: function () {
        this.$socket.emit('subscribe', {
          exchanges: this.selected.exchanges,
          market: this.selected.market,
          refreshRate: this.selected.refresh * 1000,
          refreshEnabled: this.selected.refreshEnabled,
          bins: this.selected.bins
        })
      },
      freshChartData: function () {
        return {
          asks: {
            bins: [],
            data: []
          },
          bids: {
            bins: [],
            data: []
          }
        }
      },
      buildChart: function (side) {
        return {
          title: {
            textStyle: {
              fontFamily: 'Inconsolata',
              color: this.dark ? '#EEE' : '#333'
            },
            text: `${side}:`
          },
          color: side === 'asks'
            ? tinygradient('darkred', 'lightpink')
              .rgb(this.selected.exchanges.length)
              .map(color => color.toHexString())
            : tinygradient('darkgreen', 'lightgreen')
              .rgb(this.selected.exchanges.length)
              .map(color => color.toHexString()),
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
              color: this.dark ? '#EEE' : '#333'
            },
            data: this.selected.exchanges
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
            color: this.dark ? '#EEE' : '#333'
          },
          xAxis: [
            {
              name: `price (${this.selected.market.split('/')[1]})`,
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
              },
              data: this.chart[side].bins
            }
          ],
          yAxis: [
            {
              name: `amount (${this.selected.market.split('/')[0]})`,
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
          ],
          series: this.chart[side].data
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

<style scoped>
  .echarts {
    width: auto;
    height: 400px;
  }
</style>
