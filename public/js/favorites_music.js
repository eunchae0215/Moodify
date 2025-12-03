// 자동 재생 설정 확인 함수
function isAutoPlayEnabled() {
  const autoPlay = localStorage.getItem('moodify_auto_play');
  const result = autoPlay === null || autoPlay === 'true';
  console.log('[AutoPlay Check] localStorage value:', autoPlay);
  console.log('[AutoPlay Check] Result:', result ? 'ENABLED' : 'DISABLED');
  return result;
}

// HTML이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  // URL에서 감정 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const mood = urlParams.get('mood') || 'happy';

  // DOM 요소
  const favMusicPlayerCard = document.getElementById('favMusicPlayerCard');
  const favClosePlayerBtn = document.getElementById('favClosePlayerBtn');
  const favoritesMusicTitle = document.getElementById('favoritesMusicTitle');
  
  // 플레이어 요소
  const favPlayBtnMain = document.querySelector('.fav-play-btn-main');
  const favPrevBtn = document.querySelector('.fav-prev-btn');
  const favNextBtn = document.querySelector('.fav-next-btn');
  const favProgressBar = document.querySelector('.fav-progress-bar');
  const favProgressFill = document.querySelector('.fav-progress-fill');
  const favPlayerTitle = document.querySelector('.fav-player-title');
  const favPlayerArtist = document.querySelector('.fav-player-artist');

  // 플레이어 상태
  let isPlayerVisible = true;
  let currentIndex = 0;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let playInterval = null;
  let songs = [];

  // 감정별 제목 매핑
  const moodTitles = {
    'happy': '기쁨의 Moodify',
    'love': '사랑의 Moodify',
    'anxious': '불안의 Moodify',
    'tired': '피곤의 Moodify',
    'angry': '화남의 Moodify',
    'excited': '신남의 Moodify'
  };

  // 제목 설정
  if (favoritesMusicTitle) {
    favoritesMusicTitle.textContent = moodTitles[mood] || '기쁨의 Moodify';
  }

  // 음악 리스트 로드 (임시 데이터)
  function loadMusicList() {
    const musicItems = document.querySelectorAll('.favorites-music-item');
    songs = Array.from(musicItems).map(item => ({
      title: item.querySelector('.favorites-music-item-title').textContent,
      artist: item.querySelector('.favorites-music-item-artist').textContent,
      duration: 180 // 3분 (초 단위)
    }));
  }

  // 초기 음악 리스트 로드
  loadMusicList();

  // 페이지 로드 시 첫 번째 곡 로드
  if (songs.length > 0) {
    loadSong(0);
  }

  // 재생 버튼 클릭 이벤트 (이벤트 위임)
  document.body.addEventListener('click', (e) => {
    // 재생 버튼 클릭
    if (e.target.closest('.favorites-play-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const playBtn = e.target.closest('.favorites-play-btn');
      const musicItem = playBtn.closest('.favorites-music-item');
      
      if (!musicItem) {
        console.log('음악 아이템을 찾을 수 없습니다');
        return;
      }
      
      // 음악 아이템의 인덱스 찾기
      const allMusicItems = document.querySelectorAll('.favorites-music-item');
      const index = Array.from(allMusicItems).indexOf(musicItem);
      
      // 음악 정보 가져오기
      const titleElement = musicItem.querySelector('.favorites-music-item-title');
      const artistElement = musicItem.querySelector('.favorites-music-item-artist');
      
      if (!titleElement || !artistElement) {
        console.log('음악 정보를 찾을 수 없습니다');
        return;
      }
      
      const title = titleElement.textContent;
      const artist = artistElement.textContent;
      
      console.log('재생 버튼 클릭됨:', title, '-', artist);
      
      // 이전 곡 일시정지
      pauseSong();
      
      // 곡 로드
      currentIndex = index;
      loadSong(index);
      
      console.log('[Favorites] 재생 버튼 클릭');
      
      // 자동 재생
      setTimeout(() => {
        if (isAutoPlayEnabled()) {
          console.log('[Favorites] 자동 재생 시작');
          playSong();
        } else {
          console.log('[Favorites] 자동 재생 비활성화 - 수동 재생 필요');
        }
      }, 100);
    }
  });

  // 곡 로드
  function loadSong(index) {
    if (index < 0 || index >= songs.length || songs.length === 0) return;
    
    currentIndex = index;
    const song = songs[index];
    
    favPlayerTitle.textContent = song.title;
    favPlayerArtist.textContent = song.artist;
    duration = song.duration;
    currentTime = 0;
    
    // 시간 텍스트 업데이트
    const currentTimeEl = document.getElementById('favCurrentTime');
    const totalTimeEl = document.getElementById('favTotalTime');
    
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(0);
    }
    if (totalTimeEl) {
      totalTimeEl.textContent = formatTime(duration);
    }
    
    if (favProgressBar) {
      favProgressBar.max = duration;
      favProgressBar.value = 0;
    }
    if (favProgressFill) {
      favProgressFill.style.width = '0%';
    }
    
    // 리스트 하이라이트 업데이트
    updateListHighlight(index);
  }

  // 리스트 하이라이트 업데이트
  function updateListHighlight(index) {
    const musicItems = document.querySelectorAll('.favorites-music-item');
    musicItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // 재생
  function playSong() {
    isPlaying = true;
    if (favPlayBtnMain) {
      favPlayBtnMain.innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    playInterval = setInterval(() => {
      if (currentTime < duration) {
        currentTime++;
        updateProgress();
      } else {
        pauseSong();
        // 다음 곡 자동 재생
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

  // 일시정지
  function pauseSong() {
    isPlaying = false;
    if (favPlayBtnMain) {
      favPlayBtnMain.innerHTML = '<i class="fas fa-play"></i>';
    }
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  // 진행률 업데이트
  function updateProgress() {
    // 시간 텍스트 업데이트
    const currentTimeEl = document.getElementById('favCurrentTime');
    const totalTimeEl = document.getElementById('favTotalTime');
    
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(currentTime);
    }
    if (totalTimeEl) {
      totalTimeEl.textContent = formatTime(duration);
    }
    
    if (favProgressBar) {
      favProgressBar.value = currentTime;
    }
    if (favProgressFill) {
      const percentage = (currentTime / duration) * 100;
      favProgressFill.style.width = `${percentage}%`;
    }
  }

  // 시간 포맷 함수
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // 재생/일시정지 버튼
  if (favPlayBtnMain) {
    favPlayBtnMain.addEventListener('click', () => {
      if (isPlaying) {
        pauseSong();
      } else {
        playSong();
      }
    });
  }

  // 이전 곡 버튼
  if (favPrevBtn) {
    favPrevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        pauseSong();
        loadSong(currentIndex - 1);
        setTimeout(() => playSong(), 100);
      }
    });
  }

  // 다음 곡 버튼
  if (favNextBtn) {
    favNextBtn.addEventListener('click', () => {
      if (currentIndex < songs.length - 1) {
        pauseSong();
        loadSong(currentIndex + 1);
        setTimeout(() => playSong(), 100);
      }
    });
  }

  // 재생바 조작
  if (favProgressBar) {
    favProgressBar.addEventListener('input', () => {
      currentTime = parseInt(favProgressBar.value);
      updateProgress();
    });
  }

  // 재생 카드 닫기 버튼
  if (favClosePlayerBtn) {
    favClosePlayerBtn.addEventListener('click', () => {
      isPlayerVisible = false;
      favMusicPlayerCard.classList.remove('visible');
      pauseSong();
    });
  }

  console.log('현재 감정:', mood);
  console.log('로드된 음악 수:', songs.length);

  // 페이지 진입 시 자동 재생
  console.log('[Favorites] 페이지 로드 완료 - 자동재생 체크');
  if (songs.length > 0 && isAutoPlayEnabled()) {
    console.log('[Favorites] 페이지 진입 시 자동 재생 시작');
    setTimeout(() => {
      playSong();
    }, 500);
  } else if (!isAutoPlayEnabled()) {
    console.log('[Favorites] 자동 재생 비활성화됨');
  }
});