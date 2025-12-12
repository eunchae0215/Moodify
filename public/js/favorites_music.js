// 현재 감정
let currentEmotion = window.CURRENT_EMOTION || 'happy';

// YouTube Player
let player = null;
let isPlayerReady = false;

// 음악 데이터
let songs = [];
let currentIndex = 0;
let isPlaying = false;

// 자동재생 설정 확인
function isAutoPlayEnabled() {
  const autoPlay = localStorage.getItem('moodify_auto_play');
  return autoPlay === null || autoPlay === 'true';
}

// UI 요소
const favPlayerTitle = document.querySelector('.fav-player-title');
const favPlayerArtist = document.querySelector('.fav-player-artist');
const favPlayBtnMain = document.querySelector('.fav-play-btn-main');
const favPrevBtn = document.querySelector('.fav-prev-btn');
const favNextBtn = document.querySelector('.fav-next-btn');
const favProgressBar = document.getElementById('favProgressBar');
const favProgressFill = document.getElementById('favProgressFill');
const favCurrentTime = document.getElementById('favCurrentTime');
const favTotalTime = document.getElementById('favTotalTime');
const favoritesMusicList = document.getElementById('favoritesMusicList');
const favoritesMusicTitle = document.getElementById('favoritesMusicTitle');
const favAlbumThumbnail = document.getElementById('favAlbumThumbnail');
const favAlbumPlaceholder = document.getElementById('favAlbumPlaceholder');

const emotionTitles = {
  happy: '기쁨',
  love: '사랑',
  sleep: '졸림',
  crying: '슬픔',
  angry: '화남',
  excited: '신남'
};

// 초기화
async function init() {
  console.log('[Favorites Music] 초기화 시작');
  console.log('[Favorites Music] Emotion:', currentEmotion);

  // 제목 설정
  if (favoritesMusicTitle) {
    favoritesMusicTitle.textContent = `${emotionTitles[currentEmotion] || '기쁨'}의 Moodify`;
  }

  // UI 이벤트 설정
  setupUIEvents();

  // YouTube API 로드
  loadYouTubeAPI();

  // 즐겨찾기 목록 로드
  await loadFavorites();
}

// YouTube IFrame API 로드
function loadYouTubeAPI() {
  console.log('[YouTube] API 로드 시작');

  if (typeof YT !== 'undefined' && YT.Player) {
    console.log('[YouTube] API 이미 로드됨');
    onYouTubeIframeAPIReady();
    return;
  }

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube API 준비 완료 (전역 함수)
window.onYouTubeIframeAPIReady = function() {
  console.log('[YouTube] API 준비 완료');

  player = new YT.Player('ytplayer', {
    height: '0',
    width: '0',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
};

function onPlayerReady(event) {
  console.log('[YouTube] 플레이어 준비 완료');
  isPlayerReady = true;

  if (songs.length > 0) {
    loadSong(0);
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    console.log('[Player] 곡 종료');
    nextSong();
  }
}

// 즐겨찾기 목록 로드
async function loadFavorites() {
  console.log('[Favorites] 즐겨찾기 로드:', currentEmotion);

  try {
    const response = await fetch(`/api/favorites?emotion=${currentEmotion}`);
    const data = await response.json();

    if (response.ok && data.success) {
      const favorites = data.data;
      console.log('[Favorites] 로드됨:', favorites.length);

      if (favorites.length === 0) {
        favoritesMusicList.innerHTML = '<p style="text-align: center; color: #DDE7DD; margin-top: 50px;">저장된 음악이 없습니다.</p>';
        return;
      }

      // songs 배열 생성
      songs = favorites.map(fav => ({
        videoId: fav.youtubeVideoId,
        title: fav.videoTitle,
        artist: fav.channelTitle,
        thumbnailUrl: fav.thumbnailUrl
      }));

      // UI 업데이트
      renderMusicList();

      // 첫 번째 곡 로드
      if (isPlayerReady && songs.length > 0) {
        loadSong(0);
      }
    } else {
      console.error('[Favorites] 로드 실패:', data.message);
      favoritesMusicList.innerHTML = '<p style="text-align: center; color: #DDE7DD; margin-top: 50px;">음악 로드에 실패했습니다.</p>';
    }
  } catch (error) {
    console.error('[Favorites] 로드 오류:', error);
    favoritesMusicList.innerHTML = '<p style="text-align: center; color: #DDE7DD; margin-top: 50px;">음악 로드에 실패했습니다.</p>';
  }
}

// 음악 리스트 렌더링
function renderMusicList() {
  favoritesMusicList.innerHTML = '';

  songs.forEach((song, index) => {
    const item = createMusicItem(song, index);
    favoritesMusicList.appendChild(item);
  });
}

// 음악 아이템 생성
function createMusicItem(song, index) {
  const item = document.createElement('div');
  item.className = 'favorites-music-item';
  item.dataset.index = index;

  const thumbnail = document.createElement('div');
  thumbnail.className = 'favorites-music-thumbnail';
  const img = document.createElement('img');
  img.src = song.thumbnailUrl;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  thumbnail.appendChild(img);

  const details = document.createElement('div');
  details.className = 'favorites-music-details';
  const title = document.createElement('h3');
  title.className = 'favorites-music-item-title';
  title.textContent = song.title;
  const artist = document.createElement('p');
  artist.className = 'favorites-music-item-artist';
  artist.textContent = song.artist;
  details.appendChild(title);
  details.appendChild(artist);

  const actions = document.createElement('div');
  actions.className = 'favorites-music-actions';

  const playBtn = document.createElement('button');
  playBtn.className = 'favorites-play-btn';
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    loadSong(index, true); // 재생 버튼 클릭 시 자동재생
    playSong();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'favorites-add-btn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteFavorite(song.videoId, index);
  });

  actions.appendChild(playBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(thumbnail);
  item.appendChild(details);
  item.appendChild(actions);

  item.addEventListener('click', () => {
    loadSong(index);
  });

  return item;
}

// 즐겨찾기 삭제
async function deleteFavorite(videoId, index) {
  if (!confirm('이 곡을 즐겨찾기에서 삭제하시겠습니까?')) {
    return;
  }

  try {
    const response = await fetch(`/api/favorites/${videoId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[Favorites] 삭제 성공');

      // 현재 재생 중인 곡이면 다음 곡으로
      if (index === currentIndex) {
        nextSong();
      } else if (index < currentIndex) {
        currentIndex--;
      }

      // songs 배열에서 제거
      songs.splice(index, 1);

      // UI 업데이트
      renderMusicList();

      if (songs.length === 0) {
        favoritesMusicList.innerHTML = '<p style="text-align: center; color: #DDE7DD; margin-top: 50px;">저장된 음악이 없습니다.</p>';
        if (player && isPlayerReady) {
          player.stopVideo();
        }
      }
    } else {
      alert(data.message || '삭제 실패');
    }
  } catch (error) {
    console.error('[Favorites] 삭제 오류:', error);
    alert('삭제에 실패했습니다.');
  }
}

// 곡 로드
function loadSong(index, autoPlay = null) {
  if (!isPlayerReady || songs.length === 0) {
    console.log('[Player] 플레이어 준비 안 됨 또는 곡 없음');
    return;
  }

  currentIndex = index;
  const song = songs[currentIndex];

  console.log('[Player] 곡 로드:', song.title);

  // UI 업데이트
  favPlayerTitle.textContent = song.title;
  favPlayerArtist.textContent = song.artist;

  // 썸네일 업데이트
  if (song.thumbnailUrl && favAlbumThumbnail && favAlbumPlaceholder) {
    favAlbumThumbnail.src = song.thumbnailUrl;
    favAlbumThumbnail.style.display = 'block';
    favAlbumPlaceholder.style.display = 'none';
  } else {
    favAlbumThumbnail.style.display = 'none';
    favAlbumPlaceholder.style.display = 'flex';
  }

  // 제목 marquee 체크
  checkAndApplyMarquee();

  // 자동재생 설정 확인
  const shouldAutoPlay = autoPlay !== null ? autoPlay : isAutoPlayEnabled();

  // 플레이어 로드 (자동재생 여부에 따라)
  if (shouldAutoPlay) {
    player.loadVideoById(song.videoId);
    isPlaying = true;
    updatePlayButton();
    startProgressUpdate();
  } else {
    player.cueVideoById(song.videoId);
    isPlaying = false;
    updatePlayButton();
  }

  // 하이라이트 업데이트
  updateListHighlight(index);
}

// 재생/일시정지
function playSong() {
  if (!isPlayerReady) return;

  player.playVideo();
  isPlaying = true;
  updatePlayButton();
  startProgressUpdate();
}

function pauseSong() {
  if (!isPlayerReady) return;

  player.pauseVideo();
  isPlaying = false;
  updatePlayButton();
  stopProgressUpdate();
}

function togglePlay() {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}

// 이전/다음 곡
function prevSong() {
  if (songs.length === 0) return;

  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadSong(currentIndex, true); // 이전/다음 버튼은 자동재생
  playSong();
}

function nextSong() {
  if (songs.length === 0) return;

  currentIndex = (currentIndex + 1) % songs.length;
  loadSong(currentIndex, true); // 이전/다음 버튼은 자동재생
  playSong();
}

// 리스트 하이라이트 업데이트
function updateListHighlight(index) {
  const items = document.querySelectorAll('.favorites-music-item');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 재생 버튼 아이콘 업데이트
function updatePlayButton() {
  const icon = favPlayBtnMain.querySelector('i');
  if (isPlaying) {
    icon.className = 'fas fa-pause';
  } else {
    icon.className = 'fas fa-play';
  }
}

// 진행바 업데이트
let progressInterval = null;

function startProgressUpdate() {
  if (progressInterval) return;

  progressInterval = setInterval(() => {
    if (!isPlayerReady || !player.getCurrentTime) return;

    const current = player.getCurrentTime();
    const total = player.getDuration();

    if (total > 0) {
      const progress = (current / total) * 100;
      favProgressBar.value = progress;
      favProgressFill.style.width = `${progress}%`;

      favCurrentTime.textContent = formatTime(current);
      favTotalTime.textContent = formatTime(total);
    }
  }, 1000);
}

function stopProgressUpdate() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// 시간 포맷
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// UI 이벤트 설정
function setupUIEvents() {
  // 재생/일시정지
  favPlayBtnMain.addEventListener('click', togglePlay);

  // 이전/다음 곡
  favPrevBtn.addEventListener('click', prevSong);
  favNextBtn.addEventListener('click', nextSong);

  // 진행바 클릭
  favProgressBar.addEventListener('input', (e) => {
    if (!isPlayerReady) return;

    const progress = e.target.value;
    const duration = player.getDuration();
    const seekTo = (progress / 100) * duration;

    player.seekTo(seekTo, true);
  });
}

// Marquee 기능
function checkAndApplyMarquee() {
  if (!favPlayerTitle) return;

  // marquee 초기화
  favPlayerTitle.classList.remove('marquee');
  favPlayerTitle.removeEventListener('animationend', restartMarquee);
  favPlayerTitle.style.animation = 'none';

  // 다음 프레임에서 체크 (DOM 업데이트 대기)
  setTimeout(() => {
    const titleWidth = favPlayerTitle.scrollWidth;
    const containerWidth = favPlayerTitle.clientWidth;

    console.log(`[Marquee] 제목 너비: ${titleWidth}px, 컨테이너 너비: ${containerWidth}px`);

    // 제목이 컨테이너보다 길면 marquee 적용
    if (titleWidth > containerWidth) {
      // 제목 전체가 보이도록 이동 거리 계산 (제목 너비 + 컨테이너 너비)
      const distance = titleWidth + containerWidth;

      // 100px당 2초로 계산 (속도 조정)
      const duration = (distance / 100) * 2;

      // 커스텀 키프레임 애니메이션을 인라인으로 적용
      favPlayerTitle.style.animation = `marqueeScroll ${duration}s linear 2s 1`;

      // CSS 변수로 이동 거리 설정
      favPlayerTitle.style.setProperty('--scroll-distance', `-${distance}px`);

      // 애니메이션 종료 시 재시작
      favPlayerTitle.addEventListener('animationend', restartMarquee);

      console.log(`[Marquee] 애니메이션 적용 (거리: ${distance}px, 시간: ${duration}초)`);
    }
  }, 100);
}

function restartMarquee() {
  if (!favPlayerTitle) return;

  // 애니메이션 초기화
  favPlayerTitle.style.animation = 'none';

  // 2초 대기 후 재시작
  setTimeout(() => {
    const titleWidth = favPlayerTitle.scrollWidth;
    const containerWidth = favPlayerTitle.clientWidth;

    if (titleWidth > containerWidth) {
      // 이동 거리와 시간 다시 계산
      const distance = titleWidth + containerWidth;
      const duration = (distance / 100) * 2;

      // 애니메이션 재적용
      favPlayerTitle.style.animation = `marqueeScroll ${duration}s linear 2s 1`;
      favPlayerTitle.style.setProperty('--scroll-distance', `-${distance}px`);

      console.log('[Marquee] 애니메이션 재시작');
    }
  }, 2000);
}

// YouTube Player div 추가 (숨김)
const ytPlayerDiv = document.createElement('div');
ytPlayerDiv.id = 'ytplayer';
ytPlayerDiv.style.display = 'none';
document.body.appendChild(ytPlayerDiv);

// 초기화 실행
init();
