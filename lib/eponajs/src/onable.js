import { Korok, re } from "korok"
import { 
	castArray,
  isArray,
  isPlainObject,
  defaultsDeep,
  defaults,
  isString,
  clone
} from "lodash"
global.re = re
export class Onable {
  
	constructor(epona, patterns, recipe, opts = {}) {

    this.patterns = castArray(patterns)
    this._recipe = recipe
    this._opts = opts || recipe.opts
    this._requestOpts = {}
    this._then = function(response){ return response }
    this._catch = function(error, item){ console.log(error) }
    this._filters = []
    
    this.epona = epona

    this.crawled = []
    this.resolved = []
    this.catched = []

    let pick
    // FIXME: defaultsDeep default options too many times
    if(isString(recipe) && recipe.length > 0) {
      let korok = new Korok({ result: recipe}, opts)
      pick = (body ,item) => korok.pick(body, defaults(item.default, this._default), this._opts).result
    } else {
      let korok = new Korok(recipe, opts)
      pick = (body, item) => korok.pick(body, defaults(item.default, this._default), this._opts )
    }

    let pickfollow = (body)=> {
      // if(this._follow) {
      //   let links = korok(body, this._follow.recipe).links
      //   if(this._follow.deny) { links = links.filter(x=> !this._follow.deny(x)) }
      //   if(this._follow.allow) { links = links.filter(x=> this._follow.allow(x)) }
      //   // epona.queue(links)
      // }
    }

    let acquire = async (item)=> {
      epona.logger.info("request ->", this.wrapUrl(item).url)
      let response = await epona.request(this.wrapUrl(item))
      let body = this._beforeParse ? this._beforeParse(response.body, response) : response.body
      arguments['0'] = pick(body, item)
      pickfollow(body)
      return arguments
    }

    let release = (args)=> {
      return this._then.apply(this, args)
    }

    let actions = { acquire, release }
    
    for(let pattern of this.patterns) {
      epona.dispatcher.on(pattern, (action)=> {
        return action ? actions[action] : this
        // if(action == 'acquire') { return acquire }
        // else if(action == 'release') { return release }
      })
    }
    return this
  }

  wrapUrl(item) {
    if(this._host && item.url.indexOf('http') != 0) { item.url = this._host + item.url }
    return defaultsDeep(item, this._requestOpts)
  }

  beforeParse(fn) {
    this._beforeParse = fn
    return this
  }

  then(fn) {
    this._then = fn
    return this
  }

  ['catch'](fn) {
    this._catch = fn
    return this
  }

  set(key, val) {
    if(isPlainObject(key)) {
      this._requestOpts = defaultsDeep(key, this._requestOpts)
    } else {
      this._requestOpts[key] = val
    }
    return this
  }

  headers(cookie) {
    if(!this._requestOpts.headers) { this._requestOpts.headers = {} }
    if(isPlainObject(key)) {
      this._defaults.headers = defaults(key, this._defaults.headers)
    } else {
      this._defaults.headers[key] = val
    }
    return this
  }

  cookie(cookie) {
    if(!this._requestOpts.headers) { this._requestOpts.headers = {} }
    this._requestOpts.headers.cookie = cookie 
    return this
  }

  type(type) {
    this._opts.format = type
    return this
  }

  host(host) {
    this._host = host
    return this
  }

  defaults(key, val) {
    if(isPlainObject(key)) {
      this._defaults = defaults(key, this._defaults)
    } else {
      this._defaults[key] = val
    }
    return this
  }

  proxy() {
    
  }

  // cert() {

  // }

  // key() {
    
  // }

  // ca() {

  // }

  // passphrase() {

  // }
  
  follow(opts) {
    let followReciep = {}
    opts.tags = opts.tags ? castArray(opts.tags).map(x=> x+' *') : 'a *'
    followReciep.links = {
      sels: opts.tags,
      attrs: opts.attrs || 'href',
    }
    this._follow.allow = opts.allow
    this._follow.deny = opts.deny
    this._follow.recipe = opts.followReciep
    return this
  }

  pipe() {

  }
}