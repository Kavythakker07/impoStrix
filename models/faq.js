// Faq.js (Mongoose Model)
const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema(
  {
  question: String,
  askedBy: String,  // email or name
  answer: String,   // optional
  answeredBy: String, // admin email
  createdAt: { type: Date, default: Date.now }
}
);

module.exports = mongoose.model("faq", FaqSchemaSchema);

