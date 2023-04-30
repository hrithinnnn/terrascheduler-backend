function timeCompare(t1, t2) {

    const t1Hr = parseInt(t1.split('-')[0]);
    const t1Min = parseInt(t1.split('-')[1]);

    const t2Hr = parseInt(t2.split('-')[0]);
    const t2Min = parseInt(t2.split('-')[1]);

    if((t1Hr === t2Hr) && (t1Min === t2Min)) return "equal";
    
    if(t1Hr > t2Hr) return "after";

    if((t1Hr === t2Hr) && (t1Min > t2Min)) return "after";

    return "before";
}

module.exports = timeCompare;