/**
 * YouTube Data API v3 헬퍼 함수
 * - 다국적 음악 검색
 * - 5분 이하 필터링
 * - 중복 제거
 * - 무한 재생 지원
 */

const axios = require('axios');

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * ISO 8601 duration을 초(seconds)로 변환
 * 예: PT4M33S → 273초, PT1H2M10S → 3730초
 * @param {string} duration - ISO 8601 형식의 duration
 * @returns {number} 초 단위 시간
 */
const parseDuration = (duration) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * 비디오 상세 정보 조회 (duration 포함)
 * @param {string[]} videoIds - 비디오 ID 배열
 * @returns {Promise<Object[]>} 비디오 정보 배열
 */
const getVideoDetails = async (videoIds) => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'contentDetails,snippet',
        id: videoIds.join(',')
      }
    });
    
    return response.data.items.map(item => ({
      videoId: item.id,
      duration: parseDuration(item.contentDetails.duration),
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.high.url
    }));
  } catch (error) {
    console.error('비디오 상세 정보 조회 실패:', error.message);
    throw error;
  }
};

/**
 * 감정 기반 음악 검색 (5분 이하만 필터링)
 * @param {string} keyword - 검색 키워드
 * @param {number} maxResults - 최대 결과 수 (기본값: 10)
 * @param {number} maxDuration - 최대 길이(초) (기본값: 300 = 5분)
 * @returns {Promise<Object[]>} 음악 정보 배열
 */
const searchMusic = async (keyword, maxResults = 10, maxDuration = 300) => {
  try {
    console.log(`[YouTube API] 검색 시작: "${keyword}", 최대 ${maxResults}개`);
    
    // 1단계: 검색 API 호출 (videoDuration: 'short' 추가)
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        q: keyword,
        type: 'video',
        videoCategoryId: '10', // 10 = Music 카테고리
        videoDuration: 'medium', // 🆕 추가: 0~4분 영상만
        videoEmbeddable: 'true', // 🆕 추가: 임베드 가능한 영상만
        videoSyndicated: 'true', // 🆕 추가: 외부 재생 가능한 영상만
        maxResults: Math.min(maxResults * 2, 50), // 필터링 고려해 2배 요청 (최대 50)
        order: 'relevance',
        safeSearch: 'none',
        regionCode: 'KR' // 한국 지역 코드
      }
    });

    const searchItems = searchResponse.data.items;
    
    if (!searchItems || searchItems.length === 0) {
      console.log(`[YouTube API] "${keyword}" 검색 결과 없음`);
      return [];
    }

    // 비디오 ID 추출
    const videoIds = searchItems.map(item => item.id.videoId);

    // 2단계: 비디오 상세 정보 조회 (duration 포함)
    const videoDetails = await getVideoDetails(videoIds);

    // 3단계: 5분 이하 필터링 + 필요한 정보만 추출
    const filteredVideos = videoDetails
      .filter(video => video.duration > 0 && video.duration <= maxDuration)
      .slice(0, maxResults) // 최종 결과 수 제한
      .map(video => ({
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        durationFormatted: formatDuration(video.duration)
      }));

    console.log(`[YouTube API] "${keyword}" 검색 완료: ${filteredVideos.length}개`);
    return filteredVideos;

  } catch (error) {
    if (error.response) {
      // YouTube API 에러 응답
      console.error('YouTube API 에러:', error.response.data);
      throw new Error(`YouTube API 오류: ${error.response.data.error.message}`);
    } else if (error.request) {
      // 네트워크 에러
      console.error('네트워크 에러:', error.message);
      throw new Error('YouTube API 연결 실패');
    } else {
      // 기타 에러
      console.error('음악 검색 실패:', error.message);
      throw error;
    }
  }
};

/**
 * 초를 MM:SS 형식으로 변환
 * @param {number} seconds - 초
 * @returns {string} MM:SS 형식의 시간
 */
const formatDuration = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * 여러 키워드로 음악 검색 (다국적 검색 + 중복 제거)
 * @param {string[]} keywords - 검색 키워드 배열 (예: ['upbeat music', '신나는 노래', '楽しい音楽'])
 * @param {number} resultsPerKeyword - 키워드당 결과 수 (기본값: 10)
 * @param {number} maxDuration - 최대 길이(초) (기본값: 300 = 5분)
 * @param {string[]} excludeVideoIds - 제외할 비디오 ID 배열 (중복 방지용)
 * @returns {Promise<Object[]>} 음악 정보 배열
 */
const searchMultipleKeywords = async (keywords, resultsPerKeyword = 10, maxDuration = 300, excludeVideoIds = []) => {
  try {
    console.log(`[YouTube API] 다중 키워드 검색 시작: ${keywords.length}개 키워드`);
    console.log(`[YouTube API] 제외할 비디오: ${excludeVideoIds.length}개`);
    
    const allResults = [];
    
    for (const keyword of keywords) {
      try {
        const results = await searchMusic(keyword, resultsPerKeyword, maxDuration);
        allResults.push(...results);
        
        // API 할당량 절약을 위한 딜레이 (200ms)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[YouTube API] "${keyword}" 검색 실패:`, error.message);
        // 한 키워드 실패해도 계속 진행
        continue;
      }
    }
    
    console.log(`[YouTube API] 전체 검색 결과: ${allResults.length}개`);
    
    // 중복 제거 (videoId 기준) + 이미 재생한 곡 제외
    const uniqueResults = Array.from(
      new Map(
        allResults
          .filter(item => !excludeVideoIds.includes(item.videoId))
          .map(item => [item.videoId, item])
      ).values()
    );
    
    console.log(`[YouTube API] 중복 제거 후: ${uniqueResults.length}개`);
    
    return uniqueResults;
  } catch (error) {
    console.error('[YouTube API] 다중 키워드 검색 실패:', error.message);
    throw error;
  }
};

/**
 * 🆕 추가 음악 로딩 (무한 재생용)
 * @param {string} emotion - 감정
 * @param {string[]} keywords - 검색 키워드 배열
 * @param {string[]} excludeVideoIds - 이미 재생한 비디오 ID 배열
 * @param {number} count - 가져올 개수 (기본값: 30)
 * @param {number} maxDuration - 최대 길이(초)
 * @returns {Promise<Object[]>} 추가 음악 정보 배열
 */
const loadMoreMusic = async (emotion, keywords, excludeVideoIds = [], count = 30, maxDuration = 300) => {
  try {
    console.log(`[YouTube API] 추가 음악 로딩: ${emotion}, ${count}개 요청`);
    
    // 키워드당 몇 개씩 가져올지 계산
    const resultsPerKeyword = Math.ceil(count / keywords.length);
    
    const results = await searchMultipleKeywords(
      keywords,
      resultsPerKeyword,
      maxDuration,
      excludeVideoIds
    );
    
    console.log(`[YouTube API] 추가 음악 로딩 완료: ${results.length}개`);
    
    return results.slice(0, count); // 요청한 개수만큼만 반환
  } catch (error) {
    console.error('[YouTube API] 추가 음악 로딩 실패:', error.message);
    throw error;
  }
};

/**
 * API 키 유효성 검사
 * @returns {Promise<boolean>} 유효 여부
 */
const validateApiKey = async () => {
  try {
    await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        q: 'test',
        maxResults: 1
      }
    });
    console.log('[YouTube API] API 키 검증 성공');
    return true;
  } catch (error) {
    console.error('[YouTube API] API 키 검증 실패:', error.message);
    return false;
  }
};

/**
 * 🆕 검색 결과 미리보기 (테스트용)
 * @param {string} keyword - 검색 키워드
 * @param {number} count - 결과 개수
 * @returns {Promise<Object>} 검색 결과 요약
 */
const previewSearch = async (keyword, count = 5) => {
  try {
    const results = await searchMusic(keyword, count);
    
    return {
      keyword,
      totalResults: results.length,
      videos: results.map(v => ({
        title: v.title,
        channel: v.channelTitle,
        duration: v.durationFormatted
      }))
    };
  } catch (error) {
    console.error('[YouTube API] 미리보기 실패:', error.message);
    throw error;
  }
};

module.exports = {
  searchMusic,
  searchMultipleKeywords,
  loadMoreMusic,
  validateApiKey,
  parseDuration,
  formatDuration,
  previewSearch
};