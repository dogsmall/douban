import * as fs from "fs"
import { redis, config } from "../_base"
import * as os from "os"

function message() {
  if(global.btmsg) {
    return [os.hostname(), Date.now(), global.btmsg].join('_')
  } else {
    return [os.hostname(), Date.now()].join('_')
  }
}

export function heartbeat(isMaster) {
  let crawlerKey
  let filename = `./config/crawlerkeys/${isMaster ? 'master' : 'node'}.txt`
  if(fs.existsSync(filename)) {
    crawlerKey = fs.readFileSync(filename, 'utf8')
  } 
  if(!fs.existsSync('./config/crawlerkeys')) { fs.mkdir('./config/crawlerkeys') }
  if(!crawlerKey || crawlerKey.length == 0) {
    crawlerKey = isMaster 
               ? `node_master` 
               : `node_${Math.floor(Math.random() * 10000000)}`
    fs.writeFileSync(filename, crawlerKey, 'utf8')
  }

  console.log('crawler init:', crawlerKey)

  function _bh() {
    redis.hsetAsync("zhihu.clients"
                   , crawlerKey
                   , message())
    .then(function() {
      console.log("heartbeat:", crawlerKey)
      setTimeout(_bh, config.beattime)
    })
    .catch(function(e) {
      console.log("heartbeat error:", e)
      setTimeout(_bh, config.beattime)
    })
  }
  _bh()
}