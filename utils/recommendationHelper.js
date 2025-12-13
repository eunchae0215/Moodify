const axios = require("axios");
const { getMultilingualKeywordsBatch } = require("./emotionMapper");
const { MUSIC, KEYWORDS, API } = require("../config/constants");

const RECOMMENDATION_API_URL = API.RECOMMENDATION_URL;

/**
 * 키워드 생성 (재생 기록 기반 맞춤형 또는 기본 키워드)
 * @param {string} emotion - 현재 감정
 * @param {Array} playedHistory - 재생 기록 배열
 * @returns {Promise<string[]>} 생성된 키워드 배열
 */
const generateKeywords = async (emotion, playedHistory) => {
  let keywords = [];

  if (playedHistory.length >= MUSIC.MIN_HISTORY_FOR_CUSTOM) {
    // Python에서 맞춤 키워드 생성
    try {
      const keywordResponse = await axios.post(`${RECOMMENDATION_API_URL}/generate-keywords`, {
        emotion: emotion,
        playedHistory: playedHistory.map(music => ({
          videoId: music.youtubeVideoId,
          title: music.videoTitle,
          channelTitle: music.channelTitle,
          playedAt: music.playedAt,
          emotion: music.emotionId?.emotion || 'unknown'
        }))
      });

      if (keywordResponse.data.success && keywordResponse.data.data.keywords.length > 0) {
        keywords = keywordResponse.data.data.keywords;
        console.log(`[Music] Python 맞춤 키워드 생성 완료:`, keywords);
      } else {
        keywords = getMultilingualKeywordsBatch(emotion, KEYWORDS.COUNT_PER_LANGUAGE);
        console.log(`[Music] Python 키워드 생성 실패 - 기본 키워드 사용:`, keywords);
      }
    } catch (error) {
      console.error(`[Music] Python 키워드 생성 실패:`, error.message);
      keywords = getMultilingualKeywordsBatch(emotion, 2);
      console.log(`[Music] 기본 키워드 사용:`, keywords);
    }
  } else {
    keywords = getMultilingualKeywordsBatch(emotion, 2);
    console.log(`[Music] 재생 기록 부족 - 기본 키워드 사용:`, keywords);
  }

  return keywords;
};

/**
 * Python 추천 서버 호출
 * @param {string} userId - 사용자 ID
 * @param {string} emotion - 현재 감정
 * @param {Array} candidateMusic - 후보 음악 목록
 * @param {Array} playedHistory - 재생 기록
 * @returns {Promise<Array>} 추천된 음악 목록
 */
const getRecommendations = async (userId, emotion, candidateMusic, playedHistory) => {
  try {
    const recommendResponse = await axios.post(`${RECOMMENDATION_API_URL}/recommend`, {
      userId: userId,
      emotion: emotion,
      candidateMusic: candidateMusic.map(music => ({
        videoId: music.videoId,
        title: music.title,
        description: music.description || '',
        channelTitle: music.channelTitle,
        thumbnailUrl: music.thumbnailUrl,
        duration: music.duration,
        tags: music.tags || []
      })),
      playedHistory: playedHistory.map(music => ({
        videoId: music.youtubeVideoId,
        title: music.videoTitle,
        channelTitle: music.channelTitle,
        playedAt: music.playedAt,
        emotion: music.emotionId?.emotion || 'unknown'
      }))
    });

    if (recommendResponse.data.success) {
      console.log(`[Music] 추천 서버 응답 성공 - ${recommendResponse.data.data.recommendedMusic.length}개 정렬됨`);
      return recommendResponse.data.data.recommendedMusic;
    } else {
      console.warn(`[Music] 추천 서버 응답 실패 - 원본 순서 사용`);
      return candidateMusic;
    }
  } catch (error) {
    console.error(`[Music] 추천 서버 호출 실패:`, error.message);
    return candidateMusic;
  }
};

module.exports = {
  generateKeywords,
  getRecommendations
};
