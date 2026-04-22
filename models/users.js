// models/users.js
const mongoose = require("mongoose");

const userProfile = new mongoose.Schema({

  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  wins: { type: Number, default: 0 },
  credits: { type: Number, default: 0 },


  rank: { type: String, default: "Rookie" },
  avatar: { type: String, default: "" }, // This can be a URL or base64




}, { timestamps: true });

module.exports = mongoose.model("users", userProfile);
