const asyncHandler = require("express-async-handler");
const Emotion = require("../models/Emotion");
const MusicHistory = require("../models/MusicHistory");

//@desc Get mypage
//@route GET /mypage
const getMypage = asyncHandler(async (req, res) => {
    res.render("src/mypage", {
        username: req.user.username,
        userID: req.user.userID
    });
});

//@desc Get info page
//@route GET /info
const getInfo = asyncHandler(async (req, res) => {
    res.render("src/info", {
        username: req.user.username,
        userID: req.user.userID
    });
});

//@desc Get history page
//@route GET /history
const getHistory = asyncHandler(async (req, res) => {
    res.render("src/history", {
        username: req.user.username
    });
});

//@desc Get favorites page
//@route GET /favorites
const getFavorites = asyncHandler(async (req, res) => {
    res.render("src/favorites", {
        username: req.user.username
    });
});

//@desc Get settings page
//@route GET /settings
const getSettings = asyncHandler(async (req, res) => {
    res.render("src/settings", {
        username: req.user.username
    });
});

//@desc Get QnA page
//@route GET /qna
const getQna = asyncHandler(async (req, res) => {
    res.render("src/qna", {
        username: req.user.username
    });
});

// 감정 히스토리 조회 API
// GET /api/emotions/history
const getEmotionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, emotion } = req.query;

  // 쿼리 조건 생성
  const query = { userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (emotion) {
    query.emotion = emotion;
  }

  // 감정 히스토리 조회
  const emotions = await Emotion.find(query).sort({ timestamp: -1 }).limit(100);

  console.log(`[Emotion] 히스토리 조회: ${emotions.length}개 (User: ${req.user.username})`);

  res.status(200).json({
    success: true,
    message: "감정 히스토리 조회 완료",
    data: {
      totalCount: emotions.length,
      emotions,
    },
  });
});

// 음악 히스토리 조회 API
// GET /api/music/history
const getMusicHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { emotionId, liked } = req.query;

  // 쿼리 조건 생성
  const query = { userId };

  if (emotionId) {
    query.emotionId = emotionId;
  }

  if (liked !== undefined) {
    query.liked = liked === "true";
  }

  // 음악 히스토리 조회
  const musicHistory = await MusicHistory.find(query)
    .sort({ playedAt: -1 })
    .limit(100)
    .populate("emotionId", "emotion emoji timestamp");

  console.log(`[Music] 히스토리 조회: ${musicHistory.length}개 (User: ${req.user.username})`);

  res.status(200).json({
    success: true,
    message: "음악 히스토리 조회 완료",
    data: {
      totalCount: musicHistory.length,
      musicHistory,
    },
  });
});

module.exports = {
    getMypage,
    getInfo,
    getHistory,
    getFavorites,
    getSettings,
    getQna,
    getEmotionHistory,
    getMusicHistory,
};