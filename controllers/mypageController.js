const asyncHandler = require("express-async-handler");
const Emotion = require("../models/Emotion");
const MusicHistory = require("../models/MusicHistory");
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

//@desc Submit QnA
//@route POST /qna
const submitQna = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    const userID = req.user.userID;

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
        username,
        userID,
        content: content.trim()
    });

    console.log(`[QnA] 새 문의 등록: ${username} (${userID})`);

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

    console.log(`[탈퇴 시작] 사용자: ${username} (${userID})`);

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

        // 4. 사용자 계정 삭제 (마지막)
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
};