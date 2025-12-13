const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/checkLogin');
const mainController = require("../controllers/mainController");
const { requireAuth } = require("../middlewares/authMiddleware");

const {
    getIndex,
    getMusic,
    getMusicList
} = require('../controllers/mainController');

// 메인 페이지
router.route("/index").get(getIndex);

// 음악 재생 페이지
router.route("/music").get(checkLogin, getMusic);

// 음악 리스트 페이지
router.route("/musiclist").get(checkLogin, getMusicList);

router.get("/api/emotions/latest", requireAuth, mainController.getLatestEmotion);
router.post("/api/emotions", requireAuth, mainController.saveEmotion);
router.post("/api/music/recommend", requireAuth, mainController.recommendMusic);
router.post("/api/music/load-more", requireAuth, mainController.loadMore);
router.post("/api/music/save", requireAuth, mainController.saveMusic);
router.post("/api/music/update-profile", requireAuth, mainController.updateUserProfile);

module.exports = router;