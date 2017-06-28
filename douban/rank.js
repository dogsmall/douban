import { redis, es, config, bulk } from "../_base"
import { pick, omit, floor } from "lodash"
import { updateId, log, expandIds } from "./utils"
import crawl from "../crawlers/rank"
import { ObjectID } from "mongodb"
let Films = global.filmMongo.collection('idatage_films')
let FilmsFollows = global.mongo.collection('douban_follows')

function beginningOfDay(date) {
    date = date || new Date
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    date.setUTCHours(0)
    return date
}

function yestoday() {
    let date = new Date
    date.setDate(date.getDate() - 1)
    return beginningOfDay(date)
}

function today() {
    return beginningOfDay(new Date)
}

function lastday(i) {
    let date = new Date
    date.setDate(date.getDate() - i)
    return beginningOfDay(date)
}
module.exports.redis = {
    async getIds() {
        let films = await Films.find({ doubanId: { $exists: true }, isDeleted: false, showType: -1 }, { doubanId: 1, _id: 0 }).toArray()
        return films
    },
    saveRedis(films) {
        console.log(films)
        films.map(x => {
            return redis.lpushAsync('douban.ids', x.doubanId)
        })
    },

    getId() {
        return redis.rpoplpushAsync('douban.ids', 'douban.ids.pending')
    }

    ,
    crawlCompleted(index) {
        return redis.multi()
            .lpush('douban.ids.completed', updateId(index))
            .lrem('douban.ids.pending', 0, index)
            .execAsync()
    }

    ,
    requeue(index) {
        return redis.lpushAsync('douban.ids', index)
    },
    error(err) {

        return true
    },

    async crawl(index) {
        return await crawl.start(index)
    },
    async save(rankFollows) {
        rankFollows.crawled_at = today().getTime()
        console.log("gsw")
        // let s = await FilmsFollows.find({ doubanId: rankFollows.doubanId, crawled_at: { $lt: rankFollows.crawled_at } }).sort({ crawled_at: -1 }).limit(1).toArray().length
        // console.log(s)
        // console.log(rankFollows)
        // let s = await FilmsFollows.find({ doubanId: rankFollows.doubanId, crawled_at: { $lt: rankFollows.crawled_at } }).sort({ crawled_at: -1 }).toArray()
        let s = await FilmsFollows.find({ doubanId: rankFollows.doubanId, crawled_at: { $lt: rankFollows.crawled_at } }).sort({ crawled_at: -1 }).toArray()
        console.log(s.length > 0)
        if (s.length > 0) {
            console.log("111")

            let lastObj = await FilmsFollows.find({ doubanId: rankFollows.doubanId }).sort({ crawled_at: -1 }).limit(1).toArray()

            console.log(`以前的数组：${lastObj}`)
            console.log(lastObj)
            let lastOne = lastObj[0]
            console.log(`上一个评价${lastOne}`)
            let timeRange = (rankFollows.crawled_at - lastOne.crawled_at) / 1000 / 60 / 60 / 24
            console.log(`日期相隔${timeRange}天`)
            console.log(lastOne)            
            if (timeRange > 1) {
                console.log(rankFollows)
                console.log(`需要补数据，数据缺失${timeRange - 1}`)
                let rankRange = rankFollows.rank - lastOne.rank
                console.log(rankRange)
                let rankCountRange = rankFollows.rankCount - lastOne.rankCount
                console.log(rankCountRange)
                let commentsRange = rankFollows.comments - lastOne.comments
                console.log(commentsRange)
                let reviewsRange = rankFollows.reviews - lastOne.reviews
                console.log(reviewsRange)
                for (let i = 1; i < timeRange; i++) {
                    let obj = {
                        rank: floor(rankFollows.rank - rankRange / timeRange * i, 1),
                        rankCount: parseInt(rankFollows.rankCount - rankCountRange / timeRange * i),
                        comments: parseInt(rankFollows.comments - commentsRange / timeRange * i),
                        reviews: parseInt(rankFollows.reviews - reviewsRange / timeRange * i),
                        doubanId: rankFollows.doubanId,
                        crawled_at: lastday(i).getTime()
                    }
                    console.log(obj)
                    let saved = await FilmsFollows.insertOne(obj, { ordered: false })
                    console.log(saved.result.ok)
                }

            }
        }
        let rdoubanRank = rankFollows
        let saved = await FilmsFollows.insertOne(rdoubanRank, { ordered: false })
        console.log(saved.result.ok)
        return saved.result.ok == 1
    }
}