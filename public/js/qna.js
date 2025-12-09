// Q&A 제출 처리
document.getElementById('qnaForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const content = document.getElementById('qnaContent').value;
  const submitBtn = document.getElementById('qnaSubmitBtn');

  // 버튼 비활성화
  submitBtn.disabled = true;
  submitBtn.textContent = '전송 중...';

  try {
    const response = await fetch('/qna', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message);
      // 전송 후 입력창 초기화
      document.getElementById('qnaContent').value = "";
    } else {
      alert(data.message || '문의 전송에 실패했습니다.');
    }
  } catch (error) {
    console.error('Q&A 전송 오류:', error);
    alert('문의 전송 중 오류가 발생했습니다.');
  } finally {
    // 버튼 다시 활성화
    submitBtn.disabled = false;
    submitBtn.textContent = '보내기';
  }
});
