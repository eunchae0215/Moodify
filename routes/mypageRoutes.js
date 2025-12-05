const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/checkLogin');
const {
    getMypage,
    getInfo,
    getHistory,
    getFavorites,
    getSettings,
    getQna
} = require('../controllers/mypageController');

// 마이페이지
router.route("/mypage")
    .get(checkLogin, getMypage);

// 내 정보 수정
router.route("/info")
    .get(checkLogin, getInfo);

// 히스토리
router.route("/history")
    .get(checkLogin, getHistory);

// 저장한 음악
router.route("/favorites")
    .get(checkLogin, getFavorites);

// 설정
router.route("/settings")
    .get(checkLogin, getSettings);

// Q&A
router.route("/qna")
    .get(checkLogin, getQna);

module.exports = router;