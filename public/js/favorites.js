// 페이지 로드 시 곡 개수 가져오기
async function loadFavoritesCounts() {
  try {
    const response = await fetch('/api/favorites/count');
    const data = await response.json();

    if (response.ok && data.success) {
      const counts = data.data;
      // 각 폴더 버튼 업데이트
      Object.keys(counts).forEach(emotion => {
        const folder = document.querySelector(`.mood-folder[data-mood="${emotion}"]`);
        if (folder) {
          const button = folder.querySelector('.folder-btn');
          const count = counts[emotion];
          button.textContent = `→ ${count}곡 들으러 가기`;

          // 곡이 없으면 버튼 비활성화
          if (count === 0) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
          }
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // 모든 폴더 버튼 선택
  const folderBtns = document.querySelectorAll('.folder-btn');
  const moodFolders = document.querySelectorAll('.mood-folder');

  // 곡 개수 로드
  loadFavoritesCounts();

  // 폴더 버튼 클릭 이벤트
  folderBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (btn.disabled) {
        alert('저장된 음악이 없습니다.');
        return;
      }

      const folder = btn.closest('.mood-folder');
      const mood = folder.dataset.mood;

      // 해당 감정의 음악 목록 페이지로 이동
      window.location.href = `/musiclist?emotion=${mood}`;
    });
  });

  // 폴더 전체 클릭 이벤트
  moodFolders.forEach((folder) => {
    folder.addEventListener('mouseenter', () => {
      folder.classList.add('hover');
    });

    folder.addEventListener('mouseleave', () => {
      folder.classList.remove('hover');
    });
  });
});