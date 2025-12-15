document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 선언
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.querySelector('.login-button');
  const cdDisc = document.querySelector('.cd-disc');
  const tonearm = document.querySelector('.tonearm');
  const errorDiv = document.getElementById('errorMessage');

  // 에러 메시지 표시 함수
  function showError(message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    } else {
      alert(message);
    }
  }

  // 에러 메시지 숨기기 함수
  function hideError() {
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }
  }

  // 입력 필드에 포커스되면 에러 메시지 숨기기
  const userIDInput = document.getElementById('userID');
  const passwordInput = document.getElementById('password');

  if (userIDInput) {
    userIDInput.addEventListener('focus', hideError);
  }

  if (passwordInput) {
    passwordInput.addEventListener('focus', hideError);
  }

  // 로그인 폼 제출 처리
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();
      
      const formData = new FormData(e.target);
      const data = {
        userID: formData.get('userID'),
        password: formData.get('password')
      };

      if (!data.userID || !data.userID.trim()) {
        showError('아이디를 입력해주세요.');
        return;
      }

      if (!data.password || !data.password.trim()) {
        showError('비밀번호를 입력해주세요.');
        return;
      }

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
          console.log(result.message);
          showError(result.message || '로그인에 실패했습니다.');
        }
      } catch (error) {
        console.error(error);
        showError('로그인 중 오류가 발생했습니다.');
      }
    });
  }

  // LP판 회전 및 바늘 애니메이션 제어
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