// ===== DOM 로드 후 실행 =====
document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 선언
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.querySelector('.login-button');
  const cdDisc = document.querySelector('.cd-disc');
  const tonearm = document.querySelector('.tonearm');

  // ===== 로그인 폼 제출 처리 =====
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = {
        userID: formData.get('userID'),
        password: formData.get('password')
      };

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          window.location.href = result.redirectUrl || '/music';
        } else {
          console.log('로그인 실패:', result.message);
          alert(result.message || '로그인에 실패했습니다.');
        }
      } catch (error) {
        console.error('로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다.');
      }
    });
  }

  // ===== LP판 회전 및 바늘 애니메이션 제어 =====
  if (loginButton && cdDisc && tonearm) {
    loginButton.addEventListener('mouseenter', () => {
      cdDisc.style.animationPlayState = 'running';
      tonearm.style.transform = 'rotate(-60deg)';
    });

    loginButton.addEventListener('mouseleave', () => {
      cdDisc.style.animationPlayState = 'paused';
      tonearm.style.transform = 'rotate(-90deg)';
    });
  }
});