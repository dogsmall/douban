function beginningOfDay(date) {
    date = date || new Date()
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    date.setUTCHours(0)
        // date = new Date(3600 * 24 * 1000)
    return date
}

function yestoday() {
    let date = new Date
    date.setDate(date.getDate() - 1)
    return beginningOfDay(date)
}

function today() {
    let date = new Date
    date.setDate(date.getDate())
    return beginningOfDay(date)
}

function gap(day1, day2) {
    return parseInt((day1.getTime() - day2.getTime()) / 1000 / 60 / 60 / 24)
}
// console.log(gap(today(), yestoday()))


function timeRange(day1, day2) {
    return new Date(day1) - new Date(day2)
}

let s = timeRange(today(), yestoday())
    // console.log(s / 1000 / 60 / 60 / 24)
console.log(beginningOfDay())
console.log(new Date)
console.log(today())
console.log(yestoday())