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

  // 해당 날짜의 음악 로드 (임시 데이터)
  function loadMusicForDate(date) {
    // 임시 데이터 - 나중에 서버에서 가져올 데이터
    const musicItems = document.querySelectorAll('.history-music-item');
    songs = Array.from(musicItems).map(item => ({
      title: item.querySelector('.history-music-title').textContent,
      artist: item.querySelector('.history-music-artist').textContent,
      duration: 180 // 3분 (초 단위)
    }));
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
      
      // 자동 재생
      setTimeout(() => playSong(), 100);
    }
  });

  // 곡 로드
  function loadSong(index) {
    if (index < 0 || index >= songs.length || songs.length === 0) return;
  
    currentIndex = index;
    const song = songs[index];
  
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    duration = song.duration;
    currentTime = 0;
  
    // 시간 텍스트 업데이트 추가
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
  // 시간 텍스트 업데이트 추가
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

// 시간 포맷 함수 추가
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

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
    });
  }

  // 재생 카드 여닫기 버튼
  togglePlayerBtn.addEventListener("click", () => {
    isPlayerVisible = !isPlayerVisible;

    if (isPlayerVisible) {
      musicPlayerCard.classList.add("visible");  // 카드 보이기
    } else {
      musicPlayerCard.classList.remove("visible"); // 카드 숨기기
    }
  });

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