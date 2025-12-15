// 이모지 선택 처리
const emojiButtons = document.querySelectorAll('.emoji-button');
const musicButton = document.getElementById('musicButton');
let selectedMood = null;
let selectedEmoji = null; 

// 감정-이모지 매핑
const moodEmojiMap = {
  happy: '😊',
  love: '😍',
  sleep: '😴',
  crying: '😭',
  angry: '😠',
  excited: '🤩'
};

emojiButtons.forEach(button => {
  button.addEventListener('click', () => {
    emojiButtons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    // 선택한 감정 저장
    selectedMood = button.dataset.mood;
    selectedEmoji = moodEmojiMap[selectedMood]; 
    
    console.log(`[Index] 감정 선택: ${selectedMood} (${selectedEmoji})`); 
    
    // 음악 버튼 활성화
    musicButton.classList.add('active');
  });
});

// 음악 들으러 가기 버튼 클릭 시
musicButton.addEventListener('click', async () => {
  if (!selectedMood) {
    alert('감정을 선택해주세요!');
    return;
  }
  
  // 버튼 비활성화
  const originalText = musicButton.textContent;
  musicButton.disabled = true;
  musicButton.textContent = '저장 중...';
  musicButton.style.cursor = 'wait';
  
  try {
    // 감정 저장 API 호출
    const response = await fetch('/api/emotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emotion: selectedMood,
        emoji: selectedEmoji,
        memo: null
      })
    });
    
    const data = await response.json();
    
    // 에러 체크
    if (!response.ok) {
      throw new Error(data.message || '감정 저장에 실패했습니다.');
    }

    const emotionId = data.data.emotionId;
    
    // music 페이지로 이동
    window.location.href = `/music?emotion=${selectedMood}&emotionId=${emotionId}`;
    
  } catch (error) {
    alert(`감정 저장에 실패했습니다.\n${error.message}`);
    
    // 버튼 복구
    musicButton.disabled = false;
    musicButton.textContent = originalText;
    musicButton.style.cursor = 'pointer';
  }
});

// 현재 날짜 표시
function updateDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayName = days[today.getDay()];
  
  const dateElement = document.getElementById('currentDate');
  dateElement.textContent = `${year}년 ${month}월 ${String(date).padStart(2, '0')}일 ${dayName}`;
}

// 페이지 로드 시 날짜 업데이트
updateDate();