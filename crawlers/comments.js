import * as Epona from "eponajs"
import { last, compact } from "lodash"
let epona = Epona.new({ rateLimit: 7000 })


epona.on('subject/{doubanId}/comments', {
        comments: {
            sels: ".comment-item *" // use ' *' to get all replies as Array
                ,
            nodes: {
                avatar: ".avatar a::title", // as '.reply .avatar'
                avatarId: ".avatar a::href",
                comment: ".comment>p::text()|trim",
                commentVote: ".comment .comment-vote .votes::text()|numbers",
                commentId: ".comment .comment-vote input::value|numbers",
                commentTime: ".comment .comment-info .comment-time ::title",
                commentRating: ".comment .comment-info .rating::title"
            }
        },
        nextPage: ".next::href|trim"
    })
    .host("movie.douban.com")
    .then(async function(ret) {
        ret.comments.map(x => {
            x.avatarId = last(compact(x.avatarId.split('/')))
            x.doubanId = ret.doubanId
            x.created_at = new Date
            return x
        })
        console.log(`抓取到${ret.comments.length}条短评`)
        if (ret.nextPage && ret.comments.length >= 20) {
            let nextUrl = {
                comments: ret.comments,
                next: {
                    // headers: { 'Upgrade-Insecure-Requests': "1", "Referer": `https://movie.douban.com/subject/${ret.doubanId}/comments` },
                    default: { doubanId: ret.doubanId },
                    url: `https://movie.douban.com/subject/${ret.doubanId}/comments${ret.nextPage} `
                }
            }
            return nextUrl

        } else {
            return ret.comments
        }

    })

epona.start = function(commentUrl) {
    console.log(commentUrl)
    return epona.queue(commentUrl)
}

export default epona