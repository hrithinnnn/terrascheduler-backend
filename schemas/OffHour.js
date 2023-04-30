const mongoose = require('mongoose');

const offHourSchema = mongoose.Schema({
    type: {
        type: String,
        default: "Off-Hour"
    },
    title: String,
    date: String,
    startTime: String,
    endTime: String,
    email: String
});

module.exports = mongoose.model('OffHour', offHourSchema);