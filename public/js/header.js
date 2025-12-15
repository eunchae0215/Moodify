// 헤더 로고 클릭 처리
document.addEventListener('DOMContentLoaded', () => {
  const logoLink = document.querySelector('.logo-link');

  if (logoLink) {
    logoLink.addEventListener('click', async (e) => {
      e.preventDefault(); 

      try {
        // 최근 감정 조회 API 호출
        const response = await fetch('/api/emotions/latest');

        if (!response.ok) {
          // 감정이 없으면 index로 이동
          if (response.status === 404) {
            window.location.href = '/index';
            return;
          }
          throw new Error('감정 조회 실패');
        }

        const data = await response.json();
        const { emotionId, emotion } = data.data;

        // music_card로 이동 
        window.location.href = `/music?emotion=${emotion}&emotionId=${emotionId}`;

      } catch (error) {
        console.error(error);
        // 에러 발생 시 index로 이동
        window.location.href = '/index';
      }
    });
  }
});
