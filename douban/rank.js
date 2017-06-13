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

// module.exports.mongo = {
//     async getId() {
//         let films = await Films.findOneAndUpdate({ doubanId: { $exists: true }, isDeleted: false, showType: -1, updatedAt: { $ } }, { $set: { pending: true, updatedAt: new Date } }, { sort: { updated_at: 1 } })
//         return [films.value]
//     },
//     requeue(index) {
//         return true
//     },
//     crawlCompleted(film) {
//         return Films.updateOne({ _id: film._id }, { $set: omit(film, '_id') })
//     },
//     save(film) {
//         // return topics
//         let saved = []
//         saved.push(Films.updateOne({ _id: film._id }, { $set: omit(film, ['_id', 'created_at']) }))
//         saved.push(FilmsFollows.insertOne({
//             _id: (new ObjectID).str,
//             douban_id: douban._id,
//             rank: film.rank,
//             rankCount: film.rankCount,
//             comments: film.comments,
//             reviews: film.reviews,
//             created_at: new Date
//         }))
//         return Promise.all(saved)
//     }
// }

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
        return redis.lpushAsync('douban.ids', updateId(index))
    }

    ,
    async crawl(index) {
        return await crawl.start(index)
    },
    async save(rankFollows) {
        rankFollows.created_at = new Date
        let rdoubanRank = rankFollows
        let saved = await FilmsFollows.insertOne(rdoubanRank, { ordered: false })
        return saved.result.ok == 1
    }
}