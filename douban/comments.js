import { redis, es, config, bulk } from "../_base"
import { pick, omit } from "lodash"
import { updateId, log, expandIds } from "./utils"
import crawl from "../crawlers/comments"
import { ObjectID } from "mongodb"
let Films = global.filmMongo.collection('idatage_films')
let FilmsComments = global.mongo.collection('douban_comments')


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

module.exports.redis = {
    async getIds() {
        let films = await Films.find({ doubanId: { $exists: true }, isDeleted: false, showType: -1 }, { doubanId: 1, _id: 0 }).toArray()
        return films
    },
    saveRedis(films) {
        console.log(films)
        films.map(x => {
            return redis.lpushAsync('douban.comment_filmId', x.doubanId)
        })
    },

    getId() {
        return redis.rpoplpushAsync('douban.comment_filmId', 'douban.comment_filmId.pending')
    }

    ,
    crawlCompleted(index) {
        return redis.multi()
            .lpush('douban.comment_filmId.completed', updateId(index))
            .lrem('douban.comment_filmId.pending', 0, index)
            .execAsync()
    }

    ,
    requeue(index) {
        return redis.lpushAsync('douban.comment_filmId', index)
    }

    ,
    async crawl(index) {
        let res = await crawl.start(index)
    },
    async save(comments) {
        console.log(`准备存入${comments.length}条短评`)
        comments.map(async function(x) {
            try {
                let saved = await FilmsComments.findOneAndUpdate({ comment_id: x.comment_id, avatarId: x.avatarId }, { $set: x }, { sort: { doubanId: 1 } })

            } catch (error) {
                console.log(`保存数据是报错:${error}`)
            }
        })
    }
}