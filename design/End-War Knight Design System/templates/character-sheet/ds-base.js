// templates/character-sheet/ds-base.js
// 이 파일 한 줄만 수정하면 DS를 다른 위치에서 참조할 수 있습니다.
(() => {
  const base = '../..'; // 소비 프로젝트에서 사용할 경우 _ds/<folder> 경로로 변경

  // ── Global stylesheet ──
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = base + '/styles.css';
  document.head.appendChild(link);

  // ── DS component bundle ──
  const s = document.createElement('script');
  s.src = base + '/_ds_bundle.js';
  s.onerror = () => console.error(
    'ds-base.js: failed to load ' + s.src +
    ' — if this is a consuming project, update `base` to point at the _ds/<folder> tree'
  );
  document.head.appendChild(s);
})();
