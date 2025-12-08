const asyncHandler = require("express-async-handler");
const Emotion = require("../models/Emotion");
const MusicHistory = require("../models/MusicHistory");
const User = require("../models/User");
const bcrypt = require("bcrypt");

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
    // 디버깅 로그
    console.log('=== /info 페이지 접근 ===');
    console.log('req.user:', req.user);
    console.log('username:', req.user?.username);
    console.log('userID:', req.user?.userID);
    
    // 안전장치
    if (!req.user) {
        console.error('❌ req.user가 없습니다!');
        return res.redirect('/login');
    }
    
    console.log(`✅ 렌더링 데이터: username=${req.user.username}, userID=${req.user.userID}`);
    
    res.render("src/info", {
        username: req.user.username,
        userID: req.user.userID
    });
});

//@desc Update user info
//@route PUT /info
const updateInfo = asyncHandler(async (req, res) => {
    const { username, password, password2 } = req.body;
    const userId = req.user.id;

    // 비밀번호 확인 (비밀번호 변경하는 경우에만)
    if (password) {
        if (password !== password2) {
            return res.status(400).json({
                success: false,
                message: "비밀번호가 일치하지 않습니다."
            });
        }
    }

    // 닉네임 유효성 검증
    if (!username || username.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "닉네임을 입력해주세요."
        });
    }

    // 업데이트할 데이터 준비
    const updateData = {
        username: username.trim()
    };

    // 비밀번호가 입력된 경우에만 해싱 후 추가
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
    }

    // DB 업데이트
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
        return res.status(404).json({
            success: false,
            message: "사용자를 찾을 수 없습니다."
        });
    }

    res.status(200).json({
        success: true,
        message: "정보가 수정되었습니다.",
        data: {
            username: updatedUser.username,
            userID: updatedUser.userID
        }
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
    updateInfo,
    getHistory,
    getFavorites,
    getSettings,
    getQna,
    getEmotionHistory,
    getMusicHistory,
};