import got from 'got'
import prom from 'prom-client'
import Koa from 'koa'
import _ from 'koa-route'
import debug from 'debug'
import assert from 'assert'
import { config as envConfig } from 'dotenv'
import apps from './applications'

envConfig()

const app = new Koa()
const serverLog = debug('app:server')
const apiLog = debug('app:api:update')
const errorLog = debug('app:api:error')

const { CUSTOMER_ID: customerId, AUTHORIZATION: Authorization } = process.env

assert(customerId && Authorization, 'Error: must have CUSTOMER_ID and AUTHORIZATION in environment or .env file')

const prefixUrl = `https://api.trackjs.com/${customerId}/v1`
const options = {
  prefixUrl,
  headers: { Authorization },
  searchParams: { size: 1, startDate: 0 } // setting startDate is best practice per TrackJS people
}
const updateDate = () => {
  let d = new Date()
  d.setDate(d.getDate() - 2)
  options.searchParams.startDate = d.toISOString()
}
const api = got.extend(options)

const labelNames = ['application']
const errorGauge = new prom.Gauge({
  labelNames,
  name: 'trackjs_error_count',
  help: 'trackjs_errors_by_day'
})
const visitGauge = new prom.Gauge({
  labelNames,
  name: 'trackjs_visit_count',
  help: 'trackjs_visits_by_day'
})

const updateAllApps = async () => await Promise.all(apps.map(async app => await updateMetricsForApp(app)))

const getCount = ({ data }) => data[0].count

async function updateMetricsForApp(application) {
  try {
    const apiData = await Promise.all([
      api('errors/daily', { searchParams: { application } }).json(),
      api('hits/daily', { searchParams: { application } }).json(),
    ])
    const [errorCount, visitCount] = apiData.map(getCount)
    errorGauge.labels(application).set(errorCount)
    visitGauge.labels(application).set(visitCount)
    apiLog(application, '::', 'errors:', errorCount, ' - ', 'visits:', visitCount)
  } catch (e) {
    errorLog(e)
  }
}

app.use(_.get('/list', ctx => ctx.body = apps))
app.use(_.get('/_/metrics', ctx => {
  ctx.status = 200
  ctx.set('Content-Type', prom.register.contentType)
  ctx.body = prom.register.metrics()
}))

app.listen(8080, () => serverLog("listening on port 8080"))
updateDate()
setInterval(updateAllApps, 30 * 1000)
setInterval(updateDate, 30 * 60 * 1000)
