// Moodify 애플리케이션 상수 설정
module.exports = {
  // 음악 검색 및 필터링
  MUSIC: {
    MAX_DURATION: 300,        
    SHORTS_THRESHOLD: 60,      
    HISTORY_LIMIT: 20,       
    MIN_HISTORY_FOR_CUSTOM: 5,   
  },

  // 키워드 생성
  KEYWORDS: {
    COUNT_PER_LANGUAGE: 2,      
    MIN_KEYWORD_LENGTH: 3,     
    EMOTION_KEYWORD_COUNT: 4,
    USER_PROFILE_KEYWORD_COUNT: 2 
  },

  // API 설정
  API: {
    RECOMMENDATION_URL: process.env.RECOMMENDATION_API_URL || "http://localhost:5000"
  }
};
