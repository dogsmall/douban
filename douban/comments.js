import { redis, es, config, bulk } from "../_base"
import { pick, omit } from "lodash"
import { updateId, log, expandIds } from "./utils"
import crawl from "../crawlers/comments"
import { ObjectID } from "mongodb"
// let Films = global.filmMongo.collection('idatage_films')
let FilmsFollows = global.mongo.collection('douban_follows')
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
        let films = await FilmsFollows.find({ comments: { $gt: 0 }, crawled_at: yestoday() }, { doubanId: 1, _id: 0, crawled_at: 1, }).toArray()
        console.log(films)
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
    },
    crawlCompleted(index) {
        console.log(`${index}的短评已经爬完`)
        return redis.multi()
            .lpush('douban.comment_filmId.completed', updateId(index))
            .lrem('douban.comment_filmId.pending', 0, index)
            .execAsync()
    },
    requeue(index) {
        return redis.lpushAsync('douban.comment_filmId', index)
    }

    ,
    async crawl(index) {
        let res = await crawl.start(index)
            // console.log(res)
        return res
    },
    async save(comments) {
        console.log(`准备存入${comments.length}条短评`)
        if (comments.length >= 1) {
            comments.forEach(async function(x) {
                try {
                    // let s = await FilmsComments.find().toArray()
                    // console.log(s)
                    let s = await FilmsComments.findOneAndUpdate({ commentId: x.commentId, avatarId: x.avatarId }, { $set: x }, {
                            sort: { doubanId: 1 },
                            upsert: true
                        })
                        // let s = await FilmsComments.insertOne(s, { ordered: false })
                    console.log(s)
                        // return x
                } catch (error) {
                    console.log(`保存数据是报错:${error}`)
                }
            }, this);
            // comments.map(async function(x) {
            //     // console.log(x)

            // })
        } else {
            console.log("没有存入任何短评，切换剧目")
        }

    }
}