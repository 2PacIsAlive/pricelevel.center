import Vue from 'vue'
import Router from 'vue-router'
import OrderBook from '@/components/OrderBook'
import ApiDocs from '@/components/ApiDocs'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'OrderBook',
      component: OrderBook
    }, {
      path: '/docs',
      name: 'ApiDocs',
      component: ApiDocs
    }
  ]
})
