require("dotenv").config();
const mongoose = require("mongoose");
const GameCategory = require("../models/additonForCategories");

const MONGO_URI = process.env.MONGO_URI;

/* ---------------- PASTE YOUR FULL JSON HERE ---------------- */

const categoriesData = require("./gameData.json"); 
// we will create this file next

/* ---------------- SEED FUNCTION ---------------- */

const seedData = async () => {
  try {
    if (!MONGO_URI) {
      console.log("❌ MONGO_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to DB");

    await GameCategory.deleteMany({});
    console.log("🗑 Old data removed");

    await GameCategory.insertMany(categoriesData);

    console.log("🔥 All categories inserted successfully!");
    process.exit();
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seedData();