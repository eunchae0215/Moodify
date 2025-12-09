// HTML이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소
  const autoPlayToggle = document.getElementById('autoPlayToggle');
  const deleteDataBtn = document.getElementById('deleteDataBtn');
  const saveBtn = document.getElementById('saveBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const continueBtn = document.getElementById('continueBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // 로컬 스토리지 키
  const AUTO_PLAY_KEY = 'moodify_auto_play';

  // 초기 설정 로드
  function loadSettings() {
    // 자동 재생 설정 불러오기 (기본값: true)
    const autoPlayEnabled = localStorage.getItem(AUTO_PLAY_KEY);
    if (autoPlayEnabled === null) {
      // 처음 사용하는 경우 기본값 true
      localStorage.setItem(AUTO_PLAY_KEY, 'true');
      autoPlayToggle.checked = true;
    } else {
      autoPlayToggle.checked = autoPlayEnabled === 'true';
    }
  }

  // 자동 재생 토글 변경
  autoPlayToggle.addEventListener('change', () => {
    const isEnabled = autoPlayToggle.checked;
    console.log('자동 재생:', isEnabled ? 'ON' : 'OFF');
    // 저장은 '저장하기' 버튼 클릭 시 수행
  });

  // 자동 재생 설정 확인 함수 (다른 페이지에서 사용)
  function isAutoPlayEnabled() {
    const autoPlay = localStorage.getItem('moodify_auto_play');
    const result = autoPlay === null || autoPlay === 'true';
    console.log('[AutoPlay Check] localStorage value:', autoPlay);
    console.log('[AutoPlay Check] Result:', result ? 'ENABLED' : 'DISABLED');
    return result;
  }

  // 삭제 버튼 클릭 - 모달 열기
  deleteDataBtn.addEventListener('click', () => {
    modalOverlay.classList.add('visible');
  });

  // 돌아가기 버튼 - 모달 닫기
  continueBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('visible');
  });

  // 모달 배경 클릭 시 닫기
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('visible');
    }
  });

  // 데이터 삭제 버튼
  confirmDeleteBtn.addEventListener('click', () => {
    // TODO: 서버에 데이터 삭제 요청
    // fetch('/api/user/delete-data', { method: 'POST' })
    //   .then(response => response.json())
    //   .then(data => {
    //     if (data.success) {
    //       alert('모든 데이터가 삭제되었습니다.');
    //       // 로그인 페이지로 이동
    //       window.location.href = '/login';
    //     }
    //   });
    
    // 모달 닫기
    modalOverlay.classList.remove('visible');
    
    // 사용자에게 알림
    alert('모든 데이터가 삭제되었습니다.');
    
    // TODO: 실제로는 로그아웃 후 로그인 페이지로 이동
    // window.location.href = '/login';
  });

  // 저장하기 버튼
  saveBtn.addEventListener('click', () => {
    // 자동 재생 설정 저장
    const autoPlayEnabled = autoPlayToggle.checked;
    localStorage.setItem(AUTO_PLAY_KEY, autoPlayEnabled.toString());
    
    console.log('설정 저장됨');
    console.log('자동 재생:', autoPlayEnabled ? 'ON' : 'OFF');
    
    // 사용자에게 알림
    alert('설정이 저장되었습니다.');
  });

  // 초기 설정 로드
  loadSettings();
});

// 자동 재생 설정 확인 함수 (다른 페이지에서 사용)
function isAutoPlayEnabled() {
  const autoPlay = localStorage.getItem('moodify_auto_play');
  return autoPlay === null || autoPlay === 'true'; // 기본값 true
}

// 전역으로 내보내기
window.isAutoPlayEnabled = isAutoPlayEnabled;