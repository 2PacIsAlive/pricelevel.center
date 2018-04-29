import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    connected: false,
    exchanges: [],
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
    toggleDark: (state) => {
      state.dark = !state.dark
    }
  }
})
