import { redis, es, config, bulk } from "../_base"
import { pick, omit } from "lodash"
import { updateId, log, expandIds } from "./utils"
import crawl from "../crawlers/topic"
import { ObjectID } from "mongodb"
let Films = global.mongo.collection('films')
let FilmsFollows = global.mongo.collection('films_follows')

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

module.exports.mongo = {
    async getId() {
        let films = await Films.findOneAndUpdate({ doubanId: { $exists: true }, isDeleted: false, showType: -1 }, { $set: { pending: true, updated_at: new Date } }, { sort: { updated_at: 1 } })
        return [films.value]
    },
    requeue(index) {
        return true
    },
    crawlCompleted(film) {
        return Films.updateOne({ _id: film._id }, { $set: omit(film, '_id') })
    },
    save(film) {
        // return topics
        let saved = []
        saved.push(Films.updateOne({ _id: film._id }, { $set: omit(film, ['_id', 'created_at']) }))
        saved.push(FilmsFollows.insertOne({
            _id: (new ObjectID).str,
            film_id: film._id,
            rank: film.rank,
            rankCount: film.rankCount,
            comments: film.comments,
            reviews: film.reviews,
            created_at: new Date
        }))
        return Promise.all(saved)
    }
}

module.exports.redis = {
    getId() {
        return redis.rpoplpushAsync('zhihu.topics', 'zhihu.topics.pending')
    }

    ,
    crawlCompleted(index) {
        return redis.multi()
            .lpush('zhihu.topics.completed', updateId(index))
            .lrem('zhihu.topics.pending', 0, index)
            .execAsync()
    }

    ,
    requeue(index) {
        return redis.lpushAsync('zhihu.topics', updateId(index))
    }

    ,
    crawl(index) {
        return crawl(expandIds(index))
    }

    ,
    async save(topics) {
        let rtopics = topics
            .filter(x => x.name)
            .map(x => {
                x.created_at = new Date
                return x
            })
        if (rtopics.length == 0) { return true }
        let saved = await Topic.insertMany(rtopics, { ordered: false })
        return saved.result.ok == 1
    }
}