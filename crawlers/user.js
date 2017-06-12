import * as Epona from "eponajs"

export default function(userids) {
  let userUrls = userids.map(x=> {
    return {
        default: { userId: x }
      , url:     `https://www.zhihu.com/user/${x}/newest`
    }
  }) 
  if(userUrls.length == 1) { userUrls = userUrls[0] }
  return Epona.get(userUrls, {
        name:         "h1.zm-editable-content"
      , avatar:       ".zm-avatar-editor-preview::src"
      , desc:         ".zm-editable-content"
    }
  , {
      concurrent: 3
    }
  )
}