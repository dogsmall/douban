function beginningOfDay(date) {
    date = date || new Date
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    date.setUTCHours(0)
    return date
}

function yestoday() {
    let date = new Date
    date.setDate(date.getDate() - 1)
    return beginningOfDay(date)
}

function today() {
    return beginningOfDay(new Date)
}

function gap(day1, day2) {
    return parseInt((day1.getTime() - day2.getTime()) / 1000 / 60 / 60 / 24)
}
console.log(gap(today(), yestoday()))