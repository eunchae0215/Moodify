// 헤더 로고 클릭 처리
document.addEventListener('DOMContentLoaded', () => {
  const logoLink = document.querySelector('.logo-link');

  if (logoLink) {
    logoLink.addEventListener('click', async (e) => {
      e.preventDefault(); // 기본 링크 동작 방지

      try {
        console.log('[Header] 로고 클릭 - 최근 감정 조회 시작');

        // 최근 감정 조회 API 호출
        const response = await fetch('/api/emotions/latest');

        if (!response.ok) {
          // 감정이 없으면 index로 이동
          if (response.status === 404) {
            console.log('[Header] 저장된 감정 없음 - index로 이동');
            window.location.href = '/index';
            return;
          }
          throw new Error('감정 조회 실패');
        }

        const data = await response.json();
        console.log('[Header] 최근 감정 조회 성공:', data.data);

        const { emotionId, emotion } = data.data;

        // music_card로 이동 (파라미터 포함)
        window.location.href = `/music?emotion=${emotion}&emotionId=${emotionId}`;

      } catch (error) {
        console.error('[Header] 로고 클릭 오류:', error);
        // 에러 발생 시 index로 이동
        window.location.href = '/index';
      }
    });
  }
});
