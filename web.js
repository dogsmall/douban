import * as Koa from 'koa'
import * as render from 'koa-ejs'
import * as logger from 'koa-logger'
import * as serve from 'koa-static'
import * as route from 'koa-router'
import { redis, es, mongo, env } from "./_base"
import { toNumber } from "lodash"
import * as path from "path"
import { log } from "./zhihu/utils"
import * as Pageres from 'pageres'

// Date.setLocale('zh-CN')
const app = new Koa()
let Topic
let TopicFollows
let router = route()

app.use(logger())

app.use(serve(path.join(__dirname, 'public')))

app
  .use(router.routes())
  .use(router.allowedMethods())

render(app, {
    root:    path.join(__dirname, 'pages')
  , layout:  'layouts'
  , viewExt: 'html.ejs'
  , cache:   false
  , debug:   true
})

function beginningOfDay(date) {
  date = date || new Date
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  date.setUTCHours(0)
  return date
}

async function questionAgg(type) {
  let interval, format, query
  if(type == 'day') {
    interval = 'hour'
    format = "MM-dd:H"
    query = { gte: 'now-1d/h' }    
  } else if(type == "week") {
    interval = '6h'
    format = "MM-dd:H"
    query = { gte: 'now-1w/d' }
  } else {
    interval = 'day'
    format = "yyyy-MM-dd"
    query = { gte: 'now-1M/d' }
  }

  let ret = await es.search({
      index: 'zhihu_questions'
    , type: 'zhihu_questions'
    , body:{
        size: 0
      , query: {
         range: {
           created_at: query
         }}
      , aggs: {
        zhihu_questions: {
          date_histogram: {
              field: "created_at"
            , interval
            , time_zone: "+08:00"
            , format } } } }
  })

  // TODO: error
  let aggs = ret.aggregations.zhihu_questions.buckets
  let labels = [], data = []
  for(let agg of aggs) {
    labels.push(agg.key_as_string)
    data.push(agg.doc_count)
  }
  return { labels, data }
}

async function questionAgg2() {
  
}

async function activeClients() {
  let clients = await redis.hvalsAsync("zhihu.clients")
  return clients
    .map((client)=> {
      let [host, time, isblocked] = client.split('_')
      time = new Date(parseInt(time))
      isblocked = isblocked == 'blocked'
      return { host, time, isblocked }
    })
    .filter((client)=> {
      return client.time > new Date(Date.now() - 10 * 60 * 1000)
  })
}

function topicsNum() {
  return Topic.find({}).count()
}

function updatedTopicsNum() {
  let date = beginningOfDay()
  return Topic.find({updated_at:{
    $gt: date
  }}).count()
}

async function questionsNum() {
  return await es.count({
      index: 'zhihu_questions'
    , type: 'zhihu_questions'
  }).count
}

async function questionsNum() {
  return (await es.count({
      index: 'zhihu_questions'
    , type: 'zhihu_questions'
  })).count
}

async function updatedQuestionsNum() {
  let date = beginningOfDay()
  // console.log(date)
  
  let ret = await es.count({
      index: 'zhihu_questions'
    , type: 'zhihu_questions'
    , body: {
        query: {
          range: {
            created_at: {
              "gte": date } } } } 
  })
  return ret.count
}

async function questionsProgress() {
  const cpl = await redis.llenAsync('zhihu.questions.completed')
  return Math.round(cpl * 1.0 / 40000000 * 100)
}

router.get('/cap', async (ctx, next)=> {
  // const pageres = new Pageres({delay: 2})
  //   .src('localhost:3000', ['414x736', 'iphone 6s'])
  //   .dest(path.join(__dirname, 'public'))
  //   .run()
  const pageres = new Pageres({delay: 3})
    .src('localhost:3000', ['414x736'], {
        filename: 'cap'
      , scale: 2
      })
    // .src('data:text/html;base64,PGgxPkZPTzwvaDE+', ['1024x768'])
    .dest(path.join(__dirname, 'public'))
    .run()
    .then(() => console.log('done'));    
  await pageres
  ctx.body = "<img src=''>" + JSON.stringify(pageres) + "</img>"
})

router.get('/', async (ctx, next) =>{
  // let day = toNumber(ctx.query.type || 1)
  let questions, aggs
  let clients = await activeClients()
  let blocked = clients.filter(x=>{
    if(x.isblocked) {
      console.log(x.host, "is blocked")
      console.log(x)
      return true
    }
  })
  let topics = { 
      all: await topicsNum()
    , updated: await updatedTopicsNum()
  }
  try {
    questions = {
        all: await questionsNum()
      , updated: await updatedQuestionsNum()
      , progress: await questionsProgress()
    }

    aggs = await questionAgg(ctx.query.type || 'month')
    // log(aggs)
  } catch(e) {
    ctx.body = `
      ES 链接有问题, 解决方案:
      1. 联系晓婷检查 es 连接配置是否有问题
      2. 联系秋源检查 es mapping 或者 服务器状态是否有问题
      3. 联系晓婷或齐洋检查代码是否有问题
      以下是详细错误信息:
      ${e}
    `
    return
  }
  
  topics.progress = Math.round((topics.updated * 1.0 / topics.all) * 100)
  // 
  await ctx.render('index', { env, clients, blocked, topics, questions, aggs})
})

mongo.then((m)=>{
  Topic = m.collection('topics')
  TopicFollows = m.collection('topic_follows')

  app.listen(3000);
  
}).catch((e)=>{
  console.log(e)
})
