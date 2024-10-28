const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  coins: { type: Number, default: 0 },
  modules: {
    code: { type: Number, default: 0 },
    quiz: { type: Number, default: 0 },
    typing: { type: Number, default: 0 }
  },
  profileLevel: {
    level: { type: Number, default: 1 },
    label: { type: String, default: "Novice" }
  },
  profileUrl: {
    type: String,
    default: "https://i.pinimg.com/enabled_lo/564x/94/0e/70/940e703bf3ff769d7eb59a56f1d6cb6f.jpg"
  },

  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  levelUpHistory: [{
    level: { type: Number },
    label: { type: String },
    date: { type: Date }
  }]
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
