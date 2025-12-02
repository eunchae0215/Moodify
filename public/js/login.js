// 로그인 폼 제출 처리
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    nickname: formData.get('nickname'),
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

    if (response.ok) {
      window.location.href = '/';
    } else {
      alert('로그인에 실패했습니다.');
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    alert('로그인 중 오류가 발생했습니다.');
  }
});

// LP판 회전 및 바늘 애니메이션 제어
const loginButton = document.querySelector('.login-button');
const cdDisc = document.querySelector('.cd-disc');
const tonearm = document.querySelector('.tonearm');

loginButton.addEventListener('mouseenter', () => {
  cdDisc.style.animationPlayState = 'running';
  tonearm.style.transform = 'rotate(-60deg)';
});

loginButton.addEventListener('mouseleave', () => {
  cdDisc.style.animationPlayState = 'paused';
  tonearm.style.transform = 'rotate(-90deg)';
});
