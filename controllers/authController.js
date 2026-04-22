

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const user = require("../models/users");
const admin = require("../models/admin");
const courses = require("../models/courses");
const additonForCategories= require("../models/additonForCategories");
const LiveSession = require("../models/liveSessionsTime");
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FriendsServer = require("../models/FriendsServer");
const generateServerCode = require("../utils/genServerCode");
const path = require("path");
const Announcement = require('../models/announcement');
const sharp = require("sharp");
const fs = require("fs");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const otpStore = new Map(); 



const loginUser = async (req, res) => {
  try {

    const { emailOrusername, password } = req.body;

    if (!emailOrusername || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    /* ---------- FIND USER ---------- */

    const existingUser =
      await user.findOne({ email: emailOrusername }) ||
      await user.findOne({ username: emailOrusername });

    const existingAdmin = await admin.findOne({ email: emailOrusername });

    /* ---------- USER LOGIN ---------- */

    if (existingUser) {

      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (!isPasswordValid) {
        return res.json({ message: "Invalid password" });
      }

     const token = jwt.sign(
{
id: existingUser._id,
email: existingUser.email,
username: existingUser.username
},
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);
console.log("TOKEN CREATED:", token);
console.log("PAYLOAD CREATED:", jwt.decode(token));
   const safeUser = {
  username: existingUser.username,
  email: existingUser.email,
  avatar: existingUser.avatar,
  bio: existingUser.bio,
  rank: existingUser.rank,
  credits: existingUser.credits,
  wins: existingUser.wins
};

return res.json({
  message: "Login successful!",
  token,
  user: safeUser
});
    }

    /* ---------- ADMIN LOGIN ---------- */

    if (existingAdmin) {

      const isPasswordValid = await bcrypt.compare(
        password,
        existingAdmin.password
      );

      if (!isPasswordValid) {
        return res.json({ message: "Invalid password" });
      }

    const token = jwt.sign(
{
id: existingAdmin._id,
admin: true
},
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);
console.log("TOKEN CREATED:", token);
console.log("PAYLOAD CREATED:", jwt.decode(token));

        const safeAdmin = {
  username: existingAdmin.username,
  email: existingAdmin.email,
  avatar: existingAdmin.avatar,
  bio: existingAdmin.bio,
  rank: existingAdmin.rank,
  credits: existingAdmin.credits,
  wins: existingAdmin.wins
};

return res.json({
  message: "Login successful!",
  token,
  user: safeAdmin
});
    }

    /* ---------- NO USER FOUND ---------- */

    return res.json({
      message: "User not found"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};


const registerUser = async (req, res) => {
  try {
    const { email, pass,userName } = req.body;
    if (!email || !pass ||!userName) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (pass.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

  

    const existingUser = await user.findOne({ email });
    const existingUserByName = await user.findOne({ username:userName });


   
    if (existingUser) {
      return res.status(409).json({ success:false,message: "Email already registered." });
    }

    if (existingUserByName) {
      return res.status(409).json({ success:false,message: "Username already registered." });
    }
     
  

    const hashedPassword = await bcrypt.hash(pass, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore.set(email, {
      otp,
      hashedPassword,
      timestamp: Date.now(),
    });

await resend.emails.send({
from: "Throne Of Gamers <otp@impostrix.xyz>",
  to: email,
  subject: "Your OTP for TOG Registration",
  text: `Hey Mate!!\n\nYour OTP is: ${otp}\nValid for 5 minutes.\n\nTeam TOG`
});
    // await transporter.sendMail(mailOptions);
    console.log('✅ OTP Email sent to:', email,otp);
    return res.status(200).json({ success:true,message: 'OTP sent to your email.' });

  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const verifyOTPAndRegister = async (req, res) => {
  try {
    const { mailID, OTP ,userName} = req.body;

    const record = otpStore.get(mailID);
    if (!record) return res.status(400).json({ message: "No OTP request found." });

    const { otp, hashedPassword, timestamp } = record;

    if (Date.now() - timestamp > 5 * 60 * 1000) {
      otpStore.delete(mailID);
      return res.status(400).json({ message: "OTP expired. Try again." });
    }

    if (otp.toString() !== OTP.toString()) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
const isPasswordValid = await bcrypt.compare(process.env.ADMIN_PASS, hashedPassword);

if(isPasswordValid){
console.log("as admin")
    const adminReg = new admin({email:mailID,password:hashedPassword,adminUsername:userName });
    await adminReg.save();
    otpStore.delete(mailID);


const safeAdmin = {
  adminUsername:adminReg.adminUsername,
  email: adminReg.email,
  avatar: adminReg.avatar,

  
 
};

return res.status(200).json({
  message: "Registered successfully as Admin!",
  admin: safeAdmin,
});
  
}
    const newUser = new user({  email: mailID, password: hashedPassword,username:userName });
    await newUser.save();
console.log("as user")

    otpStore.delete(mailID);
const safeUser = {

username:userName,
  email: newUser.email,
  avatar: newUser.avatar,
  rank: newUser.rank,
  credits: newUser.credits,
  wins:newUser.wins,
  bio:newUser.bio



};
console.log("sss",safeUser)
res.status(200).json({
  message: "Registered successfully!",
  user: safeUser,
});
  } catch (error) {
    console.error("❌ Error in verifyOTPAndRegister:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Password reset requested for:", email);
    const existingUser = await user.findOne({ email });
    console.log("Existing user found:", !!existingUser);
    const existingAdmin = await admin.findOne({ email });


    if (!existingUser&&!existingAdmin) return res.status(404).json({ message: "User or Admin not found." });

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore.set(email, { otp, timestamp: Date.now() });

  await resend.emails.send({
from: "Throne Of Gamers <otp@impostrix.xyz>",
  to: email,
  subject: "Your OTP for TOG Registration",
  text: `Hey Mate!!\n\nYour OTP is: ${otp}\nValid for 5 minutes.\n\nTeam TOG`
});
    // await transporter.sendMail(mailOptions);
    console.log(`🔐 OTP for ${email}: ${otp}`);

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("❌ sendResetOTP error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

/**
 * 2️⃣ Verify Reset Password OTP
 */
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ message: "No OTP found for this email." });

    const { otp: storedOtp, timestamp } = record;

    if (Date.now() - timestamp > 5 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired. Try again." });
    }

    if (storedOtp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (err) {
    console.error("❌ verifyResetOTP error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const resetPass = async (req, res) => {
  try {
    const { email, newPass } = req.body;

    if (!email || !newPass) {
      return res.status(400).json({ message: "Email and new password required." });
    }

    const existingUser = await user.findOne({ email });
    const existingAdmin = await admin.findOne({ email });

    if (!existingUser&&!existingAdmin) return res.status(404).json({ message: "User or Admin not found." });

    // ❌ Check if new password is same as old one

    if(existingUser){
 const isSamePassword = await bcrypt.compare(newPass, existingUser.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be same as the old password." });
    }
    }
    else{
       const isSamePassword = await bcrypt.compare(newPass, existingAdmin.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be same as the old password." });
    }
    }
   

    // ✅ Hash and update

    const hashedPassword = await bcrypt.hash(newPass, 10);

    if(existingUser){
existingUser.password = hashedPassword;
    await existingUser.save();
    }
    else{
      existingAdmin.password = hashedPassword;
    await existingAdmin.save();
    }
    

    otpStore.delete(email);

    return res.status(200).json({ success: true, message: "Password reset successful!" });

  } catch (err) {
    console.error("❌ resetPass error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};


const addgameCon = async (req, res) => {
  try {
    const { categoryName, word, hint, newCategoryName } = req.body;

    /* -------------------- ADD NEW CATEGORY -------------------- */
    if (newCategoryName) {
      const existingCategory = await additonForCategories.findOne({
        categoryName: newCategoryName,
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category already exists",
        });
      }

      const newCategory = new additonForCategories({
        categoryName: newCategoryName,
        items: [],
      });

      await newCategory.save();

      return res.status(201).json({
        success: true,
        message: "New category created successfully!",
        data: newCategory,
      });
    }

    /* -------------------- ADD ITEM TO CATEGORY -------------------- */
    if (!categoryName || !word || !hint) {
      return res.status(400).json({
        success: false,
        message: "Category, word and hint are required",
      });
    }

    const categoryDoc = await additonForCategories.findOne({
      categoryName,
    });

    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Optional: prevent duplicate word
    const duplicate = categoryDoc.items.find(
      (item) => item.word.toLowerCase() === word.toLowerCase()
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Word already exists in this category",
      });
    }

    categoryDoc.items.push({ word, hint });

    await categoryDoc.save();

    return res.status(200).json({
      success: true,
      message: "Item added successfully!",
      data: categoryDoc,
    });

  } catch (error) {
    console.error("Add game error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const getAllCategories = async (req, res) => {
  try {
    const categories = await additonForCategories
      .find({})
      .select("categoryName -_id")
      .lean();

      console.log("bitchh",categories)

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No categories found",
      });
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error("Fetch categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



const createLocalGame = async (req, res) => {
  try {
    const { players, categories, hintEnabled, imposters } = req.body;



    /* ---------------- VALIDATION ---------------- */

    if (!Array.isArray(players) || players.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 players required",
      });
    }

    if (players.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 players allowed",
      });
    }

    // Empty name check
    if (players.some(p => !p || !p.trim())) {
      return res.status(400).json({
        success: false,
        message: "All players must have valid names",
      });
    }
console.log("s")
    // Duplicate name check
    const uniqueNames = new Set(players.map(p => p.trim().toLowerCase()));
    if (uniqueNames.size !== players.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate player names not allowed",
      });
    }
console.log("ss")

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one category",
      });
    }

    const playersCount = players.length;

    /* ---------------- CALCULATE MAX IMPOSTERS ---------------- */

    const maxAllowedImposters =
      Math.floor(((playersCount - 3) / (20 - 3)) * (6 - 1)) + 1;

    // If frontend sends imposters
    const finalImposters = imposters
      ? Number(imposters)
      : maxAllowedImposters;

    if (finalImposters > maxAllowedImposters) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxAllowedImposters} imposters allowed for ${playersCount} players`,
      });
    }

    if (finalImposters >= playersCount) {
      return res.status(400).json({
        success: false,
        message: "Imposters cannot be equal or more than players",
      });
    }

    if (finalImposters < 1) {
      return res.status(400).json({
        success: false,
        message: "At least 1 imposter required",
      });
    }

    /* ---------------- RANDOM CATEGORY ---------------- */

    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];

    const categoryDoc = await additonForCategories.findOne({
      categoryName: randomCategory,
    });

    if (!categoryDoc || !categoryDoc.items.length) {
      return res.status(400).json({
        success: false,
        message: "No items found in selected category",
      });
    }

    /* ---------------- RANDOM ITEM ---------------- */

    const randomItem =
      categoryDoc.items[
        Math.floor(Math.random() * categoryDoc.items.length)
      ];

    /* ---------------- SHUFFLE PLAYERS ---------------- */

    const shuffledPlayers = [...players].sort(
      () => 0.5 - Math.random()
    );

    /* ---------------- PICK IMPOSTER INDEXES ---------------- */

    const imposterIndexes = shuffledPlayers
      .map((_, i) => i)
      .sort(() => 0.5 - Math.random())
      .slice(0, finalImposters);

    /* ---------------- BUILD FINAL PLAYER DATA ---------------- */

    const finalPlayers = shuffledPlayers.map((name, index) => {
      const isImposter = imposterIndexes.includes(index);

      return {
        name,
        role: isImposter ? "imposter" : "crewmate",
        word: isImposter ? null : randomItem.word,
        hint: isImposter && hintEnabled ? randomItem.hint : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        players: finalPlayers,
        category: randomCategory,
        imposters: finalImposters,
      },
    });

  } catch (error) {
    console.error("Game creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const getAppVersion = async (req, res) => {
  try {
    res.json({
      success: true,
      latestVersion: process.env.LATEST_VERSION,
      forceUpdate: true,
      playStoreUrl: process.env.APP_LINK
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
const createWithFriends = async (req, res) => {

  try {

    const { serverName, maxPlayers, hostName } = req.body;


    console.log("hostName",hostName)
    if (!serverName || !maxPlayers) {
      return res.status(400).json({
        message: "Servername and Max players are needed"
      });
    }

    const serverCode = generateServerCode();
console.log("serverCode",serverCode.serverCode)
    const server = new FriendsServer({

      serverCode,
      serverName,
      hostName,
      maxPlayers,
      hostName,

      players: [
        {
          name: hostName
        }
      ]

    });

    await server.save();

    res.status(200).json({

      success: true,
      data: server

    });

  } catch (error) {

    console.log("Create server error:", error);

    res.status(500).json({
      message: "Server error"
    });

  }

};




const createServer = async (req, res) => {

  const { hostName } = req.body;

  const code = Math.random().toString(36).substring(2,8).toUpperCase();

  const server = new ServerModel({

    serverCode: code,
    host: hostName,
    players: [{ name: hostName }]

  });

  await server.save();

  res.json({
    success:true,
    server
  });

};



const joinWithFriends = async (req, res) => {

  try {

    const { serverCode, playerName } = req.body;

    const server = await FriendsServer.findOne({
      serverCode: serverCode.toUpperCase()
    });

    if (!server) {
      return res.status(404).json({
        message: "Server not found"
      });
    }

    if (server.players.length >= server.maxPlayers) {
      return res.status(400).json({
        message: "Server is full"
      });
    }

  const alreadyExists = server.players.find(
p => p.name.toLowerCase() === playerName.toLowerCase()
);

if(alreadyExists){
return res.status(400).json({
message:"Player already joined"
});
}

server.players.push({
name: playerName
});

    await server.save();

    res.json({
      success: true,
      data: server
    });

    const io = req.app.get("io");

io.to(serverCode).emit("playersUpdate", {
  players: server.players.map(p => p.name)
});

  } catch (error) {

    console.log("Join server error:", error);

    res.status(500).json({
      message: "Server error"
    });

  }

};


const startFriendsGame = async (req,res)=>{

try{

const { serverCode, categories, hintEnabled, imposters } = req.body;

let categoriesArray=[];

if(Array.isArray(categories)){
categoriesArray = categories;
}
else if(typeof categories === "string"){
categoriesArray = categories.split(",").map(c=>c.trim());
}

if(categoriesArray.length===0){
return res.status(400).json({
success:false,
message:"Select category"
});
}

const randomCategory =
categoriesArray[Math.floor(Math.random()*categoriesArray.length)];

const server = await FriendsServer.findOne({
serverCode: serverCode.toUpperCase()
});

if(!server){
return res.status(404).json({
success:false,
message:"Server not found"
});
}

const players = server.players.map(p=>p.name);

if(players.length < 2){
return res.status(400).json({
success:false,
message:"Minimum 2 players required"
});
}


if(players.length > 20){
return res.status(400).json({
success:false,
message:"Maximum 20 players allowed"
});
}

/* imposter count */

const finalImposters = imposters ? Number(imposters) : 1;

/* category */

const categoryDoc = await additonForCategories.findOne({
categoryName: randomCategory
});

if(!categoryDoc || !categoryDoc.items.length){
return res.status(400).json({
success:false,
message:"No items in category"
});
}

const randomItem =
categoryDoc.items[Math.floor(Math.random()*categoryDoc.items.length)];

/* shuffle players */

const shuffledPlayers = [...players].sort(()=>0.5-Math.random());

/* pick imposter indexes */

const imposterIndexes = shuffledPlayers
.map((_,i)=>i)
.sort(()=>0.5-Math.random())
.slice(0,finalImposters);

/* create player roles */

const finalPlayers = shuffledPlayers.map((name,index)=>{

const isImposter = imposterIndexes.includes(index);

return{
name,
role: isImposter ? "imposter" : "crewmate",
word: isImposter ? null : randomItem.word,
hint: isImposter && hintEnabled ? randomItem.hint : null
};

});

/* imposter names */

const imposterNames = finalPlayers
.filter(p=>p.role==="imposter")
.map(p=>p.name);



const selectedcategoriesNames = Array.isArray(categories)
  ? categories
  : categories.split(",").map(c => c.trim());



/* save */

server.status="playing";
server.gameStarted=true;
server.gameReveal=false;

server.word = randomItem.word;
server.hint = randomItem.hint;
server.category = randomCategory;
server.imposters = imposterNames;
server.Selectedcategories=selectedcategoriesNames

server.gameData={
players: finalPlayers,
category: randomCategory,
imposters: imposterNames,
selectedcategoriesNames: selectedcategoriesNames

};

await server.save();

/* response */

res.json({
success:true,
data:{
players:finalPlayers,
category:randomCategory,
imposters:server.imposters,
hostName: server.hostName,
serverCode: server.serverCode
}
});

const io = req.app.get("io");

io.to(serverCode).emit("gameStarted", {
  players: finalPlayers,
  category: randomCategory,
  imposters: server.imposters,
  hostName: server.hostName,
  serverCode: server.serverCode
});

}catch(err){

console.log("Start friends game error:",err);

res.status(500).json({
success:false,
message:"Server error"
});

}

};


const getServerPlayers = async (req, res) => {

try {

const { serverCode, playerName } = req.query;

const server = await FriendsServer.findOne({
serverCode: serverCode.toUpperCase()
});

if (!server) {
return res.status(404).json({
success:false,
message:serverCode
});
}

/* role logic */

let role = null;
let word = null;
let hint = null;

if(server.gameStarted && server.gameData){

const player = server.gameData.players.find(
p => p.name.toLowerCase() === playerName.toLowerCase()
);

if(player){
role = player.role;
word = player.word;
hint = player.hint;
}

}

/* find imposters */

let imposters = [];

// if(server.gameReveal && server.gameData){

// imposters = server.gameData.players
// .filter(p => p.role === "imposter")
// .map(p => p.name);

// }
console.log("opop",imposters)
res.json({
success:true,
players: server.players.map(p => p.name),
gameStarted: server.gameStarted || false,
category: server.category || null,
role,
word :server.word ||null,
hint: server.hint || null,
hostName : server.hostName,
gameReveal: server.gameReveal || false,
serverCode: server.serverCode,
imposters: server.imposters || []


});

} catch (error) {

console.log("getServerPlayers error", error);

res.status(500).json({
success:false,
message:"Server error"
});

}

};
const removePlayer = async (req,res)=>{

try{

const { serverCode, playerName } = req.body;

const server = await FriendsServer.findOne({
serverCode: serverCode.toUpperCase()
});
let removedPlayer = null;
if(!server){
return res.status(404).json({ success:false });
}

server.players = server.players.filter(
p => p.name !== playerName
);

await server.save();


res.json({
  
  
  removedPlayer: playerName,
  success:true });

  const io = req.app.get("io");

io.to(serverCode).emit("playersUpdate", {
  players: server.players.map(p => p.name)
});

}catch(err){
console.log(err);
res.status(500).json({ success:false });
}

};
const revealResult = async (req,res)=>{

try{

const { serverCode } = req.body;

console.log("Reveal result for server:", serverCode);

const server = await FriendsServer.findOne({
serverCode: serverCode.toUpperCase()
});

if(!server){
return res.status(404).json({
success:false,
message:"Server not found"
});
}

/* mark result revealed */

server.gameReveal = true;

/* find imposters */

let imposters = [];

if(server.gameData && server.gameData.players){

imposters = server.gameData.players
.filter(p => p.role === "imposter")
.map(p => p.name);

}

/* get word */

let word = server.word || null;
let hint = server.hint || null;

await server.save();

res.json({
success:true,
imposters,
word,
hint
});

}catch(err){

console.log("Reveal result error",err);

res.status(500).json({
success:false,
message:"Server error"
});

}

};
const resetFriendsGame = async (req,res)=>{
try{

const { serverCode } = req.body;

const server = await FriendsServer.findOne({
serverCode: serverCode.toUpperCase()
});

if(!server){
return res.status(404).json({
success:false,
message:"Server not found"
});
}

/* ---------------- GET PLAYERS ---------------- */

const players = server.players.map(p => p.name);

/* ---------------- CATEGORY ---------------- */

const categories = server.Selectedcategories || [];

if(categories.length === 0){
return res.status(400).json({
success:false,
message:"No categories saved"
});
}

const randomCategory =
categories[Math.floor(Math.random()*categories.length)];

/* ---------------- GET WORD ---------------- */

const categoryDoc = await additonForCategories.findOne({
categoryName: randomCategory
});

if(!categoryDoc || !categoryDoc.items.length){
return res.status(400).json({
success:false,
message:"No items in category"
});
}

const randomItem =
categoryDoc.items[Math.floor(Math.random()*categoryDoc.items.length)];

/* ---------------- SHUFFLE ---------------- */

const shuffledPlayers = [...players].sort(()=>0.5-Math.random());

/* ---------------- IMPOSTER ---------------- */

const imposterIndex = Math.floor(Math.random()*shuffledPlayers.length);

const finalPlayers = shuffledPlayers.map((name,index)=>{

const isImposter = index === imposterIndex;

return{
name,
role: isImposter ? "imposter":"crewmate",
word: isImposter ? null : randomItem.word,
hint: isImposter ? randomItem.hint : null
};

});

const imposters =
finalPlayers.filter(p=>p.role==="imposter").map(p=>p.name);

/* ---------------- UPDATE SERVER ---------------- */

server.status = "playing";
server.gameStarted = true;
server.gameReveal = false;

server.category = randomCategory;
server.word = randomItem.word;
server.hint = randomItem.hint;
server.imposters = imposters;

server.gameData = {
players: finalPlayers,
category: randomCategory,
imposters: imposters
};

/* IMPORTANT */
server.markModified("gameData");

await server.save();

/* ---------------- RESPONSE ---------------- */

res.json({
success:true,
category:randomCategory,
word:randomItem.word,
hint:randomItem.hint,
imposters
});

}catch(err){

console.log("Reset game error",err);

res.status(500).json({
success:false,
message:"Server error"
});

}
};




const leaveFriendsServer = async (req,res)=>{
try{

let { serverCode, playerName } = req.body;

serverCode = serverCode.trim().toUpperCase();

const server = await FriendsServer.findOne({ serverCode });

if(!server){
return res.status(404).json({
success:false,
message:"Server not found"
});
}

/* ---------- HOST LEFT ---------- */

if(playerName.toLowerCase() === server.hostName.toLowerCase()){

await FriendsServer.deleteOne({ serverCode });

return res.json({
success:true,
serverClosed:true
});

}

/* ---------- NORMAL PLAYER LEFT ---------- */

server.players = server.players.filter(
p => p.name.toLowerCase() !== playerName.toLowerCase()
);

await server.save();

res.json({
success:true,
serverClosed:false
});

}catch(err){

console.log("leave server error",err);

res.status(500).json({ success:false });

}
};



const editProfile = async (req,res)=>{

try{
  const userId = req.user.id;


const { username,bio } = req.body;


const existingUser = await user.findOne({ username, _id: { $ne: userId } });

if (existingUser) {
  return res.status(400).json({
    message: "Username already taken"
  });
}


let avatarPath;

if(req.file){

const fileName = `avatar_${userId}_${Date.now()}.jpg`;

const savePath = path.join("uploads",fileName);

await sharp(req.file.buffer)
.resize(512,512)
.jpeg({quality:80})
.toFile(savePath);
avatarPath = `/uploads/${fileName}`;

}

const updatedUser = await user.findByIdAndUpdate(
userId,
{
username,
bio,
...(avatarPath && { avatar: avatarPath })
},
{new:true}
);

const safeUser = {
  username: updatedUser.username,
  email: updatedUser.email,
  avatar: updatedUser.avatar,
  bio: updatedUser.bio,
  rank: updatedUser.rank,
  credits: updatedUser.credits,
  wins: updatedUser.wins
};

res.json({
  message:"Profile updated",
  user:safeUser
});

}catch(err){

console.log(err);

res.status(500).json({
message:"Server error"
});

}


};


const deleteAccount = async (req,res)=>{
  try{
const {mailID,pass}=req.body;

console.log("Delete account request for:", mailID);
const existingUser = await user.findOne({ email: mailID });
const existingAdmin = await admin.findOne({ email: mailID });

const passCheckUser = existingUser ? await bcrypt.compare(pass, existingUser.password) : false;
const passCheckAdmin = existingAdmin ? await bcrypt.compare(pass, existingAdmin.password) : false;

if(existingUser && passCheckUser){
await user.deleteOne({ email: mailID });
}
else if(existingAdmin && passCheckAdmin){
await admin.deleteOne({ email: mailID });
}

return res.status(200).json({
  message:"Account deleted successfully"    
  } );   

}
  catch(err){

    console.log(err);
}
}
module.exports = {
    loginUser,
    registerUser,
    verifyOTPAndRegister,
    sendResetOTP,
    verifyResetOTP,
    resetPass,
    addgameCon,
    getAllCategories,
    createLocalGame,
  getAppVersion,
startFriendsGame,
  createWithFriends,
  joinWithFriends,
  getServerPlayers,
  removePlayer,
  editProfile,
  deleteAccount,
  revealResult,
  leaveFriendsServer,
  resetFriendsGame

}









