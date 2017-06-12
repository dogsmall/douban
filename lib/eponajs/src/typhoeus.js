import Typheous from "typhoeus"
import { defaults } from "lodash"

export default (epona, opts)=> {
  epona.throttle = new Typheous(defaults(opts, {
    concurrent: 10,
    acquire: (item)=> {
      return epona.dispatcher.parse(item.url, ['acquire'])(item)
    },
    release: (args, item)=> {
      return epona.dispatcher.parse(item.url, ['release'])(args)
    },    
  }))
}