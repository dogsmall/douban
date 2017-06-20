import { redis, es, config, bulk } from "../_base"
import { pick, omit } from "lodash"
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
    }

    ,
    error(err) {

        return true
    },

    async crawl(index) {
        return await crawl.start(index)
    },
    async save(rankFollows) {
        rankFollows.crawled_at = today()
        let lastObj = (await TopicStat.find({ doubanId: rankFollows.doubanId, crawled_at: { $lt: rankFollows.crawled_at } }).sort({ crawled_at: -1 }).limit(1)).pop()
        let timeRange = (new Date(rankFollows.crawled_at) - new Date(lastObj.crawled_at)) / 1000 / 60 / 60 / 24
        console.log(timeRange)
        if (timeRange > 1) {
            let rankRange = rankFollows.rank - lastObj.rank
            let rankCountRange = rankFollows.rankCount - lastObj.rankCount
            let commentsRange = rankFollows.comments - lastObj.comments
            let reviewsRange = rankFollows.reviews - lastObj.reviews
            for (let i = 1; i < timeRange; i++) {
                let obj = {
                    rank: rankFollows.rank - rankRange / timeRange * i,
                    rankCount: rankFollows.rankCount - rankCountRange / timeRange * i,
                    comments: rankFollows.comments - commentsRange / timeRange * i,
                    reviews: rankFollows.reviews - reviewsRange / timeRange * i,
                    crawled_at: lastday(i)
                }
                let saved = await FilmsFollows.insertOne(obj, { ordered: false })
                console.log(saved.result.ok)
            }

        }
        // rank
        // rankCount
        // comments
        // reviews
        let rdoubanRank = rankFollows
        let saved = await FilmsFollows.insertOne(rdoubanRank, { ordered: false })
        return saved.result.ok == 1
    }
}