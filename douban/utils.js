import { split } from "lodash"
import { config } from "../_base"
import * as expand from 'expand-range'
let util = require('util')

export function updateId(i) {
    let s = split(i, '_', 1)
    return `${Number(s)}_${Date.now()}`
}

export function log(x) {
    console.log(util.inspect(x, { showHidden: true, depth: null }))
}

export function expandIds(index) {
    let s = split(index, '_', 1)
    let ind = Number(s)
    return ind
}