const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/checkLogin');
const { requireAuth } = require("../middlewares/authMiddleware"); 
const {
    getMypage,
    getInfo,
    updateInfo,
    getHistory,
    getFavorites,
    getSettings,
    getQna,
    submitQna,
    deleteAccount,
    getEmotionHistory,
    getMusicHistory,
    saveFavorite,
    getFavoritesByEmotion,
    deleteFavorite,
    checkFavorites,
    getFavoritesCounts
} = require('../controllers/mypageController');

// 마이페이지
router.route("/mypage").get(checkLogin, getMypage);

// 내 정보 수정
router.route("/info")
    .get(checkLogin, getInfo)
    .put(requireAuth, updateInfo);

// 히스토리
router.route("/history").get(checkLogin, getHistory);

// 저장한 음악
router.route("/favorites").get(checkLogin, getFavorites);

// 설정
router.route("/settings").get(checkLogin, getSettings);

// Q&A
router.route("/qna")
    .get(checkLogin, getQna)
    .post(requireAuth, submitQna);

router.get("/api/emotions/history", requireAuth, getEmotionHistory);
router.get("/api/music/history", requireAuth, getMusicHistory);

// 즐겨찾기 API
router.post("/api/favorites", requireAuth, saveFavorite);
router.get("/api/favorites", requireAuth, getFavoritesByEmotion);
router.delete("/api/favorites/:videoId", requireAuth, deleteFavorite);
router.post("/api/favorites/check", requireAuth, checkFavorites);
router.get("/api/favorites/count", requireAuth, getFavoritesCounts);

// 회원 탈퇴
router.post("/withdraw", requireAuth, deleteAccount);

module.exports = router;