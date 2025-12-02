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