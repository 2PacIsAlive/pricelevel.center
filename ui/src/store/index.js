import Vue from 'vue'
import Vuex from 'vuex'
import histogram from 'histogramjs'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    connected: false,
    exchanges: [],
    data: null,
    dark: false
  },
  mutations: {
    SOCKET_CONNECT: (state, status) => {
      state.connected = true
    },
    SOCKET_DISCONNECT: (state, status) => {
      state.connected = false
    },
    SOCKET_EXCHANGES: (state, exchanges) => {
      state.exchanges = exchanges[0].reduce((acc, val) => {
        if (val) {
          acc.push(val)
        }
        return acc
      }, [])
    },
    SOCKET___UNUSED: (state, data) => {
      console.log(data[0].asks)
      console.log(histogram({
        data: data[0].asks.map(function (x) {
          return x[0]
        }),
        bins: 10
      }))
      state.data = data
    },
    toggleDark: (state) => {
      state.dark = !state.dark
    }
  },
  actions: {
    otherAction: (context, type) => {
      return true
    },
    socket_pull: (context, exchanges, market) => {
      context.dispatch('newMessage', market)
      context.commit('NEW_MESSAGE_RECEIVED', market)
    }
  }
})
