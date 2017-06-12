import * as Epona from "eponajs"

export default function(film) {
    let topicUrls = film.map(x => {
        return {
            default: { doubanId: film.doubanId, updated_at: new Date(), pending: false },
            url: `https://movie.douban.com/subject/${x.doubanId}`
        }
    })
    if (topicUrls.length == 1) { topicUrls = topicUrls[0] }
    return Epona.get(topicUrls, {
        name: "h1.zm-editable-content",
        avatar: ".zm-avatar-editor-preview::src",
        desc: ".zm-editable-content",
        parent_topics: ".parent-topic .zm-item-tag *::data-token",
        child_topics: ".child-topic .zm-item-tag *::data-token",
        follows_num: ".zm-topic-side-followers-info strong::text()|numbers"
            // rank: "#interest_sectl strong[property='v:average']::text()| numbers",
            // rankCount: "#interest_sectl span[property='v:votes']:text() | numbers",
            // comments: "#comments-section > div.mod-hd > h2 > span > a::text()| numbers",
            // reviews: "section > header > h2 > span > a::text()|numbers",
    }, {
        rateLimit: 7000
    })
}