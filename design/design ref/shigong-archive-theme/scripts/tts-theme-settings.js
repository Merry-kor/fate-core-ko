/* ════════════════════════════════════════════════════════════════════
   시공열차 아카이브 — 테마 설정 (Foundry VTT v13/v14)
   tts-theme-settings.js
   ────────────────────────────────────────────────────────────────────
   "테마 색" + "명암(다크/라이트)" 두 설정을 등록하고, 변경 시
   <body>에 tts-theme-<id> / tts-mode-<mode> 클래스를 토글한다.
   tts-themes.css 가 그 클래스로 --tts-* 토큰을 정의한다.
   module.json 의 esmodules 에 이 파일을, styles 에 tts-themes.css 를 추가.
   설정은 client 범위(플레이어별). world 공통으로 강제하려면 scope:'world'.
   ════════════════════════════════════════════════════════════════════ */

const MODULE_ID = 'shigong-archive-theme';   // ← 실제 모듈 id 로 교체
const TTS_THEME_IDS = ["ember","moonlight","dancheong","celadon","amethyst"];
const TTS_MODES = ['dark', 'light'];

function ttsApplyTheme() {
  const theme = game.settings.get(MODULE_ID, 'palette');
  const mode  = game.settings.get(MODULE_ID, 'mode');
  const b = document.body;
  b.classList.remove(...TTS_THEME_IDS.map(t => 'tts-theme-' + t), ...TTS_MODES.map(m => 'tts-mode-' + m));
  b.classList.add('tts-theme-' + theme, 'tts-mode-' + mode);
}

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, 'palette', {
    name: '시공열차 — 테마 색',
    hint: '인터페이스 강조·배경 색 계열.',
    scope: 'client', config: true, type: String, default: 'ember',
    choices: {
          "ember": "불씨 · EMBER",
          "moonlight": "월령 · MOONLIGHT",
          "dancheong": "단청 · DANCHEONG",
          "celadon": "청려 · CELADON",
          "amethyst": "자수정 · AMETHYST"
    },
    onChange: ttsApplyTheme,
  });
  game.settings.register(MODULE_ID, 'mode', {
    name: '시공열차 — 명암',
    hint: '다크(기본) 또는 라이트(빛바랜 고서).',
    scope: 'client', config: true, type: String, default: 'dark',
    choices: { dark: '다크 · DARK', light: '라이트 · LIGHT' },
    onChange: ttsApplyTheme,
  });
});

Hooks.once('ready', ttsApplyTheme);
