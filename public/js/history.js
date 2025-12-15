// 자동 재생 설정 확인 함수
function isAutoPlayEnabled() {
  const autoPlay = localStorage.getItem('moodify_auto_play');
  const result = autoPlay === null || autoPlay === 'true';
  console.log('[AutoPlay Check] localStorage value:', autoPlay);
  console.log('[AutoPlay Check] Result:', result ? 'ENABLED' : 'DISABLED');
  return result;
}

// YouTube Player 변수
let player = null;
let isPlayerReady = false;
let progressInterval = null;

// 즐겨찾기 관련
let savedVideoIds = new Set();
let currentEmotionId = null;
let currentEmotion = null;

// 플레이어 상태
let currentIndex = 0;
let isPlaying = false;
let songs = [];

// 시간 포맷 함수
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 곡 로드 함수
function loadSong(index) {
  if (index < 0 || index >= songs.length || songs.length === 0) return;

  currentIndex = index;
  const song = songs[index];

  const playerTitle = document.querySelector('.player-title');
  const playerArtist = document.querySelector('.player-artist');
  const albumThumbnail = document.getElementById('albumThumbnail');
  const albumPlaceholder = document.getElementById('albumPlaceholder');

  if (playerTitle) {
    playerTitle.textContent = song.title;
    // 마퀴 체크 함수 호출 
    if (typeof checkAndApplyPlayerMarquee === 'function') {
      checkAndApplyPlayerMarquee();
    }
  }
  if (playerArtist) playerArtist.textContent = song.artist;

  // 썸네일 업데이트
  if (song.thumbnailUrl && albumThumbnail && albumPlaceholder) {
    albumThumbnail.src = song.thumbnailUrl;
    albumThumbnail.style.display = 'block';
    albumPlaceholder.style.display = 'none';
  } else if (albumThumbnail && albumPlaceholder) {
    albumThumbnail.style.display = 'none';
    albumPlaceholder.style.display = 'flex';
  }

  // YouTube Player에 비디오 로드
  if (player && isPlayerReady && song.videoId) {
    player.loadVideoById(song.videoId);
  }

  // 리스트 하이라이트 업데이트
  updateListHighlight(index);
}

// 리스트 하이라이트 업데이트
function updateListHighlight(index) {
  const musicItems = document.querySelectorAll('.history-music-item');
  musicItems.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // 현재 날짜
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();

  // DOM 요소
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');
  const calendarGrid = document.getElementById('calendarGrid');
  const historyListOverlay = document.getElementById('historyListOverlay');
  const closeHistoryListBtn = document.getElementById('closeHistoryListBtn');
  const historyDateTitle = document.getElementById('historyDateTitle');
  const historyMoodEmoji = document.getElementById('historyMoodEmoji');
  const historyContainer = document.querySelector('.history-container');
  const musicPlayerCard = document.getElementById('musicPlayerCard');
  
  // 플레이어 요소
  const playBtnMain = document.querySelector('.play-btn-main');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const progressBar = document.querySelector('.progress-bar');
  const playerTitle = document.querySelector('.player-title');
  const closePlayerBtn = document.getElementById('closePlayerBtn');
  const togglePlayerBtn = document.getElementById("togglePlayerBtn");

  // 리스트 상태
  let isListVisible = false;
  let isPlayerVisible = false;

  // 년도 옵션 생성
  function initYearSelect() {
    for (let year = 2020; year <= 2030; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      if (year === currentYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  }

  // 달력 렌더링
  function renderCalendar(year, month) {
    calendarGrid.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDay = new Date(year, month, 0);
    const prevLastDate = prevLastDay.getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day prev-month';
      dayCell.textContent = prevLastDate - i;
      calendarGrid.appendChild(dayCell);
    }
    
    for (let date = 1; date <= lastDate; date++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      dayCell.textContent = date;

      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        date === today.getDate()
      ) {
        dayCell.classList.add('today');
      }
      
      dayCell.addEventListener('click', () => {
        if (dayCell.classList.contains('prev-month') || dayCell.classList.contains('next-month')) {
          return;
        }
        
        document.querySelectorAll('.calendar-day.selected').forEach(cell => {
          cell.classList.remove('selected');
        });

        dayCell.classList.add('selected');
        const selectedDate = new Date(year, month, date);
        const dateString = `${year}년 ${month + 1}월 ${date}일의 Moodify`;
        historyDateTitle.textContent = dateString;

        isListVisible = true;
        historyListOverlay.classList.add('visible');
        historyContainer.classList.add('list-open');
        
        console.log('선택된 날짜:', selectedDate);
        
        // 해당 날짜의 음악 로드
        loadMusicForDate(selectedDate);
      });
      
      calendarGrid.appendChild(dayCell);
    }
    
    // 다음 달 날짜로 빈 칸 채우기
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; 
    
    for (let date = 1; date <= remainingCells; date++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day next-month';
      dayCell.textContent = date;
      calendarGrid.appendChild(dayCell);
    }
  }

  // 해당 날짜의 음악 로드
  async function loadMusicForDate(date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const emotionResponse = await fetch(`/api/emotions/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

      if (emotionResponse.ok) {
        const emotionData = await emotionResponse.json();
        // 해당 날짜에 저장된 감정이 있으면 사용
        if (emotionData.data.emotions && emotionData.data.emotions.length > 0) {
          const emotion = emotionData.data.emotions[0]; 
          historyMoodEmoji.textContent = emotion.emoji || '😊';
          currentEmotionId = emotion._id;
          currentEmotion = emotion.emotion; 
        } else {
          // 해당 날짜에 감정 정보가 없는 경우
          historyMoodEmoji.textContent = '🎵';
          currentEmotionId = null;
          currentEmotion = null;
        }
      } else {
        historyMoodEmoji.textContent = '🎵';
        currentEmotionId = null;
        currentEmotion = null;
      }

      // 서버에서 음악 히스토리 가져오기
      const response = await fetch('/api/music/history');

      if (!response.ok) {
        throw new Error('음악 히스토리 조회 실패');
      }

      const data = await response.json();

      // 선택한 날짜의 음악만 필터링
      const filteredMusic = data.data.musicHistory.filter(music => {
        const playedAt = new Date(music.playedAt);
        return playedAt >= startDate && playedAt <= endDate;
      });

      // 음악 리스트 렌더링
      renderMusicList(filteredMusic);

      // 즐겨찾기 상태 로드
      await loadSavedFavorites();

      // songs 배열 업데이트 
      songs = filteredMusic.map(music => ({
        title: music.videoTitle,
        artist: music.channelTitle,
        duration: 180,
        videoId: music.youtubeVideoId,
        thumbnailUrl: music.thumbnailUrl
      }));

    } catch (error) {
      alert('음악 히스토리를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 음악 리스트 렌더링
  function renderMusicList(musicList) {
    const historyMusicList = document.getElementById('historyMusicList');

    if (!historyMusicList) {
      return;
    }

    // 기존 리스트 초기화
    historyMusicList.innerHTML = '';

    if (musicList.length === 0) {
      historyMusicList.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">이 날짜에 들은 음악이 없습니다.</p>';
      return;
    }

    // 음악 아이템 생성
    musicList.forEach((music, index) => {
      const musicItem = document.createElement('div');
      musicItem.className = 'history-music-item';
      musicItem.dataset.index = index;
      musicItem.dataset.videoId = music.youtubeVideoId;

      musicItem.innerHTML = `
        <div class="history-music-thumbnail">
          <img src="${music.thumbnailUrl}" alt="${music.videoTitle}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
        </div>
        <div class="history-music-details">
          <h3 class="history-music-title">${music.videoTitle}</h3>
          <p class="history-music-artist">${music.channelTitle}</p>
        </div>
        <div class="history-music-actions">
          <button class="history-play-btn">
            <i class="fas fa-play"></i>
          </button>
          <button class="history-add-btn" data-video-id="${music.youtubeVideoId}">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      `;

      historyMusicList.appendChild(musicItem);
    });
  }

  // 닫기 버튼 이벤트
  closeHistoryListBtn.addEventListener('click', () => {
    isListVisible = false;
    historyListOverlay.classList.remove('visible');
    historyContainer.classList.remove('list-open');

    // 음악 플레이어도 함께 숨김
    isPlayerVisible = false;
    musicPlayerCard.classList.remove('visible');

    // 재생 중이던 음악 일시정지
    if (player && isPlayerReady && isPlaying) {
      player.pauseVideo();
    }

    // 선택된 날짜도 해제
    document.querySelectorAll('.calendar-day.selected').forEach(cell => {
      cell.classList.remove('selected');
    });
  });

  // 재생
  function playSong() {
    if (player && isPlayerReady) {
      console.log('[YouTube] 재생 시작');
      player.playVideo();
    } else {
      console.log('[YouTube] Player가 준비되지 않음');
    }
  }

  // 일시정지
  function pauseSong() {
    if (player && isPlayerReady) {
      player.pauseVideo();
    }
  }

  // 재생 버튼 클릭 이벤트
  document.body.addEventListener('click', (e) => {
    // 재생 버튼 클릭
    if (e.target.closest('.history-play-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const playBtn = e.target.closest('.history-play-btn');
      const musicItem = playBtn.closest('.history-music-item');
      
      if (!musicItem) {
        return;
      }
      
      // 음악 아이템의 인덱스 찾기
      const allMusicItems = document.querySelectorAll('.history-music-item');
      const index = Array.from(allMusicItems).indexOf(musicItem);
      
      // 음악 정보 가져오기
      const titleElement = musicItem.querySelector('.history-music-title');
      const artistElement = musicItem.querySelector('.history-music-artist');
      
      if (!titleElement || !artistElement) {
        console.log('음악 정보를 찾을 수 없습니다');
        return;
      }
      
      const title = titleElement.textContent;
      const artist = artistElement.textContent;

      // 곡 로드
      currentIndex = index;
      loadSong(index);

      // 재생 카드 표시
      if (!isPlayerVisible) {
        isPlayerVisible = true;
        musicPlayerCard.classList.add('visible');
      }

      // YouTube Player가 준비될 때까지 대기 후 재생
      const checkPlayerAndPlay = setInterval(() => {
        if (player && isPlayerReady) {
          clearInterval(checkPlayerAndPlay);
          
          if (isAutoPlayEnabled()) {
            player.playVideo();
          } else {
            console.log('[History] 자동 재생 비활성화');
          }
        }
      }, 100);
    }

    // 즐겨찾기 저장/삭제
    if (e.target.closest('.history-add-btn')) {
      e.preventDefault();
      e.stopPropagation();

      const addBtn = e.target.closest('.history-add-btn');
      const musicItem = addBtn.closest('.history-music-item');

      if (!musicItem) {
        return;
      }

      const index = parseInt(musicItem.dataset.index);
      const song = songs[index];

      if (song) {
        saveMusicToFavorite(song, addBtn);
      }
    }
  });

  // 재생/일시정지 버튼
  if (playBtnMain) {
    playBtnMain.addEventListener('click', () => {
      if (isPlaying) {
        pauseSong();
      } else {
        playSong();
      }
    });
  }

  // 이전 곡 버튼
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        loadSong(currentIndex - 1);
        setTimeout(() => {
          if (player && isPlayerReady && isAutoPlayEnabled()) {
            player.playVideo();
          }
        }, 500);
      }
    });
  }

  // 다음 곡 버튼
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < songs.length - 1) {
        loadSong(currentIndex + 1);
        setTimeout(() => {
          if (player && isPlayerReady && isAutoPlayEnabled()) {
            player.playVideo();
          }
        }, 500);
      }
    });
  }

  // 재생바 조작
  if (progressBar) {
    progressBar.addEventListener('input', () => {
      if (player && isPlayerReady) {
        const seekTime = parseFloat(progressBar.value);
        player.seekTo(seekTime, true);
      }
    });
  }

  // 재생 카드 닫기 버튼
  if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
      isPlayerVisible = false;
      musicPlayerCard.classList.remove('visible');
      if (player && isPlayerReady) {
        player.pauseVideo();
      }
    });
  }

  // 재생 카드 여닫기 버튼
  if (togglePlayerBtn) {
    togglePlayerBtn.addEventListener("click", () => {
      isPlayerVisible = !isPlayerVisible;

      if (isPlayerVisible) {
        musicPlayerCard.classList.add("visible");
      } else {
        musicPlayerCard.classList.remove("visible");
      }
    });
  }

  // 년도 변경 이벤트
  yearSelect.addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value);
    renderCalendar(currentYear, currentMonth);
  });

  // 월 변경 이벤트
  monthSelect.addEventListener('change', (e) => {
    currentMonth = parseInt(e.target.value);
    renderCalendar(currentYear, currentMonth);
  });

  // 플레이어 제목 marquee 재시작
  function restartPlayerMarquee() {
    if (!playerTitle) return;
    playerTitle.style.animation = 'none';

    setTimeout(() => {
      const titleWidth = playerTitle.scrollWidth;
      const containerWidth = playerTitle.clientWidth;

      if (titleWidth > containerWidth) {
        const distance = titleWidth + containerWidth;
        const duration = (distance / 100) * 2;

        playerTitle.style.animation = `marqueeScroll ${duration}s linear 2s 1`;
        playerTitle.style.setProperty('--scroll-distance', `-${distance}px`);
      }
    }, 2000);
  }

  function checkAndApplyPlayerMarquee() {
    if (!playerTitle) return;
    playerTitle.classList.remove('marquee');
    playerTitle.removeEventListener('animationend', restartPlayerMarquee);
    playerTitle.style.animation = 'none';
    setTimeout(() => {
      const titleWidth = playerTitle.scrollWidth;
      const containerWidth = playerTitle.clientWidth;
      if (titleWidth > containerWidth) {
        const distance = titleWidth + containerWidth;
        const duration = (distance / 100) * 2;
        playerTitle.style.animation = `marqueeScroll ${duration}s linear 2s 1`;
        playerTitle.style.setProperty('--scroll-distance', `-${distance}px`);
        playerTitle.addEventListener('animationend', restartPlayerMarquee);
      }
    }, 100);
  }

  // YouTube API 로드
  loadYouTubeAPI();

  initYearSelect();
  monthSelect.value = currentMonth;
  renderCalendar(currentYear, currentMonth);
});

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
    createPlayer();
  };
}

// YouTube Player 생성
function createPlayer() {
  const playerContainer = document.getElementById('youtubePlayerContainer');
  const playerDiv = document.createElement('div');
  playerDiv.id = 'youtubePlayer';
  playerContainer.appendChild(playerDiv);

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
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// Player 준비 완료
function onPlayerReady(event) {
  isPlayerReady = true;
}

// Player 상태 변경
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    const playBtnMain = document.querySelector('.play-btn-main');
    if (playBtnMain) {
      playBtnMain.innerHTML = '<i class="fas fa-pause"></i>';
    }
    startProgressInterval();
  } else if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    const playBtnMain = document.querySelector('.play-btn-main');
    if (playBtnMain) {
      playBtnMain.innerHTML = '<i class="fas fa-play"></i>';
    }
    stopProgressInterval();
  } else if (event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    const playBtnMain = document.querySelector('.play-btn-main');
    if (playBtnMain) {
      playBtnMain.innerHTML = '<i class="fas fa-play"></i>';
    }
    stopProgressInterval();

    // 다음 곡 자동 재생
    if (currentIndex < songs.length - 1) {
      loadSong(currentIndex + 1);
      setTimeout(() => {
        if (player && isPlayerReady) {
          player.playVideo();
        }
      }, 300);
    }
  }
}

// 진행률 업데이트 시작
function startProgressInterval() {
  stopProgressInterval();

  progressInterval = setInterval(() => {
    if (player && isPlayerReady) {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();

      updateProgressUI(currentTime, duration);
    }
  }, 100);
}

// 진행률 업데이트 정지
function stopProgressInterval() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// 진행률 UI 업데이트
function updateProgressUI(currentTime, duration) {
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-fill');

  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(currentTime);
  }
  if (totalTimeEl) {
    totalTimeEl.textContent = formatTime(duration);
  }
  if (progressBar) {
    progressBar.max = duration;
    progressBar.value = currentTime;
  }
  if (progressFill) {
    const percentage = (currentTime / duration) * 100;
    progressFill.style.width = `${percentage}%`;
  }
}

// 즐겨찾기 목록 로드
async function loadSavedFavorites() {
  try {
    const videoIds = songs.map(song => song.videoId);
    if (videoIds.length === 0) return;

    const response = await fetch('/api/favorites/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds })
    });

    const data = await response.json();

    if (response.ok && data.data) {
      savedVideoIds = new Set(data.data);
      updateFavoriteButtons();
    }
  } catch (error) {
    console.error( error);
  }
}

// 즐겨찾기 버튼 UI 업데이트
function updateFavoriteButtons() {
  const addButtons = document.querySelectorAll('.history-add-btn');
  addButtons.forEach(btn => {
    const videoId = btn.dataset.videoId;
    const isSaved = savedVideoIds.has(videoId);
    btn.innerHTML = isSaved
      ? '<i class="fas fa-check"></i>'
      : '<i class="fas fa-plus"></i>';
  });
}

// 즐겨찾기 저장/삭제
async function saveMusicToFavorite(song, buttonElement) {
  if (!currentEmotionId || !currentEmotion) {
    alert('감정 정보를 찾을 수 없습니다.');
    return;
  }

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
        buttonElement.innerHTML = '<i class="fas fa-plus"></i>';
      } else {
        alert(data.message || '삭제 실패');
      }
    } catch (error) {
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
      buttonElement.innerHTML = '<i class="fas fa-check"></i>';
    } else {
      alert(data.message || '저장 실패');
    }
  } catch (error) {
    alert('저장에 실패했습니다.');
  }
}