// 음악 플레이어 요소
const songTitleList = document.getElementById('songTitleList');
const songArtistList = document.getElementById('songArtistList');
const playBtnList = document.getElementById('playBtnList');
const prevBtnList = document.getElementById('prevBtnList');
const nextBtnList = document.getElementById('nextBtnList');
const progressSliderList = document.getElementById('progressSliderList');
const progressFillList = document.getElementById('progressFillList');
const currentTimeList = document.getElementById('currentTimeList');
const totalTimeList = document.getElementById('totalTimeList');
const songItems = document.querySelectorAll('.song-item');
const musicItems = document.querySelectorAll('.music-item');
const playItemBtns = document.querySelectorAll('.play-item-btn');
const addItemBtns = document.querySelectorAll('.add-item-btn');

// 플레이어 상태
let currentIndex = 0;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let playInterval = null;

// 노래 데이터
const songs = Array.from(songItems).map(item => ({
  title: item.dataset.title,
  artist: item.dataset.artist,
  duration: parseInt(item.dataset.duration)
}));

// 초기화
function init() {
  loadSong(0);
  setupMusicList();
}

// 곡 로드
function loadSong(index) {
  if (index < 0 || index >= songs.length) return;
  
  currentIndex = index;
  const song = songs[index];
  
  songTitleList.textContent = song.title;
  songArtistList.textContent = song.artist;
  duration = song.duration;
  currentTime = 0;
  
  totalTimeList.textContent = formatTime(duration);
  currentTimeList.textContent = formatTime(0);
  progressSliderList.max = duration;
  progressSliderList.value = 0;
  progressFillList.style.width = '0%';
  
  // 리스트에서 현재 곡 하이라이트
  updateMusicItemHighlight(index);
}

// 음악 리스트 설정
function setupMusicList() {
  // 각 음악 아이템의 제목/가수 업데이트
  musicItems.forEach((item, index) => {
    const song = songs[index];
    if (song) {
      const titleEl = item.querySelector('.music-title');
      const artistEl = item.querySelector('.music-artist');
      titleEl.textContent = song.title;
      artistEl.textContent = song.artist;
    }
  });
  
  // 재생 버튼 클릭
  playItemBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      pauseSong();
      loadSong(index);
      playSong();
    });
  });
  
  // 추가 버튼 클릭
  addItemBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      alert(`"${songs[index].title}" 재생목록에 추가!`);
    });
  });
  
  // 음악 아이템 클릭
  musicItems.forEach((item) => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      pauseSong();
      loadSong(index);
    });
  });
}

// 리스트 하이라이트 업데이트
function updateMusicItemHighlight(index) {
  musicItems.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 재생/일시정지
playBtnList.addEventListener('click', () => {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});

function playSong() {
  isPlaying = true;
  playBtnList.innerHTML = '<i class="fas fa-pause"></i>';
  
  playInterval = setInterval(() => {
    if (currentTime < duration) {
      currentTime++;
      updateProgress();
    } else {
      pauseSong();
      if (currentIndex < songs.length - 1) {
        loadSong(currentIndex + 1);
        setTimeout(() => playSong(), 300);
      } else {
        currentTime = 0;
        updateProgress();
      }
    }
  }, 1000);
}

function pauseSong() {
  isPlaying = false;
  playBtnList.innerHTML = '<i class="fas fa-play"></i>';
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

// 진행률 업데이트
function updateProgress() {
  currentTimeList.textContent = formatTime(currentTime);
  progressSliderList.value = currentTime;
  const percentage = (currentTime / duration) * 100;
  progressFillList.style.width = `${percentage}%`;
}

// 재생바 조작
progressSliderList.addEventListener('input', () => {
  currentTime = parseInt(progressSliderList.value);
  updateProgress();
});

// 이전 곡
prevBtnList.addEventListener('click', () => {
  if (currentIndex > 0) {
    pauseSong();
    loadSong(currentIndex - 1);
  }
});

// 다음 곡
nextBtnList.addEventListener('click', () => {
  if (currentIndex < songs.length - 1) {
    pauseSong();
    loadSong(currentIndex + 1);
  }
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    prevBtnList.click();
  } else if (e.key === 'ArrowRight') {
    nextBtnList.click();
  } else if (e.key === ' ') {
    e.preventDefault();
    playBtnList.click();
  }
});

// 시간 포맷
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 초기화 실행
init();