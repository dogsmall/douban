// https://www.zhihu.com/topic/19668741/newest
import { redis, es, config, mongo, filmMongo } from "./_base"
import { split, pick } from "lodash"
// import { heartbeat } from "./zhihu/heartbeat"
import * as Epona from "eponajs"
var schedule = require('node-schedule');
global.btmsg = 'normal'
    // heartbeat()

function minutes(n) {
    return 1000 * 60 * n
}

function crawlAllCompleted(name) {
    console.log("爬完一次，下次")
    setTimeout(run, minutes(60), name)
}
let lasttest = new Date(new Date - minutes(30))
async function isblocked() {
    if (new Date - lasttest < minutes(30)) { return false }
    lasttest = new Date
    let title = await Epona.get("https://movie.douban.com/subject/26850627", '#db-nav-movie > div.nav-wrap > div > div.nav-logo > a')
    if (title == "豆瓣电影") {
        global.btmsg = 'normal'
        return false
    } else {
        global.btmsg = 'blocked'
        console.log('ip blocked, retry after 30 mins')
        return true
    }
}

function error(err) {
    return false
}

function comment_url(douban_id) {
    return {
        default: { doubanId: douban_id, commentType: "hot" },
        url: `https://movie.douban.com/subject/${douban_id}/comments`
    }
    // default: { doubanId: '26003812' },
    // url: 'https://movie.douban.com/subject/26003812/comments?start=191&amp;limit=20&amp;sort=new_score&amp;status=P '
    // }
}

async function _crawl(crawler, url, index) {
    await crawler.crawl(url)
        .then(async function(res) {
            // console.log(res)
            if (Array.isArray(res)) {
                await crawler.save(res)
                crawler.crawlCompleted(index)
                setImmediate(dispatch, crawler)
            } else {
                await crawler.save(res.comments)
                _crawl(crawler, res.next, index)
            }
        })
        .catch(async function(err) {
            if (await error(err)) {
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
async function dispatch(crawler) {
    if (await isblocked()) {
        console.log("ip被封，请检查")
        setTimeout(dispatch, 1000 * 60 * 30, crawler)
        return
    }
    let index = await crawler.getId()
    console.log(index)
    if (index === 'nil' || index === null) { crawlAllCompleted("comments-redis") }
    let url = comment_url(index)
    _crawl(crawler, url, index)
}

function usage() {
    console.log(`
  `)
}

async function run(name, inc = false) {
    if (!name) { return usage() }
    let [file, mod] = name.split('-')
    let crawler = require(`./douban/${file}`)[mod || 'default']
    if (inc) {
        try {
            let films = await crawler.getIds()
            let redisRes = await crawler.saveRedis(films)
        } catch (e) {
            console.log(e)
        }

    } else {
        console.log("从上次开始")
        dispatch(crawler, comment_url)
    }


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