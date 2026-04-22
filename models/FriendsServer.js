const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: String,
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const roleSchema = new mongoose.Schema({
  name: String,
  role: String,
  word: String,
  hint: String
});

const serverSchema = new mongoose.Schema({

  serverCode:{
    type:String,
    unique:true
  },

  serverName:String,
  hostName:String,
  maxPlayers:Number,

  players:[playerSchema],

  gameStarted:{
    type:Boolean,
    default:false
  },

  status:{
    type:String,
    default:"waiting"
  },
Selectedcategories:{
    type:[String],
    default:[]
  },

  category:{
    type:String,
    default:""
  },

  word:{
    type:String,
    default:""
  },

  hint:{
    type:String,
    default:""
  },

  imposters:{
    type:[String],
    default:[]
  },

  gameReveal:{
    type:Boolean,
    default:false
  },

  gameData:{
    players:[roleSchema],
    category:String,
    imposters:[String]   // FIX
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

});

module.exports = mongoose.model("FriendsServer", serverSchema);