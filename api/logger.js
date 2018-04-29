const log4js = require('log4js')

log4js.configure({
  pm2: true,
  appenders: {
    out: {
      type: 'stdout'
    }
  },
  categories: {
    default: {
      appenders: ['out'],
      level: 'debug' // TODO: 'info'
    }
  }
})

module.exports = {
  getLogger: log4js.getLogger
}