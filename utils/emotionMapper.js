/**
 * 감정을 YouTube 검색 키워드로 매핑하는 유틸리티 (다국적 버전)
 */

const emotionKeywords = {
  happy: {
    en: ['upbeat music', 'happy songs', 'feel good music', 'cheerful music', 'positive vibes music'],
    ko: ['신나는 노래', '기분 좋은 음악', '즐거운 노래', '행복한 노래', '밝은 음악'],
    ja: ['楽しい音楽', '明るい曲', 'ハッピーソング', '元気な音楽', 'ポジティブミュージック']
  },
  love: {
    en: ['love songs', 'romantic music', 'ballad love', 'sweet music', 'emotional love songs'],
    ko: ['사랑 노래', '로맨틱한 음악', '달달한 노래', '연애 노래', '감성 발라드'],
    ja: ['ラブソング', 'ロマンティック音楽', '恋愛ソング', '甘い音楽', '感動的な愛の歌']
  },
  sleep: {
    en: ['relaxing music', 'calm music', 'sleep music', 'peaceful music', 'meditation music'],
    ko: ['잔잔한 음악', '편안한 노래', '수면 음악', '조용한 노래', '명상 음악'],
    ja: ['リラックス音楽', '癒しの音楽', '睡眠音楽', '穏やかな音楽', '瞑想音楽']
  },
  crying: {
    en: ['sad music', 'melancholy songs', 'emotional ballad', 'heartbreak songs', 'tearjerker music'],
    ko: ['슬픈 노래', '우울한 음악', '이별 노래', '감성 발라드', '눈물 나는 노래'],
    ja: ['悲しい音楽', '切ない曲', '失恋ソング', 'メランコリー音楽', '涙の歌']
  },
  angry: {
    en: ['rock music', 'powerful songs', 'intense music', 'heavy metal', 'aggressive music'],
    ko: ['락 음악', '강렬한 노래', '힙합 음악', '파워풀한 노래', '분노 해소 음악'],
    ja: ['ロック音楽', '激しい音楽', 'ヘビーメタル', 'パワフルな曲', 'アグレッシブ音楽']
  },
  excited: {
    en: ['energetic music', 'party music', 'hype songs', 'pump up music', 'dance music'],
    ko: ['신나는 댄스', '파티 음악', '흥겨운 노래', '텐션 업 음악', '클럽 음악'],
    ja: ['エネルギッシュ音楽', 'パーティー音楽', 'ダンスミュージック', 'ハイプ音楽', '盛り上がる曲']
  }
};

/**
 * 다국적 키워드 반환 (각 언어에서 N개씩)
 * @param {string} emotion - 감정
 * @param {number} countPerLanguage - 언어당 키워드 개수 (기본 2개)
 * @returns {string[]} 키워드 배열
 */
const getMultilingualKeywordsBatch = (emotion, countPerLanguage = 2) => {
  const keywords = emotionKeywords[emotion];

  if (!keywords) {
    throw new Error(`Invalid emotion: ${emotion}. Valid emotions are: ${Object.keys(emotionKeywords).join(', ')}`);
  }

  const result = [];

  // 영어 키워드
  const enShuffled = [...keywords.en].sort(() => Math.random() - 0.5);
  result.push(...enShuffled.slice(0, countPerLanguage));

  // 한국어 키워드
  const koShuffled = [...keywords.ko].sort(() => Math.random() - 0.5);
  result.push(...koShuffled.slice(0, countPerLanguage));

  // 일본어 키워드
  const jaShuffled = [...keywords.ja].sort(() => Math.random() - 0.5);
  result.push(...jaShuffled.slice(0, countPerLanguage));

  return result;
};

module.exports = {
  getMultilingualKeywordsBatch
};