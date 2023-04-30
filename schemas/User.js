const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    role: String,
    email: {
        type: String,
        unique: true
    },
    password: String
});

module.exports = mongoose.model('User', userSchema);