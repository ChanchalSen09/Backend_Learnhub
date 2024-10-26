const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    profiles: { type: String, required: true },
});

const Profiles = mongoose.model('Profiles', profileSchema);
module.exports = Profiles;
