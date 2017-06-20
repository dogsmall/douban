import * as Epona from "eponajs"

let epona = Epona.new({ rateLimit: 10000 })


epona.on('https://movie.douban.com/subject/{doubanId}', {
        rank: "#interest_sectl strong[property='v:average']::text()",
        rankCount: "div.rating_sum > a > span[property='v:votes']::text()",
        comments: "#comments-section > div.mod-hd > h2 > span > a::text()| numbers",
        reviews: "section > header > h2 > span > a::text()|numbers",
    })
    .then(async function(ret) {
        // ret.created_at = new Date

        ret.rank = parseFloat(ret.rank) == NaN ? 0 : parseFloat(ret.rank)
        ret.rankCount = parseInt(ret.rankCount) == NaN ? 0 : parseInt(ret.rankCount)
        console.log('抓到的数据：', ret)
        return ret
    })

epona.start = function(douban_id) {
    let doubanUrls = {
        default: { doubanId: douban_id },
        url: `https://movie.douban.com/subject/${douban_id}`
    }
    return epona.queue(doubanUrls)
}

export default epona