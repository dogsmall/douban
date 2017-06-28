import * as Redis from 'redis'
import * as Promise from "bluebird"
import * as elasticsearch from 'elasticsearch'
import * as fs from "fs"
import { trim } from "lodash"
export const env = fs.existsSync('./env') ? fs.readFileSync('./env', 'utf8') : 'dev'
export let config = require(`./config/${trim(env)}.js`)
import * as request from "request-promise"
import { MongoClient } from "mongodb"
Promise.promisifyAll(Redis.RedisClient.prototype)
Promise.promisifyAll(Redis.Multi.prototype)

export const redis = Redis.createClient(config.redisOpts)

redis.on("error", function(err) {
    console.log("Error " + err);
})

export const es = new elasticsearch.Client(config.esOpts)

export async function bulk(bulkBody) {
    if (bulkBody.length == 0) {
        console.log('maybe error')
        return false
    }
    try {
        let bulked = await request.post({
                uri: 'http://127.0.0.1:9200',
                body: JSON.stringify(bulkBody),
                headers: { "Content-Type": "application/json" }
            })
            // let bulked = await es.bulk({ body: bulkBody })
        bulked = JSON.parse(bulked)
        if (bulked.success != "true") {
            console.log(bulked)
            return false
        } else {
            console.log(`bulked ${bulkBody.length} items`)
            return true
        }
    } catch (e) {
        console.log(`bulked error`)
        console.log(e)
            // TODO: retry
    }
    return false
}
export let mongo = MongoClient.connect(config.mongoUrl)
export let filmMongo = MongoClient.connect(config.filmMongoUrl)