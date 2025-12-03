// 자동 재생 설정 확인 함수
function isAutoPlayEnabled() {
  const autoPlay = localStorage.getItem('moodify_auto_play');
  const result = autoPlay === null || autoPlay === 'true';
  console.log('[AutoPlay Check] localStorage value:', autoPlay);
  console.log('[AutoPlay Check] Result:', result ? 'ENABLED' : 'DISABLED');
  return result;
}

// 햄버거 버튼으로 리스트 토글
const hamburgerMenu = document.getElementById('hamburgerMenu');
const listSectionOverlay = document.getElementById('listSectionOverlay');
const closeListBtn = document.getElementById('closeListBtn');
const musicContainer = document.querySelector('.music-container');
const musicItemsOverlay = document.querySelectorAll('.music-item-overlay');
const playItemBtnsOverlay = document.querySelectorAll('.play-item-btn-overlay');
const addItemBtnsOverlay = document.querySelectorAll('.add-item-btn-overlay');

let isListVisible = false;

// 햄버거 버튼 - 리스트 열기
hamburgerMenu.addEventListener('click', () => {
  isListVisible = true;
  listSectionOverlay.classList.add('visible');
  musicContainer.classList.add('list-open');
  document.querySelector('.music-page').classList.add('list-active'); 
});

// 닫기 버튼 - 리스트 닫기
closeListBtn.addEventListener('click', () => {
  isListVisible = false;
  listSectionOverlay.classList.remove('visible');
  musicContainer.classList.remove('list-open');
  document.querySelector('.music-page').classList.remove('list-active');
});

// 음악 플레이어 요소
const carouselTrack = document.getElementById('carouselTrack');
const carouselItems = document.querySelectorAll('.carousel-item');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const songItems = document.querySelectorAll('.song-item');

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
  setupCarousel();
  setupListOverlay();
  setTimeout(() => {
    scrollToIndex(0);
    update3DEffect();
    
    // 자동 재생 체크
    console.log('[Music Card] 자동재생 체크 시작');
    if (isAutoPlayEnabled()) {
      console.log('[Music Card] 자동 재생 시작');
      setTimeout(() => {
        if (songs.length > 0) {
          playSong();
        }
      }, 500);
    } else {
      console.log('[Music Card] 자동 재생 비활성화됨');
    }
  }, 100);
}

// 리스트 오버레이 설정
function setupListOverlay() {
  // 재생 버튼
  playItemBtnsOverlay.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      pauseSong();
      loadSong(index);
      scrollToIndex(index);
      
      console.log('[Music Card List] 재생 버튼 클릭');
      if (isAutoPlayEnabled()) {
        console.log('[Music Card List] 자동 재생 시작');
        playSong();
      } else {
        console.log('[Music Card List] 자동 재생 비활성화 - 수동 재생 필요');
      }
    });
  });
  
  // 추가 버튼
  addItemBtnsOverlay.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      alert(`"${songs[index].title}" 재생목록에 추가!`);
    });
  });
  
  // 음악 아이템 클릭
  musicItemsOverlay.forEach((item) => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      pauseSong();
      loadSong(index);
      scrollToIndex(index);
      updateListHighlight(index);
    });
  });
}

// 리스트 하이라이트 업데이트
function updateListHighlight(index) {
  musicItemsOverlay.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 곡 로드
function loadSong(index) {
  if (index < 0 || index >= songs.length) return;
  
  currentIndex = index;
  const song = songs[index];
  
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  duration = song.duration;
  currentTime = 0;
  
  totalTimeEl.textContent = formatTime(duration);
  currentTimeEl.textContent = formatTime(0);
  progressBar.max = duration;
  progressBar.value = 0;
  progressFill.style.width = '0%';
  
  // 리스트 하이라이트 업데이트
  updateListHighlight(index);
}

// Carousel 설정
function setupCarousel() {
  // 마우스 휠로 가로 스크롤
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
  
  // 썸네일 클릭
  carouselItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (index !== currentIndex) {
        pauseSong();
        loadSong(index);
        scrollToIndex(index);
      }
    });
  });
}

// 3D 효과 업데이트 (거리 기반)
function update3DEffect() {
  const scrollLeft = carouselTrack.scrollLeft;
  const containerWidth = carouselTrack.offsetWidth;
  const containerCenter = scrollLeft + containerWidth / 2;
  
  carouselItems.forEach((item, index) => {
    const itemLeft = item.offsetLeft;
    const itemWidth = item.offsetWidth;
    const itemCenter = itemLeft + itemWidth / 2;
    const distance = itemCenter - containerCenter;
    const absDistance = Math.abs(distance);
    
    // 모든 클래스 제거
    item.classList.remove('center', 'near-left', 'near-right', 'far-left', 'far-right');
    
    // 중앙 (가장 큼)
    if (absDistance < 50) {
      item.classList.add('center');
    }
    // 왼쪽 가까움
    else if (distance < 0 && absDistance < 250) {
      item.classList.add('near-left');
    }
    // 오른쪽 가까움
    else if (distance > 0 && absDistance < 250) {
      item.classList.add('near-right');
    }
    // 왼쪽 멀음
    else if (distance < 0) {
      item.classList.add('far-left');
    }
    // 오른쪽 멀음
    else {
      item.classList.add('far-right');
    }
  });
}

// 중앙으로 Snap
function snapToCenter() {
  const scrollLeft = carouselTrack.scrollLeft;
  const containerWidth = carouselTrack.offsetWidth;
  const containerCenter = scrollLeft + containerWidth / 2;
  
  let closestIndex = 0;
  let minDistance = Infinity;
  
  carouselItems.forEach((item, index) => {
    const itemLeft = item.offsetLeft;
    const itemCenter = itemLeft + item.offsetWidth / 2;
    const distance = Math.abs(containerCenter - itemCenter);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });
  
  // 중앙으로 스크롤
  scrollToIndex(closestIndex);
  
  // 곡 변경
  if (closestIndex !== currentIndex) {
    pauseSong();
    loadSong(closestIndex);
  }
}

// 인덱스로 스크롤
function scrollToIndex(index) {
  const item = carouselItems[index];
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

// 재생/일시정지
playBtn.addEventListener('click', () => {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});

function playSong() {
  isPlaying = true;
  playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  
  playInterval = setInterval(() => {
    if (currentTime < duration) {
      currentTime++;
      updateProgress();
    } else {
      pauseSong();
      if (currentIndex < songs.length - 1) {
        loadSong(currentIndex + 1);
        scrollToIndex(currentIndex);
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
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

// 진행률 업데이트
function updateProgress() {
  currentTimeEl.textContent = formatTime(currentTime);
  progressBar.value = currentTime;
  const percentage = (currentTime / duration) * 100;
  progressFill.style.width = `${percentage}%`;
}

// 재생바 조작
progressBar.addEventListener('input', () => {
  currentTime = parseInt(progressBar.value);
  updateProgress();
});

// 이전 곡
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    pauseSong();
    loadSong(currentIndex - 1);
    scrollToIndex(currentIndex);
  }
});

// 다음 곡
nextBtn.addEventListener('click', () => {
  if (currentIndex < songs.length - 1) {
    pauseSong();
    loadSong(currentIndex + 1);
    scrollToIndex(currentIndex);
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

// 시간 포맷
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 초기화 실행
init();