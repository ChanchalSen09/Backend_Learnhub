const mongoose = require('mongoose');
const tempUserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }
});

const TempUser = mongoose.model('TempUser', tempUserSchema);

module.exports = TempUser;
