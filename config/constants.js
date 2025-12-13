/**
 * Moodify 애플리케이션 상수 설정
 */

module.exports = {
  // 음악 검색 및 필터링
  MUSIC: {
    MAX_DURATION: 300,           // 최대 곡 길이 (초) - 5분
    SHORTS_THRESHOLD: 60,        // 숏폼 판별 기준 (초)
    HISTORY_LIMIT: 20,           // 재생 기록 조회 개수
    MIN_HISTORY_FOR_CUSTOM: 5,   // 맞춤 키워드 생성 최소 기록 수
  },

  // 키워드 생성
  KEYWORDS: {
    COUNT_PER_LANGUAGE: 2,       // 언어당 키워드 개수
    MIN_KEYWORD_LENGTH: 3,       // 최소 키워드 길이
    EMOTION_KEYWORD_COUNT: 4,    // 감정 키워드 개수
    USER_PROFILE_KEYWORD_COUNT: 2 // 사용자 프로필 키워드 개수
  },

  // API 설정
  API: {
    RECOMMENDATION_URL: process.env.RECOMMENDATION_API_URL || "http://localhost:5000"
  }
};
