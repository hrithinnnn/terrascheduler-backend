const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    type: {
        type: String,
        default: "Appointment"
    },
    title: String,
    agenda: String,
    date: String,
    startTime: String,
    endTime: String,
    hostEmail: String,
    guestEmail: String
});

module.exports = mongoose.model('Appointment', appointmentSchema);