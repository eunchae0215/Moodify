// URL 파라미터
let currentEmotion = null;
let currentEmotionId = null;

// YouTube Player
let player = null;
let isPlayerReady = false;

// 음악 데이터
let songs = [];
let currentIndex = 0;
let isPlaying = false;
let isLoadingMore = false;

// UI 요소
const hamburgerMenu = document.getElementById('hamburgerMenu');
const listSectionOverlay = document.getElementById('listSectionOverlay');
const closeListBtn = document.getElementById('closeListBtn');
const musicContainer = document.querySelector('.music-container');
const carouselTrack = document.getElementById('carouselTrack');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');

let isListVisible = false;
let progressInterval = null;

// localStorage에서 음악 리스트 가져오기
function getMusicListFromCache(emotionId) {
  try {
    const key = `musicList_${emotionId}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      console.log(`[Cache] 캐시된 음악 리스트 발견: ${data.songs.length}개`);
      return data;
    }
  } catch (error) {
    console.error('[Cache] 캐시 읽기 오류:', error);
  }
  return null;
}

// localStorage에 음악 리스트 저장
function saveMusicListToCache(emotionId, songsData, currentIdx = 0) {
  try {
    const key = `musicList_${emotionId}`;
    const data = {
      songs: songsData,
      currentIndex: currentIdx,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[Cache] 음악 리스트 저장 완료: ${songsData.length}개`);
  } catch (error) {
    console.error('[Cache] 캐시 저장 오류:', error);
  }
}

// localStorage에서 현재 재생 위치 업데이트
function updateCurrentIndexInCache(emotionId, idx) {
  try {
    const cached = getMusicListFromCache(emotionId);
    if (cached) {
      saveMusicListToCache(emotionId, cached.songs, idx);
    }
  } catch (error) {
    console.error('[Cache] 재생 위치 업데이트 오류:', error);
  }
}

// 초기화
async function init() {
  console.log('[Music Card] 초기화 시작');

  // 1. URL 파라미터 추출
  const urlParams = new URLSearchParams(window.location.search);
  currentEmotion = urlParams.get('emotion');
  currentEmotionId = urlParams.get('emotionId');

  console.log('[Music Card] Emotion:', currentEmotion);
  console.log('[Music Card] EmotionId:', currentEmotionId);

  if (!currentEmotion || !currentEmotionId) {
    alert('잘못된 접근입니다.');
    window.location.href = '/index';
    return;
  }

  // 2. UI 이벤트 설정
  setupUIEvents();

  // 3. YouTube API 로드
  loadYouTubeAPI();

  // 4. 음악 리스트 로드 (캐시 우선)
  await loadInitialMusic();
}

// YouTube IFrame API 로드
function loadYouTubeAPI() {
  console.log('[YouTube] API 로드 시작');
  
  // YouTube IFrame API 스크립트 로드
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
  
  // API 준비 완료 콜백
  window.onYouTubeIframeAPIReady = () => {
    console.log('[YouTube] API 준비 완료');
    createPlayer();
  };
}

function createPlayer() {
  console.log('[YouTube] Player 생성');
  
  // album-art-bg 안에 player div 추가
  const albumArtBg = document.querySelector('.album-art-bg');
  const playerDiv = document.createElement('div');
  playerDiv.id = 'youtubePlayer';
  albumArtBg.appendChild(playerDiv);
  
  // YouTube Player 생성
  player = new YT.Player('youtubePlayer', {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  console.log('[YouTube] Player 준비 완료');
  isPlayerReady = true;
  
  // 첫 곡 로드
  if (songs.length > 0) {
    loadSong(0);
  }
}

function onPlayerStateChange(event) {
  console.log('[YouTube] 상태 변경:', event.data);
  
  // 재생 종료
  if (event.data === YT.PlayerState.ENDED) {
    console.log('[YouTube] 곡 종료');
    onSongEnded();
  }
  
  // 재생 중
  if (event.data === YT.PlayerState.PLAYING) {
    console.log('[YouTube] 재생 시작');
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startProgressTracking();
  }
  
  // 일시정지
  if (event.data === YT.PlayerState.PAUSED) {
    console.log('[YouTube] 일시정지');
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopProgressTracking();
  }
}

// 음악 추천 API
async function loadInitialMusic() {
  console.log('[API] 초기 음악 로딩 시작');

  // 1. 캐시 확인
  const cached = getMusicListFromCache(currentEmotionId);

  if (cached && cached.songs && cached.songs.length > 0) {
    // 캐시된 데이터 사용
    console.log(`[Cache] 캐시 사용 - ${cached.songs.length}개 음악, 재생 위치: ${cached.currentIndex}`);
    songs = cached.songs;
    currentIndex = cached.currentIndex || 0;

    // UI 업데이트
    updateCarousel();
    updateMusicList();

    // 저장된 위치부터 재생 (Player 준비되었으면)
    if (isPlayerReady) {
      loadSong(currentIndex);
    }

    return; // API 호출 안 함!
  }

  // 2. 캐시 없으면 API 호출
  console.log('[Cache] 캐시 없음 - API 호출');

  try {
    const response = await fetch('/api/music/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotion: currentEmotion,
        count: 50
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '음악 추천 실패');
    }

    console.log(`[API] 음악 로딩 완료: ${data.data.totalCount}개`);

    // songs 배열 구성
    songs = data.data.musicList.map(music => ({
      videoId: music.videoId,
      title: music.title,
      artist: music.channelTitle,
      thumbnailUrl: music.thumbnailUrl,
      duration: music.duration
    }));

    // localStorage에 저장
    saveMusicListToCache(currentEmotionId, songs, 0);

    // UI 업데이트
    updateCarousel();
    updateMusicList();

    // 첫 곡 로드 (Player 준비되었으면)
    if (isPlayerReady) {
      loadSong(0);
    }

  } catch (error) {
    console.error('[API] 음악 로딩 실패:', error);
    alert('음악을 불러오는데 실패했습니다.');
  }
}

// 무한 재생 - 추가 로딩
async function loadMoreMusic() {
  if (isLoadingMore) return;
  
  isLoadingMore = true;
  console.log('[API] 추가 음악 로딩 시작');
  
  try {
    // 이미 재생한 곡들의 videoId
    const excludeVideoIds = songs.map(s => s.videoId);
    
    const response = await fetch('/api/music/load-more', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotion: currentEmotion,
        excludeVideoIds: excludeVideoIds,
        count: 30
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '추가 로딩 실패');
    }
    
    console.log(`[API] 추가 로딩 완료: ${data.data.totalCount}개`);
    
    const newSongs = data.data.musicList.map(music => ({
      videoId: music.videoId,
      title: music.title,
      artist: music.channelTitle,
      thumbnailUrl: music.thumbnailUrl,
      duration: music.duration
    }));
    
    // songs 배열에 추가
    songs.push(...newSongs);

    // localStorage 업데이트
    saveMusicListToCache(currentEmotionId, songs, currentIndex);

    // UI 업데이트
    appendToCarousel(newSongs);
    appendToMusicList(newSongs);

    console.log(`[API] 총 곡 수: ${songs.length}개`);
    
  } catch (error) {
    console.error('[API] 추가 로딩 실패:', error);
  } finally {
    isLoadingMore = false;
  }
}

// 곡 로드 & 재생
function loadSong(index) {
  if (index < 0 || index >= songs.length) return;

  console.log(`[Player] 곡 로드: ${index}`);

  currentIndex = index;
  const song = songs[index];

  // localStorage에 재생 위치 업데이트
  updateCurrentIndexInCache(currentEmotionId, index);

  // UI 업데이트
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  totalTimeEl.textContent = formatTime(song.duration);
  currentTimeEl.textContent = formatTime(0);
  progressBar.max = song.duration;
  progressBar.value = 0;
  progressFill.style.width = '0%';

  // YouTube Player에 영상 로드
  if (isPlayerReady && player) {
    player.loadVideoById(song.videoId);
  }

  // Carousel & List 하이라이트
  updateCarouselHighlight(index);
  updateListHighlight(index);
  scrollToIndex(index);

  // DB에 재생 기록 저장
  saveMusicToDB(song);
}

function playSong() {
  if (!isPlayerReady || !player) return;
  
  console.log('[Player] 재생');
  player.playVideo();
}

function pauseSong() {
  if (!isPlayerReady || !player) return;
  
  console.log('[Player] 일시정지');
  player.pauseVideo();
}

function onSongEnded() {
  console.log('[Player] 곡 종료 처리');
  
  // 다음 곡으로
  if (currentIndex < songs.length - 1) {
    loadSong(currentIndex + 1);
    setTimeout(() => playSong(), 500);
  } else {
    // 마지막 곡
    console.log('[Player] 마지막 곡 도달');
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
}

// 진행률 추적
function startProgressTracking() {
  stopProgressTracking();
  
  progressInterval = setInterval(() => {
    if (!player || !isPlayerReady) return;
    
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    
    // UI 업데이트
    currentTimeEl.textContent = formatTime(Math.floor(currentTime));
    progressBar.value = currentTime;
    const percentage = (currentTime / duration) * 100;
    progressFill.style.width = `${percentage}%`;
    
    // 끝에서 3곡 남았을 때 추가 로딩
    if (currentIndex >= songs.length - 3 && !isLoadingMore) {
      console.log('[Player] 추가 로딩 트리거');
      loadMoreMusic();
    }
  }, 1000);
}

function stopProgressTracking() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// UI 업데이트
function updateCarousel() {
  console.log('[UI] Carousel 업데이트');
  
  carouselTrack.innerHTML = '';
  
  songs.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    item.dataset.index = index;
    
    const thumbnailBox = document.createElement('div');
    thumbnailBox.className = 'thumbnail-box';
    
    const img = document.createElement('img');
    img.src = song.thumbnailUrl;
    img.alt = song.title;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    thumbnailBox.appendChild(img);
    item.appendChild(thumbnailBox);
    
    // 클릭 이벤트
    item.addEventListener('click', () => {
      if (index !== currentIndex) {
        loadSong(index);
        playSong();
      }
    });
    
    carouselTrack.appendChild(item);
  });
  
  setupCarousel();
}

function appendToCarousel(newSongs) {
  console.log('[UI] Carousel에 추가:', newSongs.length);
  
  const startIndex = songs.length - newSongs.length;
  
  newSongs.forEach((song, i) => {
    const index = startIndex + i;
    
    const item = document.createElement('div');
    item.className = 'carousel-item';
    item.dataset.index = index;
    
    const thumbnailBox = document.createElement('div');
    thumbnailBox.className = 'thumbnail-box';
    
    const img = document.createElement('img');
    img.src = song.thumbnailUrl;
    img.alt = song.title;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    thumbnailBox.appendChild(img);
    item.appendChild(thumbnailBox);
    
    item.addEventListener('click', () => {
      if (index !== currentIndex) {
        loadSong(index);
        playSong();
      }
    });
    
    carouselTrack.appendChild(item);
  });
}

function updateMusicList() {
  console.log('[UI] Music List 업데이트');
  
  const listScroll = document.querySelector('.list-scroll-overlay');
  listScroll.innerHTML = '';
  
  songs.forEach((song, index) => {
    const item = createMusicListItem(song, index);
    listScroll.appendChild(item);
  });
}

function appendToMusicList(newSongs) {
  console.log('[UI] Music List에 추가:', newSongs.length);
  
  const listScroll = document.querySelector('.list-scroll-overlay');
  const startIndex = songs.length - newSongs.length;
  
  newSongs.forEach((song, i) => {
    const index = startIndex + i;
    const item = createMusicListItem(song, index);
    listScroll.appendChild(item);
  });
}

function createMusicListItem(song, index) {
  const item = document.createElement('div');
  item.className = 'music-item-overlay';
  item.dataset.index = index;
  
  const thumbnail = document.createElement('div');
  thumbnail.className = 'music-thumbnail-overlay';
  const img = document.createElement('img');
  img.src = song.thumbnailUrl;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  thumbnail.appendChild(img);
  
  const details = document.createElement('div');
  details.className = 'music-details-overlay';
  const title = document.createElement('h3');
  title.className = 'music-title-overlay';
  title.textContent = song.title;
  const artist = document.createElement('p');
  artist.className = 'music-artist-overlay';
  artist.textContent = song.artist;
  details.appendChild(title);
  details.appendChild(artist);
  
  const actions = document.createElement('div');
  actions.className = 'music-actions-overlay';
  
  const playBtnItem = document.createElement('button');
  playBtnItem.className = 'play-item-btn-overlay';
  playBtnItem.innerHTML = '<i class="fas fa-play"></i>';
  playBtnItem.addEventListener('click', (e) => {
    e.stopPropagation();
    loadSong(index);
    playSong();
  });
  
  const addBtnItem = document.createElement('button');
  addBtnItem.className = 'add-item-btn-overlay';
  addBtnItem.innerHTML = '<i class="fas fa-plus-circle"></i>';
  addBtnItem.addEventListener('click', (e) => {
    e.stopPropagation();
    saveMusicToHistory(song);
  });
  
  actions.appendChild(playBtnItem);
  actions.appendChild(addBtnItem);
  
  item.appendChild(thumbnail);
  item.appendChild(details);
  item.appendChild(actions);
  
  item.addEventListener('click', () => {
    loadSong(index);
  });
  
  return item;
}

function updateCarouselHighlight(index) {
  const items = document.querySelectorAll('.carousel-item');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateListHighlight(index) {
  const items = document.querySelectorAll('.music-item-overlay');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 음악 저장 API
async function saveMusicToHistory(song) {
  console.log('[API] 음악 저장:', song.title);
  
  try {
    const response = await fetch('/api/music/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotionId: currentEmotionId,
        videoId: song.videoId,
        title: song.title,
        channelTitle: song.artist,
        thumbnailUrl: song.thumbnailUrl
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('재생목록에 저장되었습니다!');
    } else {
      alert(data.message || '저장 실패');
    }
  } catch (error) {
    console.error('[API] 저장 실패:', error);
    alert('저장에 실패했습니다.');
  }
}

// Carousel 스크롤
function setupCarousel() {
  const items = document.querySelectorAll('.carousel-item');
  
  // 마우스 휠
  carouselTrack.addEventListener('wheel', (e) => {
    e.preventDefault();
    carouselTrack.scrollLeft += e.deltaY;
  }, { passive: false });
  
  // 스크롤 이벤트
  let scrollTimeout;
  carouselTrack.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    update3DEffect();
    
    scrollTimeout = setTimeout(() => {
      snapToCenter();
    }, 150);
  });
}

function scrollToIndex(index) {
  const items = document.querySelectorAll('.carousel-item');
  const item = items[index];
  if (!item) return;
  
  item.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  });
  
  setTimeout(() => {
    update3DEffect();
  }, 300);
}

function snapToCenter() {
  const scrollLeft = carouselTrack.scrollLeft;
  const containerWidth = carouselTrack.offsetWidth;
  const containerCenter = scrollLeft + containerWidth / 2;
  
  const items = document.querySelectorAll('.carousel-item');
  let closestIndex = 0;
  let minDistance = Infinity;
  
  items.forEach((item, index) => {
    const itemLeft = item.offsetLeft;
    const itemCenter = itemLeft + item.offsetWidth / 2;
    const distance = Math.abs(containerCenter - itemCenter);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });
  
  scrollToIndex(closestIndex);
  
  if (closestIndex !== currentIndex) {
    loadSong(closestIndex);
  }
}

function update3DEffect() {
  const scrollLeft = carouselTrack.scrollLeft;
  const containerWidth = carouselTrack.offsetWidth;
  const containerCenter = scrollLeft + containerWidth / 2;
  
  const items = document.querySelectorAll('.carousel-item');
  items.forEach((item) => {
    const itemLeft = item.offsetLeft;
    const itemWidth = item.offsetWidth;
    const itemCenter = itemLeft + itemWidth / 2;
    const distance = itemCenter - containerCenter;
    const absDistance = Math.abs(distance);
    
    item.classList.remove('center', 'near-left', 'near-right', 'far-left', 'far-right');
    
    if (absDistance < 50) {
      item.classList.add('center');
    } else if (distance < 0 && absDistance < 250) {
      item.classList.add('near-left');
    } else if (distance > 0 && absDistance < 250) {
      item.classList.add('near-right');
    } else if (distance < 0) {
      item.classList.add('far-left');
    } else {
      item.classList.add('far-right');
    }
  });
}

// UI 이벤트
function setupUIEvents() {
  // 햄버거 메뉴
  hamburgerMenu.addEventListener('click', () => {
    isListVisible = true;
    listSectionOverlay.classList.add('visible');
    musicContainer.classList.add('list-open');
    document.querySelector('.music-page').classList.add('list-active');
  });
  
  closeListBtn.addEventListener('click', () => {
    isListVisible = false;
    listSectionOverlay.classList.remove('visible');
    musicContainer.classList.remove('list-open');
    document.querySelector('.music-page').classList.remove('list-active');
  });
  
  // 재생/일시정지
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  });
  
  // 이전 곡
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      loadSong(currentIndex - 1);
      playSong();
    }
  });
  
  // 다음 곡
  nextBtn.addEventListener('click', () => {
    if (currentIndex < songs.length - 1) {
      loadSong(currentIndex + 1);
      playSong();
    }
  });
  
  // 진행바 조작
  progressBar.addEventListener('input', () => {
    if (isPlayerReady && player) {
      const seekTime = parseInt(progressBar.value);
      player.seekTo(seekTime);
    }
  });
  
  // 키보드 단축키
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn.click();
    } else if (e.key === ' ') {
      e.preventDefault();
      playBtn.click();
    }
  });
}

// DB 저장
async function saveMusicToDB(song) {
  try {
    console.log(`[DB] 음악 저장 시도: ${song.title}`);

    const response = await fetch('/api/music/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotionId: currentEmotionId,
        videoId: song.videoId,
        title: song.title,
        channelTitle: song.artist,
        thumbnailUrl: song.thumbnailUrl
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[DB] 음악 저장 완료: ${song.title}`);
    } else {
      console.warn(`[DB] 음악 저장 실패: ${data.message}`);
    }
  } catch (error) {
    console.error('[DB] 음악 저장 오류:', error);
    // 저장 실패해도 재생은 계속됨 (사용자 경험 유지)
  }
}

// 유틸리티
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

init();