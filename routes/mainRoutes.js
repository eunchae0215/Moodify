const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/checkLogin');
const {
    getIndex,
    getMusic,
    getMusicList
} = require('../controllers/musicController');

// 메인 페이지
router.route("/index")
    .get(getIndex);

// 음악 재생 페이지
router.route("/music")
    .get(checkLogin, getMusic);

// 음악 리스트 페이지
router.route("/musiclist")
    .get(checkLogin, getMusicList);

module.exports = router;