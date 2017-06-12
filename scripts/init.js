import { redis, config, mongo } from "../_base"
import { includes } from "lodash"
redis.on("error", function (err) {
  console.log("Error " + err);
})
// doc https://www.npmjs.com/package/redis
function usage() {

}

async function questions() {
  // let i = 50
  // while(i-- > 0) {
  //   console.log(await redis.rpopAsync('zhihu.questions'))
  // }
  let qi = config.MAX_QUESTION_ID
  do {
    await redis.lpushAsync('zhihu.questions', `${qi}_${Date.now()}`)
  } while ((qi -= config.ID_PER) > config.MIN_QUESTION_ID)
  console.log('zhihu questions id added')
}

async function daily() {
  // TODO:通过es 获取最新一个问题的 id, 或者三天前问题的 id
  let lastId = 60700000
  // let i = 50
  // while(i-- > 0) {
  //   console.log(await redis.rpopAsync('zhihu.questions'))
  // }
  // 每天刷 5w 条
  let qi = lastId + 50000
  do {
    await redis.rpushAsync('zhihu.questions', `${qi}_${Date.now()}`)
  } while ((qi -= config.ID_PER) > lastId)
  console.log('zhihu questions id added')
}

async function topics() {
  let ti = config.MIN_TOPIC_ID
  do {
    await redis.lpushAsync('zhihu.topics', `${ti}_${Date.now()}`)
  } while ((ti += config.ID_PER) < config.MAX_TOPIC_ID)  
  console.log('zhihu topics id added')
}

async function index() {
  // craete mongo index
  mongo = await mongo
  const Topic = mongo.collection('topics')
  await Topic.createIndex({_id: 1}, { unique:true })
  const topicFollows = mongo.collection('topic_follows')
  await topicFollows.createIndex({_id: 1}, { unique:true })
  console.log('created mongo indecies')
  // done
  await mongo.close()
}

async function clear(name) {
  console.log(`clear zhihu ${name}`)
  if(name == 'all') {
    await redis.delAsync('zhihu.questions')
    await redis.delAsync('zhihu.questions.pending')
    await redis.delAsync('zhihu.topics')
    await redis.delAsync('zhihu.topics.pending')
  } else if (includes(['questions', 'topics'], name)) {
    await redis.delAsync(`zhihu.${name}`)
    await redis.delAsync(`zhihu.${name}.pending`)
  } else {
    console.log("unknow keys: " + name)
  }
}

async function run(cmd) {
  switch(cmd) {
    case 'questions':
      await questions()
      break
    case 'daily':
      await daily()
      break      
    case 'topics':
      await topics()
      break    
    case 'index':
      await index()
      break
    case 'clear':
      await clear(process.argv[3])
      break
    case 'all':
      await clear()
      await question()
      await topic()
      await index()
      break    
    default:
      usage()
  }

  console.log('done!')
  process.exit(0)
}

run(process.argv[2])



