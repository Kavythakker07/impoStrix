app.set("trust proxy", 1);
const upload = require("../utils/avatarDeploy");


const verifyToken = require("../middleware/verifyToken"); // ✅ Correct Import


const express = require("express");
const { loginUser,registerUser,verifyOTPAndRegister,sendResetOTP,verifyResetOTP,resetPass,addgameCon,getAllCategories,createLocalGame,joinWithFriends,createWithFriends,startFriendsGame,getAppVersion,getServerPlayers,revealResult,resetFriendsGame,editProfile,deleteAccount,removePlayer,leaveFriendsServer} = require("../controllers/authController"); // ✅ Correct Import

const router = express.Router();
// const authCtrl = require("../controllers/authController");
router.post("/resetFriendsGame", resetFriendsGame);
router.post("/leaveFriendsServer", leaveFriendsServer);
// Route for user registration

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/verify", verifyOTPAndRegister);

router.post("/sendResetOTP", sendResetOTP);
router.post("/verifyResetOTP", verifyResetOTP);
router.post("/resetPass", resetPass);
router.post("/addgameCon", addgameCon);

router.get("/allCategories", getAllCategories);
router.post("/createWithFriends", createWithFriends);

router.post("/joinWithFriends", joinWithFriends);


router.get("/version", getAppVersion);

router.post("/startFriendsGame", startFriendsGame);


router.get("/getServerPlayers", getServerPlayers);


router.post("/createLocalGame", createLocalGame);
router.post("/removePlayer", removePlayer);

router.post(
"/profile/edit",
verifyToken,
upload.single("avatar"),
editProfile
);
router.post("/deleteAccount", deleteAccount);

router.post("/revealResult", revealResult);

module.exports = router;
