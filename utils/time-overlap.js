const timeCompare = require('./time-compare')


function isTimeOverlap(t1, t2) {

    /**
     * t1.st = 09:00
     * t1.end = 12:30
     * t2.st = 10:30
     * t2.end = 13:30
     */

    //complete overlap
    if(timeCompare(t1.start, t2.start) === "equal") return true;

    //t1 before t2
    //t2's start time bw t1 start and end 
    if((timeCompare(t1.start, t2.start) === "before") && (timeCompare(t1.end, t2.start) === "after")) return true;

    //t2 before t1
    //t2's start time bw t1 start and end 
    if((timeCompare(t1.start, t2.start) === "after") && (timeCompare(t1.start, t2.end) === "before")) return true;

    return false;
}

// //EDGE CASES

// const t1 = {
//     start: "09:30",
//     end: "12:30"
// }
// const t2 = {
//     start: "9:30",
//     end: "10:00"
// }

// //t1 > t3
// const t3 = {
//     start: "09:00",
//     end: "10:00"
// }

// //t1 < t4
// const t4 = {
//     start: "10:00",
//     end: "13:00"
// }

// //t1 < =/ t5
// const t5 = {
//     start: "13:14",
//     end: "23:00"
// }

// //t1 > =/ t5
// const t6 = {
//     start: "08:00",
//     end: "09:00"
// }

// console.log(isTimeOverlap(t1, t1));
// console.log(isTimeOverlap(t1, t2));
// console.log(isTimeOverlap(t1, t3));
// console.log(isTimeOverlap(t1, t4));
// console.log(isTimeOverlap(t1, t5));
// console.log(isTimeOverlap(t1, t6));

module.exports = isTimeOverlap;