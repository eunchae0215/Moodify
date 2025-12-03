// 탈퇴하기 버튼
const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawModalOverlay = document.getElementById('withdrawModalOverlay');
const cancelWithdrawBtn = document.getElementById('cancelWithdrawBtn');
const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');

if (withdrawBtn) {
  withdrawBtn.addEventListener('click', (e) => {
    e.preventDefault();
    withdrawModalOverlay.classList.add('visible');
  });
}

if (cancelWithdrawBtn) {
  cancelWithdrawBtn.addEventListener('click', () => {
    withdrawModalOverlay.classList.remove('visible');
  });
}

if (confirmWithdrawBtn) {
  confirmWithdrawBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/withdraw', {
        method: 'POST',
      });

      if (res.ok) {
        window.location.href = '/login';
      } else {
        alert("탈퇴 중 문제가 발생했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류 발생");
    }
  });
}

// 모달 배경 클릭 시 닫기
if (withdrawModalOverlay) {
  withdrawModalOverlay.addEventListener('click', (e) => {
    if (e.target === withdrawModalOverlay) {
      withdrawModalOverlay.classList.remove('visible');
    }
  });
}