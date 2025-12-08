/**
 * 내 정보 수정 페이지 스크립트
 * - 폼 유효성 검증
 * - 서버 통신 (PUT /info)
 */

document.addEventListener('DOMContentLoaded', function() {
  const infoForm = document.getElementById('infoForm');
  
  if (!infoForm) {
    console.error('폼 요소를 찾을 수 없습니다.');
    return;
  }

  infoForm.addEventListener('submit', handleFormSubmit);
});

/**
 * 폼 제출 핸들러
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const username = document.getElementById('nickname').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  
  // 1. 닉네임 검증
  if (!username) {
    alert('닉네임을 입력해주세요.');
    return;
  }
  
  // 2. 비밀번호 검증 (입력한 경우에만)
  if (password || passwordConfirm) {
    // 비밀번호 일치 확인
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
  }
  
  // 3. 서버로 정보 수정 요청
  await updateUserInfo(username, password, passwordConfirm);
}

/**
 * 서버로 사용자 정보 수정 요청
 */
async function updateUserInfo(username, password, passwordConfirm) {
  try {
    const response = await fetch('/info', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password || undefined,
        password2: passwordConfirm || undefined
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('정보가 수정되었습니다.');
      
      // 비밀번호 필드 초기화
      document.getElementById('password').value = '';
      document.getElementById('passwordConfirm').value = '';
      
      // 닉네임이 변경된 경우 페이지 새로고침
      const currentUsername = document.getElementById('nickname').defaultValue;
      if (data.data.username !== currentUsername) {
        console.log('닉네임 변경 감지 - 페이지 새로고침');
        setTimeout(() => {
          location.reload();
        }, 500);
      }
    } else {
      // 실패 메시지 표시
      alert(data.message || '정보 수정에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('서버와의 통신 중 오류가 발생했습니다.');
  }
}