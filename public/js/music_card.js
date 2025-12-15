// 자동재생 설정 체크 함수
function isAutoPlayEnabled() {
  const autoPlay = localStorage.getItem('moodify_auto_play');
  const result = autoPlay === null || autoPlay === 'true';
  console.log('[AutoPlay Check] localStorage value:', autoPlay);
  console.log('[AutoPlay Check] Result:', result ? 'ENABLED' : 'DISABLED');
  return result;
}

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
let savedVideoIds = new Set(); 

// 30초 재생 체크
let playStartTime = null;
let has30SecondsPassed = false;
let check30SecondsTimer = null;

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
      return data;
    }
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
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
    console.error(error);
  }
}

// 초기화
async function init() {
  // 1. URL 파라미터 추출
  const urlParams = new URLSearchParams(window.location.search);
  currentEmotion = urlParams.get('emotion');
  currentEmotionId = urlParams.get('emotionId');

  if (!currentEmotion || !currentEmotionId) {
    alert('잘못된 접근입니다.');
    window.location.href = '/index';
    return;
  }

  setupUIEvents();
  loadYouTubeAPI();
  await loadInitialMusic();
  await loadSavedFavorites();
}

// YouTube IFrame API 로드
function loadYouTubeAPI() {
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
  isPlayerReady = true;
  
  // 첫 곡 로드
  if (songs.length > 0) {
    loadSong(0);
  }
}

function onPlayerStateChange(event) {
  // 재생
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startProgressTracking();
    start30SecondCheck();
  }

  // 일시정지
  if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopProgressTracking();
    stop30SecondCheck();
  }

  // 재생 종료
  if (event.data === YT.PlayerState.ENDED) {
    stop30SecondCheck();
    onSongEnded();
  }
}

// 30초 재생 체크 시작
function start30SecondCheck() {
  stop30SecondCheck();

  playStartTime = Date.now();
  has30SecondsPassed = false;

  check30SecondsTimer = setTimeout(() => {
    has30SecondsPassed = true;
    console.log('[30s Check] 30초 경과 - 사용자 취향 업데이트 대상');

    markAs30SecondsPlayed(songs[currentIndex]);
  }, 30000); 
}

// 30초 재생 체크 중지
function stop30SecondCheck() {
  if (check30SecondsTimer) {
    clearTimeout(check30SecondsTimer);
    check30SecondsTimer = null;
  }
}

// 30초 이상 재생한 곡으로 표시
async function markAs30SecondsPlayed(song) {
  if (!song) return;

  // 사용자 프로필 업데이트 API 호출
  try {
    const response = await fetch('/api/music/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

  } catch (error) {
    console.error(error);
  }
}

// 음악 추천 API
async function loadInitialMusic() {
  // 1. 캐시 확인
  const cached = getMusicListFromCache(currentEmotionId);

  if (cached && cached.songs && cached.songs.length > 0) {
    // 캐시된 데이터 사용
    songs = cached.songs;
    currentIndex = cached.currentIndex || 0;

    updateCarousel();
    updateMusicList();

    // 저장된 위치부터 재생 
    if (isPlayerReady) {
      loadSong(currentIndex);
    }

    return; 
  }

  // 2. 캐시 없으면 API 호출
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
    updateCarousel();
    updateMusicList();

    // 첫 곡 로드
    if (isPlayerReady) {
      loadSong(0);
    }

  } catch (error) {
    console.error(error);
    alert('음악을 불러오는데 실패했습니다.');
  }
}

// 무한 재생 - 추가 로딩
async function loadMoreMusic() {
  if (isLoadingMore) return;

  isLoadingMore = true;

  try {
    let newSongs = [];

    // 이미 재생한 곡 제외
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

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.data.musicList.length > 0) {
        newSongs = data.data.musicList.map(music => ({
          videoId: music.videoId,
          title: music.title,
          artist: music.channelTitle || 'Unknown',
          thumbnailUrl: music.thumbnailUrl || `https://i.ytimg.com/vi/${music.videoId}/default.jpg`,
          duration: music.duration || 180
        }));
      }
    }

    // songs 배열에 추가
    songs.push(...newSongs);

    // localStorage 업데이트
    saveMusicListToCache(currentEmotionId, songs, currentIndex);

    appendToCarousel(newSongs);
    appendToMusicList(newSongs);
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingMore = false;
  }
}

// 알림 표시 함수
function showNotification(message) {
  // 간단한 알림 표시
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 곡 로드 & 재생
function loadSong(index) {
  if (index < 0 || index >= songs.length) return;

  currentIndex = index;
  const song = songs[index];

  // localStorage에 재생 위치 업데이트
  updateCurrentIndexInCache(currentEmotionId, index);

  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  totalTimeEl.textContent = formatTime(song.duration);
  currentTimeEl.textContent = formatTime(0);
  progressBar.max = song.duration;
  progressBar.value = 0;
  progressFill.style.width = '0%';

  checkAndApplyMarquee();

  // YouTube Player에 영상 로드
  if (isPlayerReady && player) {
    if (isAutoPlayEnabled()) {
      player.loadVideoById(song.videoId);
    } else {
      player.cueVideoById(song.videoId);
    }
  }

  updateCarouselHighlight(index);
  updateListHighlight(index);
  scrollToIndex(index);

  saveMusicToDB(song);
}

function playSong() {
  if (!isPlayerReady || !player) return;
  
  player.playVideo();
}

function pauseSong() {
  if (!isPlayerReady || !player) return;
  
  player.pauseVideo();
}

function onSongEnded() {
  if (currentIndex < songs.length - 1) {
    loadSong(currentIndex + 1);

    if (isAutoPlayEnabled()) {
      setTimeout(() => playSong(), 500);
    } 
  } else {
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
    
    currentTimeEl.textContent = formatTime(Math.floor(currentTime));
    progressBar.value = currentTime;
    const percentage = (currentTime / duration) * 100;
    progressFill.style.width = `${percentage}%`;
    
    // 끝에서 3곡 남았을 때 추가 로딩
    if (currentIndex >= songs.length - 5 && !isLoadingMore) {
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

function updateCarousel() {
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
  const listScroll = document.querySelector('.list-scroll-overlay');
  listScroll.innerHTML = '';
  
  songs.forEach((song, index) => {
    const item = createMusicListItem(song, index);
    listScroll.appendChild(item);
  });
}

function appendToMusicList(newSongs) {
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
    if (isAutoPlayEnabled()) {
      playSong();
    }
  });
  
  const addBtnItem = document.createElement('button');
  addBtnItem.className = 'add-item-btn-overlay';
  addBtnItem.dataset.videoId = song.videoId;

  // 이미 저장된 곡이면 체크 아이콘, 아니면 플러스 아이콘
  const isSaved = savedVideoIds.has(song.videoId);
  addBtnItem.innerHTML = isSaved
    ? '<i class="fas fa-check-circle"></i>'
    : '<i class="fas fa-plus-circle"></i>';

  addBtnItem.addEventListener('click', async (e) => {
    e.stopPropagation();
    await saveMusicToFavorite(song, addBtnItem);
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
    console.error(error);
    alert('저장에 실패했습니다.');
  }
}

// 저장된 즐겨찾기 목록 가져오기
async function loadSavedFavorites() {
  try {
    const videoIds = songs.map(song => song.videoId);

    if (videoIds.length === 0) {
      return;
    }

    const response = await fetch('/api/favorites/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds })
    });

    const data = await response.json();

    if (response.ok && data.data.savedVideoIds) {
      savedVideoIds = new Set(data.data.savedVideoIds);
      console.log(savedVideoIds.size);

      updateMusicList();
    }
  } catch (error) {
    console.error(error);
  }
}

// 즐겨찾기 저장 API
async function saveMusicToFavorite(song, buttonElement) {
  // 이미 저장된 곡이면 삭제
  if (savedVideoIds.has(song.videoId)) {
    try {
      const response = await fetch(`/api/favorites/${song.videoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        savedVideoIds.delete(song.videoId);
        buttonElement.innerHTML = '<i class="fas fa-plus-circle"></i>';
      } else {
        alert(data.message || '삭제 실패');
      }
    } catch (error) {
      console.error(error);
      alert('삭제에 실패했습니다.');
    }
    return;
  }

  // 새로 저장
  try {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotionId: currentEmotionId,
        emotion: currentEmotion,
        youtubeVideoId: song.videoId,
        videoTitle: song.title,
        channelTitle: song.artist,
        thumbnailUrl: song.thumbnailUrl
      })
    });

    const data = await response.json();

    if (response.ok) {
      savedVideoIds.add(song.videoId);
      buttonElement.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else {
      alert(data.message || '저장 실패');
    }
  } catch (error) {
    console.error(error);
    alert('저장에 실패했습니다.');
  }
}

// Carousel 스크롤
function setupCarousel() {
  const items = document.querySelectorAll('.carousel-item');

  carouselTrack.addEventListener('wheel', (e) => {
    e.preventDefault();
    carouselTrack.scrollLeft += e.deltaY;
  }, { passive: false });
  
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
      if (isAutoPlayEnabled()) {
        playSong();
      }
    }
  });

  // 다음 곡
  nextBtn.addEventListener('click', () => {
    if (currentIndex < songs.length - 1) {
      loadSong(currentIndex + 1);
      if (isAutoPlayEnabled()) {
        playSong();
      }
    }
  });
  
  // 진행바 조작
  progressBar.addEventListener('input', () => {
    if (isPlayerReady && player) {
      const seekTime = parseInt(progressBar.value);
      player.seekTo(seekTime);
    }
  });

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
    console.error(error);
  }
}

// 제목 길이 체크 및 marquee 적용
function checkAndApplyMarquee() {
  songTitle.classList.remove('marquee');
  songTitle.removeEventListener('animationend', restartMarquee);
  songTitle.style.animation = 'none';

  setTimeout(() => {
    const titleWidth = songTitle.scrollWidth;
    const containerWidth = songTitle.clientWidth;
    if (titleWidth > containerWidth) {
      const distance = titleWidth + containerWidth;
      const duration = (distance / 100) * 2;
      songTitle.style.animation = `marqueeScroll ${duration}s linear 2s 1`;
      songTitle.style.setProperty('--scroll-distance', `-${distance}px`);
      songTitle.addEventListener('animationend', restartMarquee);
    }
  }, 100);
}

// 애니메이션 리셋 및 재시작
function restartMarquee() {
  songTitle.style.animation = 'none';

  setTimeout(() => {
    const titleWidth = songTitle.scrollWidth;
    const containerWidth = songTitle.clientWidth;

    if (titleWidth > containerWidth) {
      const distance = titleWidth + containerWidth;
      const duration = (distance / 100) * 2;

      songTitle.style.animation = `marqueeScroll ${duration}s linear 2s 1`;
      songTitle.style.setProperty('--scroll-distance', `-${distance}px`);
    }
  }, 2000);
}

// 유틸리티
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

init();