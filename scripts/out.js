import { redis, config, es } from "../_base"
import { includes } from "lodash"
import { updateId, log, expandIds } from "../zhihu/utils"

async function dev() {
  let ret = await es.search({
      index: 'zhihu_questions'
    , type: 'zhihu_questions'
    , body:{
      query: {
         range: {
           created_at: { gte: 'now-1d/h' }
         }}
      }
  })
  console.log(ret.hits.hits)
}

async function run(cmd) {
  console.log(cmd)
  switch(cmd) {
    case 'dev':
      await dev()
      break
    default:
      usage()
  }

  console.log('done!')
  process.exit(0)
}

run(process.argv[2])