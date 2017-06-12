import { redis, config, mongo } from "../_base"
import { includes } from "lodash"
import { updateId, log, expandIds } from "../zhihu/utils"

redis.on("error", function (err) {
  console.log("Error " + err);
})
// doc https://www.npmjs.com/package/redis
function usage() {

}

async function questions() {
  let ti = await redis.llenAsync('zhihu.questions.pending')
  while(ti - 5 > 0) {
    let index = await redis.rpoplpushAsync('zhihu.questions.pending', 'zhihu.questions.pending')
    let [id, time] = index.split('_')
    if((new Date).getTime() - parseInt(time) > 10 * 60 * 1000) {
      console.log('requeued:', id)
      await redis.lremAsync('zhihu.questions.pending', 0, index)
      await redis.lpushAsync('zhihu.questions', updateId(index))
    }
  }
  console.log('zhihu questions id requeued')
}

async function topics() {
  // let ti = config.MIN_TOPIC_ID
  let ti = await redis.llenAsync('zhihu.topics.pending')
  while(ti - 5 > 0) {
    let index = await redis.rpoplpushAsync('zhihu.topics.pending', 'zhihu.topics.pending')
    let [id, time] = index.split('_')
    if((new Date).getTime() - parseInt(time) > 10 * 60 * 1000) {
      console.log('requeued:', id)
      await redis.lremAsync('zhihu.topics.pending', 0, index)
      await redis.lpushAsync('zhihu.topics', updateId(index))
    }
  }
  console.log('zhihu topics id requeued')
}

async function run(cmd) {
  console.log(cmd)
  switch(cmd) {
    case 'questions':
      await questions()
      break
    case 'topics':
      await topics()
      break    
    case 'all':
      await question()
      await topic()
      break    
    default:
      usage()
  }

  console.log('done!')
  process.exit(0)
}

run(process.argv[2])