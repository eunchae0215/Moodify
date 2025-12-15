const asyncHandler = require("express-async-handler");
const Emotion = require("../models/Emotion");
const MusicHistory = require("../models/MusicHistory");
const Favorite = require("../models/Favorite");
const User = require("../models/User");
const Question = require("../models/Question");
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
    if (!req.user) {
        return res.redirect('/login');
    }
    
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

    // 비밀번호 확인
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
  const query = { userId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (emotion) {
    query.emotion = emotion;
  }

  // 감정 히스토리 조회
  const emotions = await Emotion.find(query).sort({ createdAt: -1 }).limit(100);

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
  const { emotionId } = req.query;
  const query = { userId };

  if (emotionId) {
    query.emotionId = emotionId;
  }

  // 음악 히스토리 조회 
  const musicHistory = await MusicHistory.find(query)
    .sort({ playedAt: -1 })
    .populate("emotionId", "emotion emoji createdAt");

  res.status(200).json({
    success: true,
    message: "음악 히스토리 조회 완료",
    data: {
      totalCount: musicHistory.length,
      musicHistory,
    },
  });
});

//@desc Submit QnA
//@route POST /qna
const submitQna = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;

    // 내용 유효성 검증
    if (!content || content.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "문의 내용을 입력해주세요."
        });
    }

    // Q&A 저장
    const newQna = await Question.create({
        userId,
        content: content.trim()
    });

    res.status(201).json({
        success: true,
        message: "문의가 성공적으로 전송되었습니다!",
        data: {
            id: newQna._id,
            content: newQna.content,
            createdAt: newQna.createdAt
        }
    });
});

//@desc Delete user account
//@route POST /withdraw
const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const username = req.user.username;
    const userID = req.user.userID;

    try {
        // 1. 감정 기록 삭제
        const emotionResult = await Emotion.deleteMany({ userId });
        console.log(`  - 감정 기록 삭제: ${emotionResult.deletedCount}개`);

        // 2. 음악 히스토리 삭제
        const musicResult = await MusicHistory.deleteMany({ userId });
        console.log(`  - 음악 히스토리 삭제: ${musicResult.deletedCount}개`);

        // 3. Q&A 삭제
        const qnaResult = await Question.deleteMany({ userId });
        console.log(`  - Q&A 삭제: ${qnaResult.deletedCount}개`);

        // 4. 사용자 계정 삭제
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "사용자를 찾을 수 없습니다."
            });
        }

        // 5. JWT 토큰 쿠키 삭제
        res.clearCookie('token');

        res.status(200).json({
            success: true,
            message: "회원 탈퇴가 완료되었습니다."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "탈퇴 처리 중 오류가 발생했습니다."
        });
    }
});

// 즐겨찾기 저장
// POST /api/favorites
const saveFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { emotionId, emotion, youtubeVideoId, videoTitle, channelTitle, thumbnailUrl } = req.body;

  if (!emotionId || !emotion || !youtubeVideoId || !videoTitle || !channelTitle || !thumbnailUrl) {
    return res.status(400).json({
      success: false,
      message: "필수 정보가 누락되었습니다.",
    });
  }

  // 이미 저장된 곡인지 확인
  try {
    const existingFavorite = await Favorite.findOne({ userId, youtubeVideoId });

    if (existingFavorite) {
      return res.status(200).json({
        success: true,
        message: "이미 저장된 곡입니다.",
        data: {
          favoriteId: existingFavorite._id,
          alreadyExists: true
        }
      });
    }

    // 새로운 즐겨찾기 저장
    const newFavorite = new Favorite({
      userId,
      emotionId,
      emotion,
      youtubeVideoId,
      videoTitle,
      channelTitle,
      thumbnailUrl,
    });

    await newFavorite.save();

    res.status(201).json({
      success: true,
      message: "즐겨찾기에 추가되었습니다.",
      data: {
        favoriteId: newFavorite._id,
        alreadyExists: false
      },
    });
  } catch (error) {
    console.error("[saveFavorite] 오류:", error);
    res.status(500).json({
      success: false,
      message: "즐겨찾기 저장에 실패했습니다.",
    });
  }
});

// 즐겨찾기 목록 조회
// GET /api/favorites?emotion=happy
const getFavoritesByEmotion = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { emotion } = req.query;

  if (!emotion) {
    return res.status(400).json({
      success: false,
      message: "감정 정보가 필요합니다.",
    });
  }

  const favorites = await Favorite.find({ userId, emotion })
    .sort({ savedAt: -1 });

  res.status(200).json({
    success: true,
    data: favorites,
  });
});

// 즐겨찾기 삭제
// DELETE /api/favorites/:videoId
const deleteFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { videoId } = req.params;

  const result = await Favorite.deleteOne({ userId, youtubeVideoId: videoId });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: "즐겨찾기를 찾을 수 없습니다.",
    });
  }

  res.status(200).json({
    success: true,
    message: "즐겨찾기가 삭제되었습니다.",
  });
});

// 저장된 곡 목록 조회 (체크 표시용)
// POST /api/favorites/check
const checkFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { videoIds } = req.body;

  if (!videoIds || !Array.isArray(videoIds)) {
    return res.status(400).json({
      success: false,
      message: "videoIds 배열이 필요합니다.",
    });
  }

  const favorites = await Favorite.find({
    userId,
    youtubeVideoId: { $in: videoIds }
  }).select('youtubeVideoId');

  const savedVideoIds = favorites.map(fav => fav.youtubeVideoId);

  res.status(200).json({
    success: true,
    data: {
      savedVideoIds
    }
  });
});

// 감정별 즐겨찾기 곡 개수 조회
// GET /api/favorites/count
const getFavoritesCounts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const emotions = ['happy', 'love', 'sleep', 'crying', 'angry', 'excited'];
  const counts = {};

  for (const emotion of emotions) {
    const count = await Favorite.countDocuments({ userId, emotion });
    counts[emotion] = count;
  }

  res.status(200).json({
    success: true,
    data: counts
  });
});

// 사용자 프로필 초기화
// POST /api/user/reset-profile
const resetUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // UserProfile 삭제
    const UserProfile = require('../models/UserProfile');
    const result = await UserProfile.deleteOne({ userId });

    res.status(200).json({
      success: true,
      message: "추천 시스템이 초기화되었습니다.",
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "프로필 초기화 중 오류가 발생했습니다."
    });
  }
});

module.exports = {
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
    getFavoritesCounts,
    resetUserProfile,
};