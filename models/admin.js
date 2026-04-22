// models/users.js
const mongoose = require("mongoose");

const adminProfile = new mongoose.Schema({
  adminUsername: { type: String, default: "kavyNano" },
  
    email: { type: String, required: true },
   

  password: { type: String, required: true },
avatar: { type: String, default: "" }, // This can be a URL or base64


}, { timestamps: true });

module.exports = mongoose.model("admin", adminProfile);
