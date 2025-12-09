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
  const progressFill = document.querySelector('.progress-fill');
  const playerTitle = document.querySelector('.player-title');
  const playerArtist = document.querySelector('.player-artist');
  const closePlayerBtn = document.getElementById('closePlayerBtn');
  const togglePlayerBtn = document.getElementById("togglePlayerBtn");

  // 리스트 상태
  let isListVisible = false;
  let isPlayerVisible = false;
  
  // 플레이어 상태
  let currentIndex = 0;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let playInterval = null;
  let songs = [];

  // 년도 옵션 생성 (2020 ~ 2030)
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
    // 그리드 초기화
    calendarGrid.innerHTML = '';
    
    // 해당 월의 첫날과 마지막날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫날의 요일 (0 = 일요일)
    const firstDayOfWeek = firstDay.getDay();
    
    // 마지막 날짜
    const lastDate = lastDay.getDate();
    
    // 이전 달의 마지막 날
    const prevLastDay = new Date(year, month, 0);
    const prevLastDate = prevLastDay.getDate();
    
    // 빈 칸 채우기 (이전 달)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day prev-month';
      dayCell.textContent = prevLastDate - i;
      calendarGrid.appendChild(dayCell);
    }
    
    // 현재 달 날짜 채우기
    for (let date = 1; date <= lastDate; date++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      dayCell.textContent = date;
      
      // 오늘 날짜 하이라이트
      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        date === today.getDate()
      ) {
        dayCell.classList.add('today');
      }
      
      // 클릭 이벤트
      dayCell.addEventListener('click', () => {
        // 이전/다음 달 날짜는 무시
        if (dayCell.classList.contains('prev-month') || dayCell.classList.contains('next-month')) {
          return;
        }
        
        // 이전 선택 제거
        document.querySelectorAll('.calendar-day.selected').forEach(cell => {
          cell.classList.remove('selected');
        });
        
        // 새로운 선택
        dayCell.classList.add('selected');
        
        // 선택된 날짜
        const selectedDate = new Date(year, month, date);
        
        // 날짜 헤더 업데이트
        const dateString = `${year}년 ${month + 1}월 ${date}일의 Moodify`;
        historyDateTitle.textContent = dateString;
        
        // 리스트 열기
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
    const remainingCells = 42 - totalCells; // 6주 * 7일 = 42칸
    
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
      // 선택한 날짜의 시작 시간과 종료 시간 계산
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      console.log(`[History] 음악 로드 시작: ${startDate.toISOString()} ~ ${endDate.toISOString()}`);

      // 서버에서 음악 히스토리 가져오기
      const response = await fetch('/api/music/history');

      if (!response.ok) {
        throw new Error('음악 히스토리 조회 실패');
      }

      const data = await response.json();
      console.log(`[History] 전체 히스토리 개수: ${data.data.musicHistory.length}`);

      // 선택한 날짜의 음악만 필터링
      const filteredMusic = data.data.musicHistory.filter(music => {
        const playedAt = new Date(music.playedAt);
        return playedAt >= startDate && playedAt <= endDate;
      });

      console.log(`[History] 선택한 날짜의 음악 개수: ${filteredMusic.length}`);

      // 감정 이모지 표시 (첫 번째 음악의 감정 사용)
      if (filteredMusic.length > 0 && filteredMusic[0].emotionId) {
        const emoji = filteredMusic[0].emotionId.emoji || '😊';
        historyMoodEmoji.textContent = emoji;
      } else {
        historyMoodEmoji.textContent = '🎵';
      }

      // 음악 리스트 렌더링
      renderMusicList(filteredMusic);

      // songs 배열 업데이트 (플레이어용)
      songs = filteredMusic.map(music => ({
        title: music.videoTitle,
        artist: music.channelTitle,
        duration: 180, // 기본 3분 (실제로는 유튜브 API에서 가져와야 함)
        videoId: music.youtubeVideoId,
        thumbnailUrl: music.thumbnailUrl
      }));

    } catch (error) {
      console.error('[History] 음악 로드 오류:', error);
      alert('음악 히스토리를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 음악 리스트 렌더링
  function renderMusicList(musicList) {
    const historyMusicList = document.getElementById('historyMusicList');

    if (!historyMusicList) {
      console.error('[History] 음악 리스트 컨테이너를 찾을 수 없습니다.');
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
          <button class="history-add-btn">
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
    
    // 선택된 날짜도 해제
    document.querySelectorAll('.calendar-day.selected').forEach(cell => {
      cell.classList.remove('selected');
    });
  });

  // 곡 로드
  function loadSong(index) {
    if (index < 0 || index >= songs.length || songs.length === 0) return;
    
    currentIndex = index;
    const song = songs[index];
    
    if (playerTitle) playerTitle.textContent = song.title;
    if (playerArtist) playerArtist.textContent = song.artist;
    duration = song.duration;
    currentTime = 0;
    
    // 시간 텍스트 업데이트
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(0);
    }
    if (totalTimeEl) {
      totalTimeEl.textContent = formatTime(duration);
    }
    
    if (progressBar) {
      progressBar.max = duration;
      progressBar.value = 0;
    }
    if (progressFill) {
      progressFill.style.width = '0%';
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

  // 재생
  function playSong() {
    isPlaying = true;
    if (playBtnMain) {
      playBtnMain.innerHTML = '<i class="fas fa-pause"></i>';
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
    if (playBtnMain) {
      playBtnMain.innerHTML = '<i class="fas fa-play"></i>';
    }
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  // 진행률 업데이트
  function updateProgress() {
    // 시간 텍스트 업데이트
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(currentTime);
    }
    if (totalTimeEl) {
      totalTimeEl.textContent = formatTime(duration);
    }
    
    if (progressBar) {
      progressBar.value = currentTime;
    }
    if (progressFill) {
      const percentage = (currentTime / duration) * 100;
      progressFill.style.width = `${percentage}%`;
    }
  }

  // 시간 포맷 함수
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // 재생 버튼 클릭 이벤트 (이벤트 위임)
  document.body.addEventListener('click', (e) => {
    // 재생 버튼 클릭
    if (e.target.closest('.history-play-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const playBtn = e.target.closest('.history-play-btn');
      const musicItem = playBtn.closest('.history-music-item');
      
      if (!musicItem) {
        console.log('음악 아이템을 찾을 수 없습니다');
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
      
      console.log('재생 버튼 클릭됨:', title, '-', artist);
      
      // 이전 곡 일시정지
      pauseSong();
      
      // 곡 로드
      currentIndex = index;
      loadSong(index);
      
      // 재생 카드 표시
      if (!isPlayerVisible) {
        isPlayerVisible = true;
        musicPlayerCard.classList.add('visible');
      }
      
      console.log('[History] 재생 버튼 클릭');
      
      // 자동 재생
      setTimeout(() => {
        if (isAutoPlayEnabled()) {
          console.log('[History] 자동 재생 시작');
          playSong();
        } else {
          console.log('[History] 자동 재생 비활성화 - 수동 재생 필요');
        }
      }, 100);
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
        pauseSong();
        loadSong(currentIndex - 1);
        setTimeout(() => playSong(), 100);
      }
    });
  }

  // 다음 곡 버튼
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < songs.length - 1) {
        pauseSong();
        loadSong(currentIndex + 1);
        setTimeout(() => playSong(), 100);
      }
    });
  }

  // 재생바 조작
  if (progressBar) {
    progressBar.addEventListener('input', () => {
      currentTime = parseInt(progressBar.value);
      updateProgress();
    });
  }

  // 재생 카드 닫기 버튼
  if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
      isPlayerVisible = false;
      musicPlayerCard.classList.remove('visible');
      pauseSong();
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

  // 초기화
  initYearSelect();
  monthSelect.value = currentMonth;
  renderCalendar(currentYear, currentMonth);
});