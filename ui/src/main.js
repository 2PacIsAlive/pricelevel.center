// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import VueSocketio from 'vue-socket.io'
import io from 'socket.io-client'
import ECharts from 'vue-echarts'
import VueHighlightJS from 'vue-highlightjs'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

Vue.component('chart', ECharts)

Vue.use(Vuetify, { theme: {
  primary: '#3993DD',
  secondary: '#424242',
  accent: '#82B1FF',
  error: '#FF5252',
  info: '#2196F3',
  success: '#4CAF50',
  warning: '#FFC107'
}})

Vue.use(VueHighlightJS)

// Vue.use(VueSocketio, io('http://pricelevel.center', {
//   path: '/api'
// }), store)
Vue.use(VueSocketio, io('http://localhost:8081'), store)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  components: { App },
  template: '<App/>'
})
