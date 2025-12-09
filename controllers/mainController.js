const asyncHandler = require("express-async-handler");
const Emotion = require("../models/Emotion");
const MusicHistory = require("../models/MusicHistory");
const { getMultilingualKeywordsBatch } = require("../utils/emtionMapper");
const { searchMultipleKeywords, loadMoreMusic } = require("../utils/youtubeApi");

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
    const mood = req.query.mood || 'happy';
    
    // 나중에 DB에서 해당 감정의 음악 리스트 가져오기
    // const musicList = await getMusicByMood(mood);
    
    res.render("src/favorites_music", {
        mood: mood,
        username: req.user.username
        // musicList: musicList  // DB 연결 후 추가
    });
});

// 최근 감정 조회 API
// GET /api/emotions/latest
const getLatestEmotion = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 가장 최근 감정 조회
  const latestEmotion = await Emotion.findOne({ userId })
    .sort({ timestamp: -1 })
    .limit(1);

  if (!latestEmotion) {
    return res.status(404).json({
      success: false,
      message: "저장된 감정이 없습니다.",
    });
  }

  console.log(`[Emotion] 최근 감정 조회: ${latestEmotion.emotion} (User: ${req.user.username})`);

  res.status(200).json({
    success: true,
    data: {
      emotionId: latestEmotion._id,
      emotion: latestEmotion.emotion,
      emoji: latestEmotion.emoji,
      timestamp: latestEmotion.timestamp,
    },
  });
});

// 감정 저장 API
// POST /api/emotions
const saveEmotion = asyncHandler(async (req, res) => {
  const { emotion, emoji, memo } = req.body;
  const userId = req.user.id; // authMiddleware에서 설정됨

  // 필수 값 체크
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
    memo: memo || null,
    timestamp: new Date(),
  });

  await newEmotion.save();

  console.log(`[Emotion] 감정 저장 완료: ${emotion} (User: ${req.user.username})`);

  res.status(201).json({
    success: true,
    message: "감정이 저장되었습니다.",
    data: {
      emotionId: newEmotion._id,
      emotion: newEmotion.emotion,
      emoji: newEmotion.emoji,
      timestamp: newEmotion.timestamp,
    },
  });
});

// 음악 추천 API (최초 검색)
// POST /api/music/recommend
const recommendMusic = asyncHandler(async (req, res) => {
  const { emotion, count = 50 } = req.body;
  const userId = req.user.id;

  // 필수 값 체크
  if (!emotion) {
    return res.status(400).json({
      success: false,
      message: "감정을 선택해주세요.",
    });
  }

  console.log(`[Music] 음악 추천 요청: ${emotion}, ${count}개 (User: ${req.user.username})`);

  // 1. 다국적 키워드 생성 (언어당 2개씩, 총 6개)
  const keywords = getMultilingualKeywordsBatch(emotion, 2);
  console.log(`[Music] 생성된 키워드:`, keywords);

  // 2. YouTube 검색 (키워드당 결과 수 계산)
  const resultsPerKeyword = Math.ceil(count / keywords.length);
  const musicList = await searchMultipleKeywords(
    keywords,
    resultsPerKeyword,
    300, // 5분 이하
    [] // 제외할 비디오 없음
  );

  console.log(`[Music] 검색 완료: ${musicList.length}개`);

  // 3. 결과 반환
  res.status(200).json({
    success: true,
    message: "음악 추천이 완료되었습니다.",
    data: {
      emotion,
      keywords,
      totalCount: musicList.length,
      musicList: musicList.slice(0, count), // 요청한 개수만큼만
    },
  });
});

// 추가 음악 로딩 API (무한 재생용)
// POST /api/music/load-more
const loadMore = asyncHandler(async (req, res) => {
  const { emotion, excludeVideoIds = [], count = 30 } = req.body;
  const userId = req.user.id;

  // 필수 값 체크
  if (!emotion) {
    return res.status(400).json({
      success: false,
      message: "감정을 선택해주세요.",
    });
  }

  console.log(`[Music] 추가 로딩 요청: ${emotion}, ${count}개, 제외: ${excludeVideoIds.length}개`);

  // 1. 다국적 키워드 생성
  const keywords = getMultilingualKeywordsBatch(emotion, 2);

  // 2. 추가 음악 검색 (이미 재생한 곡 제외)
  const musicList = await loadMoreMusic(emotion, keywords, excludeVideoIds, count, 300);

  console.log(`[Music] 추가 로딩 완료: ${musicList.length}개`);

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

// 음악 저장 API (재생목록에 추가)
// POST /api/music/save

const saveMusic = asyncHandler(async (req, res) => {
  const { emotionId, videoId, title, channelTitle, thumbnailUrl } = req.body;
  const userId = req.user.id;

  // 필수 값 체크
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

  console.log(`[Music] 음악 저장 완료: ${title} (User: ${req.user.username})`);

  res.status(201).json({
    success: true,
    message: "음악이 저장되었습니다.",
    data: {
      musicHistoryId: newMusic._id,
    },
  });
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
};