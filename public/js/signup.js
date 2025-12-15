let isUserIDChecked = false;
let isUserIDAvailable = false;

document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소
  const checkButton = document.getElementById('checkDuplicate');
  const userIDInput = document.getElementById('userID');
  const resultSpan = document.getElementById('duplicateResult');
  const signupForm = document.getElementById('signupForm');
  const errorDiv = document.getElementById('errorMessage');
  const passwordInput = document.getElementById('password');
  const password2Input = document.getElementById('password2');
  const passwordResultSpan = document.getElementById('passwordResult');

  // 중복 확인 버튼 클릭 이벤트
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

  // 아이디 입력 필드 변경 시 중복 확인 초기화 
  if (userIDInput) {
    userIDInput.addEventListener('input', () => {
      isUserIDChecked = false;
      isUserIDAvailable = false;
      resultSpan.textContent = '';
      resultSpan.className = 'check-result';  
    });
  }

  // 비밀번호 입력 시 에러 메시지 초기화
  if (password2Input) {
    password2Input.addEventListener('input', () => {
      passwordResultSpan.textContent = '';
      passwordResultSpan.className = 'check-result';
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      passwordResultSpan.textContent = '';
      passwordResultSpan.className = 'check-result';
    });
  }

  // 회원가입 폼 제출
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      let hasError = false;

      // 중복 확인 여부 체크
      if (!isUserIDChecked) {
        resultSpan.textContent = '아이디 중복 확인을 해주세요.';
        resultSpan.className = 'check-result error';
        hasError = true;
      } else if (!isUserIDAvailable) {
        resultSpan.textContent = '사용할 수 없는 아이디입니다.';
        resultSpan.className = 'check-result error';
        hasError = true;
      }

      // 비밀번호 확인 (아이디 검증과 독립적으로 체크)
      const password = passwordInput.value;
      const password2 = password2Input.value;

      if (password !== password2) {
        passwordResultSpan.textContent = '비밀번호가 일치하지 않습니다.';
        passwordResultSpan.className = 'check-result error';
        hasError = true;
      }

      // 에러가 있으면 제출 방지
      if (hasError) {
        e.preventDefault();
        return false;
      }

      return true;
    });
  }
});