const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },
    hint: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false } // no separate id needed for each item
);

const gameCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reflectedImage: { type: String, default: "" }, // This can be a URL or base64


    items: [itemSchema], // array of word + hint objects

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: String, // or ObjectId if you link admin
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
module.exports = mongoose.model("GameCategory", gameCategorySchema);

