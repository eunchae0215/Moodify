// 이모지 선택 처리
const emojiButtons = document.querySelectorAll('.emoji-button');
const musicButton = document.getElementById('musicButton');
let selectedMood = null;

emojiButtons.forEach(button => {
  button.addEventListener('click', () => {
    // 모든 버튼에서 selected 클래스 제거
    emojiButtons.forEach(btn => btn.classList.remove('selected'));
    
    // 클릭한 버튼에 selected 클래스 추가
    button.classList.add('selected');
    
    // 선택한 감정 저장
    selectedMood = button.dataset.mood;
    
    // 음악 버튼 활성화
    musicButton.classList.add('active');
  });
});

// 음악 들으러 가기 버튼 클릭
musicButton.addEventListener('click', () => {
  if (selectedMood) {
    // 선택한 감정을 서버로 전송하고 음악 페이지로 이동
    // 예: /music?mood=happy
    window.location.href = `/music?mood=${selectedMood}`;
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
