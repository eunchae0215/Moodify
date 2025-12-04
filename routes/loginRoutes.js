const express = require('express');
const router = express.Router();
const {
    getRegister, 
    getlogin, 
    loginUser,
    registerUser,
    checkUserID,
    logout,
} = require("../controllers/loginController");

// 로그인
router.route("/login")
    .get(getlogin)
    .post(loginUser);

// 회원가입
router.route("/signup")
    .get(getRegister)
    .post(registerUser);

// 로그아웃
router.route("/logout")
    .get(logout);

// 중복 확인
router.post("/check-userid", checkUserID); 

module.exports = router;

