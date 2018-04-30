<template>
  <v-container class="mt-5 mb-5" grid-list-md>
    <v-layout row wrap>
      <v-flex xs12 key="1">
        <v-card hover>
          <v-card-title>
            <h3 class="header">api documentation</h3>
          </v-card-title>
          <v-card-text>
            <v-card hover>
              <v-card-title>
                <div>
                  you can subscribe to the pricelevel.center data feed
                  using <a href="https://socket.io/">socket.io</a>:<br/>
                </div>
              </v-card-title>
              <v-card-text>
                <div>
                  <pre v-highlightjs><code class="javascript">
    io('http://pricelevel.center', {
      path: '/api'
    }).on('connection', socket => {
      socket.emit('subscribe', {
        market: 'ETH/BTC',
        exchanges: ['bittrex', 'poloniex'],
        bins: 25,
        refreshEnabled: true,
        refreshRate: 30000
      }
      socket.on('feed', data => {
        // do something
      })
    })
                  </code></pre>
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  export default {
    data () {
      return {

      }
    },
    name: 'ApiDocs'
  }
</script>

<style scoped>

</style>
