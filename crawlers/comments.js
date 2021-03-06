import * as Epona from "eponajs"
import { last, compact, includes } from "lodash"
const querystring = require('querystring');
let epona = Epona.new({ rateLimit: 7000 })


epona.on('subject/{doubanId}/comments', {
        stop1: ".comment-item::text()|trim",
        stop: "#wrapper > div:nth-child(1) > ul > li:nth-child(1)::text()",
        comments: {
            sels: ".comment-item *" // use ' *' to get all replies as Array
                ,
            nodes: {
                avatar: ".avatar a::title", // 用户名
                avatarId: ".avatar a::href", // 用户id
                comment: ".comment>p::text()|trim", // 评论内容
                commentVote: ".comment .comment-vote .votes::text()|numbers", // 赞同数
                commentId: ".comment .comment-vote input::value|numbers", // 评论id
                commentTime: ".comment .comment-info .comment-time ::title", // 评论时间
                commentRating: ".comment .comment-info .rating::title" // 评论等级  力荐:5 推荐:4 还行:3 较差:2 很插:1 null
            }
        },
        nextPage: ".next::href|trim",

    })
    .host("movie.douban.com")
    .then(async function(ret) {
        if (includes(ret.stop1, "还没有人写过短评")) { return [] }
        if (ret.stop) { return [] }
        console.log(`抓取到${ret.comments.length}条短评`)
        ret.comments.map(x => {
            x.avatarId = last(compact(x.avatarId.split('/')))
            x.doubanId = ret.doubanId
            x.created_at = new Date

            return x
        })
        if (ret.nextPage && ret.comments.length >= 20) {
            let url = `https://movie.douban.com/subject/${ret.doubanId}/comments${ret.nextPage} `
            const [uri, ss] = url.split('?')
            const qs = querystring.parse(ss)
            console.log(qs)
            if (qs.start > 200) {
                return ret.comments
            } else {
                let nextUrl = {
                    comments: ret.comments,
                    next: {
                        // headers: { 'Upgrade-Insecure-Requests': "1", "Referer": `https://movie.douban.com/subject/${ret.doubanId}/comments` },
                        default: { doubanId: ret.doubanId, commentType: "hot" },
                        url: `https://movie.douban.com/subject/${ret.doubanId}/comments${ret.nextPage} `
                    }
                }
                return nextUrl
            }


        } else {
            return ret.comments
        }

    })

epona.start = function(commentUrl) {
    console.log(commentUrl)
    return epona.queue(commentUrl)
}

export default epona