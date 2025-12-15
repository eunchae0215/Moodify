const asyncHandler = require("express-async-handler");
const Emotion = require("../models/Emotion");
const MusicHistory = require("../models/MusicHistory");
const UserProfile = require("../models/UserProfile");
const { searchMultipleKeywords, loadMoreMusic } = require("../utils/youtubeApi");
const { generateKeywords, getRecommendations } = require("../utils/recommendationHelper");
const { MUSIC } = require("../config/constants");

//@desc Get index page
//@route GET /index
const getIndex = (req, res) => {
    res.render("src/index");
};

//@desc Get music page
//@route GET /music
const getMusic = asyncHandler(async (req, res) => {
    res.render("src/music_card", {
        username: req.user.username
    });
});

//@desc Get music list page
//@route GET /musiclist
const getMusicList = asyncHandler(async (req, res) => {
    const emotion = req.query.emotion || 'happy';

    res.render("src/favorites_music", {
        emotion: emotion,
        username: req.user.username
    });
});

// 최근 감정 조회 API
// GET /api/emotions/latest
const getLatestEmotion = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 가장 최근 감정 조회
  const latestEmotion = await Emotion.findOne({ userId })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!latestEmotion) {
    return res.status(404).json({
      success: false,
      message: "저장된 감정이 없습니다.",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      emotionId: latestEmotion._id,
      emotion: latestEmotion.emotion,
      emoji: latestEmotion.emoji,
      createdAt: latestEmotion.createdAt,
    },
  });
});

// 감정 저장 API
// POST /api/emotions
const saveEmotion = asyncHandler(async (req, res) => {
  const { emotion, emoji } = req.body;
  const userId = req.user.id;

  if (!emotion || !emoji) {
    return res.status(400).json({
      success: false,
      message: "감정과 이모지는 필수입니다.",
    });
  }

  // 감정 저장
  const newEmotion = new Emotion({
    userId,
    emotion,
    emoji,
  });

  await newEmotion.save();

  res.status(201).json({
    success: true,
    message: "감정이 저장되었습니다.",
    data: {
      emotionId: newEmotion._id,
      emotion: newEmotion.emotion,
      emoji: newEmotion.emoji,
      createdAt: newEmotion.createdAt,
    },
  });
});

// 음악 추천 API 
// POST /api/music/recommend
const recommendMusic = asyncHandler(async (req, res) => {
  const { emotion, count = 50 } = req.body;
  const userId = req.user.id;

  if (!emotion) {
    return res.status(400).json({
      success: false,
      message: "감정을 선택해주세요.",
    });
  }

  console.log("[Music] 음악 추천 요청");

  // 1. 사용자 재생 기록 조회
  const playedHistory = await MusicHistory.find({ userId })
    .populate('emotionId', 'emotion') 
    .sort({ playedAt: -1 })
    .limit(MUSIC.HISTORY_LIMIT)
    .select('youtubeVideoId videoTitle channelTitle playedAt emotionId')
    .lean();

  // 2. 키워드 생성
  const keywords = await generateKeywords(emotion, playedHistory);

  // 3. YouTube 검색
  const resultsPerKeyword = Math.ceil(count / keywords.length);
  const candidateMusic = await searchMultipleKeywords(
    keywords,
    resultsPerKeyword,
    MUSIC.MAX_DURATION,
    [] 
  );

  // 4. Python 추천 서버 호출
  const musicList = await getRecommendations(userId, emotion, candidateMusic, playedHistory);

  // 5. 결과 반환
  res.status(200).json({
    success: true,
    message: "음악 추천이 완료되었습니다.",
    data: {
      emotion,
      keywords,
      totalCount: musicList.length,
      musicList: musicList.slice(0, count),
    },
  });
});

// 추가 음악 로딩 API
// POST /api/music/load-more
const loadMore = asyncHandler(async (req, res) => {
  const { emotion, excludeVideoIds = [], count = 30 } = req.body;
  const userId = req.user.id;

  if (!emotion) {
    return res.status(400).json({
      success: false,
      message: "감정을 선택해주세요.",
    });
  }

  // 1. 사용자 재생 기록 조회
  const playedHistory = await MusicHistory.find({ userId })
    .populate('emotionId', 'emotion') 
    .sort({ playedAt: -1 })
    .limit(MUSIC.HISTORY_LIMIT)
    .select('youtubeVideoId videoTitle channelTitle playedAt emotionId')
    .lean();

  // 2. 키워드 생성 
  const keywords = await generateKeywords(emotion, playedHistory);

  // 3. 추가 음악 검색
  const candidateMusic = await loadMoreMusic(emotion, keywords, excludeVideoIds, count, MUSIC.MAX_DURATION);

  // 4. Python 추천 서버 호출
  const musicList = await getRecommendations(userId, emotion, candidateMusic, playedHistory);

  res.status(200).json({
    success: true,
    message: "추가 음악 로딩이 완료되었습니다.",
    data: {
      emotion,
      totalCount: musicList.length,
      musicList,
    },
  });
});

// 음악 저장 API
// POST /api/music/save
const saveMusic = asyncHandler(async (req, res) => {
  const { emotionId, videoId, title, channelTitle, thumbnailUrl } = req.body;
  const userId = req.user.id;

  if (!emotionId || !videoId || !title) {
    return res.status(400).json({
      success: false,
      message: "필수 정보가 누락되었습니다.",
    });
  }

  // 중복 체크
  const existing = await MusicHistory.findOne({
    userId,
    emotionId,
    youtubeVideoId: videoId,
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: "이미 저장된 음악입니다.",
      data: {
        musicHistoryId: existing._id,
      },
    });
  }

  // 음악 저장
  const newMusic = new MusicHistory({
    userId,
    emotionId,
    youtubeVideoId: videoId,
    videoTitle: title,
    channelTitle: channelTitle || "Unknown",
    thumbnailUrl: thumbnailUrl || "",
    playedAt: new Date(),
    savedAt: new Date(),
  });

  await newMusic.save();

  res.status(201).json({
    success: true,
    message: "음악이 저장되었습니다.",
    data: {
      musicHistoryId: newMusic._id,
    },
  });
});

// 사용자 프로필 업데이트 API (30초 이상 재생 시 호출)
// POST /api/music/update-profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. 최근 재생 기록 조회
    const playedHistory = await MusicHistory.find({ userId })
      .sort({ playedAt: -1 })
      .limit(10)
      .select('youtubeVideoId videoTitle channelTitle playedAt')
      .lean();

    if (playedHistory.length === 0) {
      return res.status(200).json({
        success: true,
        message: "재생 기록이 없어 프로필을 업데이트하지 않았습니다.",
      });
    }

    // 2. Python 서버에 프로필 생성 요청
    // 빈 후보 목록으로 호출하여 사용자 프로필만 생성
    const profileResponse = await axios.post(`${RECOMMENDATION_API_URL}/recommend`, {
      userId: userId,
      candidateMusic: [],
      playedHistory: playedHistory.map(music => ({
        videoId: music.youtubeVideoId,
        title: music.videoTitle,
        channelTitle: music.channelTitle,
        playedAt: music.playedAt
      }))
    });

    if (profileResponse.data.success) {
      const userProfileData = profileResponse.data.data;
      const userProfileVector = userProfileData.userProfile || {};
      const userProfileSize = userProfileData.userProfileSize || 0;

      // 3. UserProfile 컬렉션에 저장 
      await UserProfile.findOneAndUpdate(
        { userId },
        {
          profileVector: userProfileVector,  
          lastUpdated: new Date(),
          musicCount: playedHistory.length,
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: "사용자 프로필이 업데이트되었습니다.",
        data: {
          musicCount: playedHistory.length,
          profileSize: userProfileSize,
          vectorSize: Object.keys(userProfileVector).length
        }
      });
    } else {
      throw new Error("프로필 생성 실패");
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "프로필 업데이트에 실패했습니다.",
    });
  }
});

module.exports = {
    getIndex,
    getMusic,
    getMusicList,
    getLatestEmotion,
    saveEmotion,
    recommendMusic,
    loadMore,
    saveMusic,
    updateUserProfile,
};