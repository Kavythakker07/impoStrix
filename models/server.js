const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({

  serverCode: String,

  host: String,

  players: [
    {
      name: String
    }
  ],

  status: {
    type: String,
    default: "waiting"
  }

});

module.exports = mongoose.model("Server", serverSchema);