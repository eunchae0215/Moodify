document.addEventListener('DOMContentLoaded', function() {
  // 모든 폴더 버튼 선택
  const folderBtns = document.querySelectorAll('.folder-btn');
  const moodFolders = document.querySelectorAll('.mood-folder');

  // 폴더 버튼 클릭 이벤트
  folderBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const folder = btn.closest('.mood-folder');
      const mood = folder.dataset.mood;
      
      console.log(`${mood} 폴더의 음악 목록으로 이동`);
      
      // 해당 감정의 음악 목록 페이지로 이동
      window.location.href = `/musiclist?mood=${mood}`;
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