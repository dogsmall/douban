import * as Epona from "eponajs"
import { last, compact } from "lodash"
let epona = Epona.new({ rateLimit: 10000 })


epona.on('https://movie.douban.com/subject/{doubanId}/comments', {
        comments: {
            sels: ".comment-item *" // use ' *' to get all replies as Array
                ,
            nodes: {
                avatar: ".avatar a::title", // as '.reply .avatar'
                avatarId: ".avatar a::href",
                comment: ".comment>p::text()|trim",
                comment_vote: ".comment .comment-vote .votes::text()|numbers",
                comment_id: ".comment .comment-vote input::value|numbers",
                comment_time: ".comment .comment-info .comment-time ::title",
                comment_rating: ".comment .comment-info .rating::title"
            }
        },
        nextPage: ".next::href"
    })
    .then(async function(ret) {
        ret.comments.map(x => {
            x.avatarId = last(compact(x.avatarId.split('/')))
            x.doubanId = ret.doubanId
            return x
        })
        ret.created_at = new Date
        if (ret.nextPage) {
            return {
                comments: ret.comments,
                next: {
                    url: `https://movie.douban.com/subject/${ret.doubanId}/comments${ret.nextPage}`,
                    default: { doubanId: ret.doubanId }
                }
            }

        }
        console.log('抓到的数据：', ret)
    })

epona.start = function(douban_id) {
    let doubanUrls = {
        default: { doubanId: douban_id },
        url: `https://movie.douban.com/subject/${douban_id}/comments`
    }
    return epona.queue(doubanUrls)
}
epona.start("26260853")

// export default epona