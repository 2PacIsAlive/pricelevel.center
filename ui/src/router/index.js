import Vue from 'vue'
import Router from 'vue-router'
import OrderBook from '@/components/OrderBook'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'OrderBook',
      component: OrderBook
    }
  ]
})
