import * as Epona from "eponajs"

export default function(douban_id) {
    let doubanUrls = {
            default: { doubanId: douban_id },
            url: `https://movie.douban.com/subject/${douban_id}`
        }
        // if (topicUrls.length == 1) { topicUrls = topicUrls[0] }
    return Epona.get(doubanUrls, {
        rank: "#interest_sectl strong[property='v:average']::text()",
        rankCount: "div.rating_sum > a > span[property='v:votes']::text()",
        comments: "#comments-section > div.mod-hd > h2 > span > a::text()| numbers",
        reviews: "section > header > h2 > span > a::text()|numbers",
    }, {
        rateLimit: 7000
    })
}