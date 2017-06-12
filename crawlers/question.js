import * as Epona from "eponajs"
import { korok } from "korok"
import { registerWarpipes } from "warpipe"
registerWarpipes('toTime', function(x) {
    return (x && x.length > 0 ? new Date(parseInt(x) * 1000) : null)
})
export default function(questionids) {
    let questionUrls = questionids.map(x => {
        return {
            default: { _id: x, created_at: new Date },
            url: `https://www.zhihu.com/question/${x}`
        }
    })
    if (questionUrls.length == 1) { questionUrls = questionUrls[0] }

    return Epona.get(questionUrls, {
        blocked: ['.Unhuman::class|isEqual("Unhuman")|toString', '.page_form_wrap|includes("异常流量")|toString'],
        title: "h1.QuestionHeader-title",
        topics: {
            sels: ".QuestionHeader-topics .TopicLink *::href:id|numbers|toString,text():name",
            filters: [(topics) => topics.map((x) => [x.name, x.id]), "flatten"]
        }
        // , desc: ".QuestionHeader-detail"
        ,
        follows_num: ".NumberBoard-item:nth-of-type(1) .NumberBoard-value|numbers(0)",
        views_num: "div.QuestionHeader-side div.NumberBoard-item > div.NumberBoard-value|numbers(0)",
        answers_num: ".List-headerText|numbers(0)",
        data: {
            sels: "#data::data-state",
            flatten: true,
            filters: ['unescape', function(data) {
                return korok(data, {
                    published_at: 'questions>*::created|toTime',
                    desc: 'questions>*::detail|unescape',
                    author: 'author::name',
                    author_token: 'author::urlToken',
                    author_id: 'author::id'
                })
            }]
        },
        answers: {
            sels: ".List-item *",
            nodes: {
                name: ".UserLink-link",
                links: ".UserLink-link::href",
                content: ".RichContent-inner::html()"
                    // 时间格式
                    ,
                time: ".ContentItem-time|extract('于 {year}-{month}-{day}')|format('{year}-{month}-{day}')",
                vote_up: ".VoteButton--up|numbers(0)",
                vote_down: ".VoteButton--down|numbers(0)"
            }
        }
    }, {
        // concurrent: 2
        rateLimit: 7000
    })
}