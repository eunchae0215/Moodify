let isUserIDChecked = false;
let isUserIDAvailable = false;

// ===== DOM이 로드된 후 실행 =====
document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소들을 한 번에 선언 (모든 이벤트 리스너에서 사용 가능)
  const checkButton = document.getElementById('checkDuplicate');
  const userIDInput = document.getElementById('userID');
  const resultSpan = document.getElementById('duplicateResult');
  const signupForm = document.getElementById('signupForm');
  const errorDiv = document.getElementById('errorMessage');

  // ===== 중복 확인 버튼 클릭 이벤트 =====
  if (checkButton) {
    checkButton.addEventListener('click', async () => {
      const userID = userIDInput.value.trim();

      // 입력값 검증
      if (!userID) {
        resultSpan.textContent = '아이디를 입력해주세요.';
        resultSpan.className = 'check-result error';
        return;
      }

      try {        
        // 서버에 중복 확인 요청
        const response = await fetch('/check-userid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userID })
        });

        const data = await response.json();

        if (response.ok) {
          // 사용 가능한 아이디
          resultSpan.textContent = '사용 가능한 아이디입니다.';
          resultSpan.className = 'check-result success';
          isUserIDChecked = true;
          isUserIDAvailable = true;
        } else {
          // 이미 존재하는 아이디
          resultSpan.textContent = '이미 사용 중인 아이디입니다.';
          resultSpan.className = 'check-result error';
          isUserIDChecked = true;
          isUserIDAvailable = false;
        }
      } catch (error) {
        console.error('중복 확인 오류:', error);
        resultSpan.textContent = '중복 확인 중 오류가 발생했습니다.';
        resultSpan.className = 'check-result error';
      }
    });
  }

  // ===== 아이디 입력 필드 변경 시 중복 확인 초기화 =====
  if (userIDInput) {
    userIDInput.addEventListener('input', () => {
      isUserIDChecked = false;
      isUserIDAvailable = false;
      resultSpan.textContent = '';
      resultSpan.className = 'check-result';  
    });
  }

  // ===== 회원가입 폼 제출 =====
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 에러 표시 함수
      function showError(message) {
        if (errorDiv) {
          errorDiv.textContent = message;
          errorDiv.style.display = 'block';
        } else {
          alert(message);
        }
      }

      function hideError() {
        if (errorDiv) {
          errorDiv.textContent = '';
          errorDiv.style.display = 'none';
        }
      }
      
      // 중복 확인 여부 체크
      if (!isUserIDChecked) {
        showError('아이디 중복 확인을 해주세요.');
        return;
      }

      if (!isUserIDAvailable) {
        showError('사용할 수 없는 아이디입니다.');
        return;
      }

      // 비밀번호 확인
      const password = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;

      if (password !== password2) {
        showError('비밀번호가 일치하지 않습니다.');
        return;
      }

      hideError();

      // 폼 데이터 수집
      const formData = new FormData(e.target);
      const data = {
        username: formData.get('username'), 
        userID: formData.get('userID'),
        password: formData.get('password'),
        password2: formData.get('password2')
      };

      try {
        const response = await fetch('/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          alert('회원가입이 완료되었습니다!');
          window.location.href = '/login';
        } else {
          showError(result.message || '회원가입에 실패했습니다.');
        }
      } catch (error) {
        console.error('회원가입 오류:', error);
        showError('회원가입 중 오류가 발생했습니다.');
      }
    });
  }
});