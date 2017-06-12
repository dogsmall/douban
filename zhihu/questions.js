import { redis, es, config, bulk } from "../_base"
import { updateId, log, expandIds } from "./utils"
import { assign, pick } from "lodash"
import crawl from "../crawlers/question"

let latest = {

    getId() {
        return redis.rpoplpushAsync('zhihu.questions', 'zhihu.questions.pending')
    }

    ,
    crawlCompleted(index) {
        return redis.multi()
            .lpush('zhihu.questions.completed', updateId(index))
            .lrem('zhihu.questions.pending', 0, index)
            .execAsync()
    }

    ,
    requeue(index) {
        return redis.lpushAsync('zhihu.questions', updateId(index))
    }

    ,
    save(questions) {
        // save to elasticsearch
        // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
        let bulkBody = []
            // http://127.0.0.1/stq/api/v1/pa/zhihu/add
        for (let question of questions) {
            if (question.blocked == "true") {
                console.log("ip blocked")
                global.btmsg = 'blocked'
                    // throw new Error('IPBLOCKED')
                    // return false 
            }
            if (!question || !question.title) { continue }
            assign(question, question.data)
            let saved = pick(question, ["title", "topics", "desc", "follows_num", "views_num", "answers_num", "published_at", "author", "author_id", "created_at"])
            saved.index_name = 'zhihu_questions'
            saved.type_name = 'zhihu_questions'
            saved.id = question._id
            bulkBody.push(saved)
        }
        return bulk(bulkBody)
    }

    ,
    error(err) {

        return true
    }

    ,
    crawl(index) {
        return crawl(expandIds(index))
    }
}

module.exports = {
    latest
}