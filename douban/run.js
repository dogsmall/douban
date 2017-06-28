import { redis, es, config, mongo, filmMongo } from "../_base"



filmMongo.then(x => {

}).catch(x => {
    console.log(x)
})

mongo.then(async function(x){
  let FilmsFollows= x.collection('douban_follows')
  let s = await FilmsFollows.find({})
  s.forEach(async function(item){
    //   item.crawled_at = item.crawled_at.getTime()
      console.log(item.crawled_at)
    //   let err = await FilmsFollows.save(item)
    //   console.log(err)
  }, this);
//   console.log(s.crawled_at.getTime())
}).catch(x => {
    console.log(x)
})