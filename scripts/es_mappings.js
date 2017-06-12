import { es } from "../_base"
async function indexQuestions() {
  const indexName = "zhihu_questions"
  let exists = await es.indices.exists({ index: indexName })
  if(exists) {
    let mapping = await es.indices.putMapping(
      { index: "zhihu_questions"
      , type: "zhihu_questions"
      , body: {
        zhihu_questions: {
          properties: 
            { questionId:   { type: "string" }
            , title: { 
                type:     "string"
              , analyzer: "ik" 
            }
            , desc: { 
                type:     "string"
              , analyzer: "ik" 
            }
            // , topics:       {  }
            , followsNum:   { type: "integer" }
            , viewsNum:     { type: "integer" }
            , answersNum:   { type: "integer" }
            , publishedAt:  { type: "date"    }
            , createdAt:    { type: "date"    }
            }
          }
        }
      })
    console.log(mapping)
  } else {
    let index = await es.indices.create(
      { index: indexName
      , body: {}
      })
    console.log(index)
  }
}

indexQuestions()
