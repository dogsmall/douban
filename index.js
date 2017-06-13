// https://www.zhihu.com/topic/19668741/newest
import { redis, es, config, mongo, filmMongo } from "./_base"
import { split, pick } from "lodash"
import { heartbeat } from "./zhihu/heartbeat"
import * as Epona from "eponajs"
global.btmsg = 'normal'
heartbeat()

function minutes(n) {
    return 1000 * 60 * n
}

function crawlAllCompleted(name) {
    console.log("爬完")
    setTimeout(run, minutes(3), name)
}
let lasttest = new Date(new Date - minutes(5))
async function isblocked() {
    if (new Date - lasttest < minutes(3)) { return false }
    lasttest = new Date
    let title = await Epona.get("https://movie.douban.com/subject/26850627", 'body > a')
    if (title == "人工智能") {
        global.btmsg = 'normal'
        return false
    } else {
        global.btmsg = 'blocked'
        console.log('ip blocked, retry after 5 mins')
        return true
    }
}

function error(err) {
    return false
}

async function dispatch(crawler) {
    // if (await isblocked()) {
    //     setTimeout(dispatch, 1000 * 60 * 5, crawler)
    //     return
    // }
    //父数据库的项目的_id
    let index = await crawler.getId()
    console.log(index)
    if (index === 'nil' || index === null) { process.exit(1) }
    await crawler.crawl(index)
        .then(async function(ret) {
            if (await crawler.save(ret)) {
                // console.log("sss")
                await crawler.crawlCompleted(index)
            } else {
                console.log(`crawl ${index} error`)
                await crawler.requeue(index)
            }
            setImmediate(dispatch, crawler)
        })
        .catch(async function(err) {
            if (await error(err) || await crawler.error(err)) {
                console.log("error but catched, retry now!")
                await crawler.requeue(index)
                setImmediate(dispatch, crawler)
            } else {
                console.log(new Date())
                console.log("undefined error type; exit & please concact qiyang")
                console.log(error)
                process.exit(1)
            }
        })
}

function usage() {
    console.log(`
  `)
}

async function run(name, inc) {
    if (!name) { return usage() }
    let [file, mod] = name.split('-')
    let crawler = require(`./douban/${file}`)[mod || 'default']
    if (inc) {
        console.log("重头开始")
        try {
            let films = await crawler.getIds()
            let redisRes = await crawler.saveRedis(films)
        } catch (e) {
            console.log(e)
        }
    } else {
        console.log("从上次开始")
    }

    dispatch(crawler)
}
filmMongo.then(x => {
    global.filmMongo = x
    mongo.then(s => {
        global.mongo = s
        run(process.argv[2], process.argv[3] || false)
    }).catch(x => {
        console.log(x)
    })
}).catch(x => {
    console.log(x)
})