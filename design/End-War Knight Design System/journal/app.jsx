/* 저널 디자인 캔버스 — 10종 변주를 두 표면 그룹으로 배치 */
function JournalCard({ html }) {
  return <div style={{ width: '100%', height: '100%' }}
    dangerouslySetInnerHTML={{ __html: html }} />;
}

function App() {
  const all = window.JOURNALS || [];
  const dark = all.filter((j) => j.group === 'dark');
  const paper = all.filter((j) => j.group === 'paper');

  const board = (j) => (
    <DCArtboard key={j.id} id={j.id} label={j.label} width={j.w} height={j.h}>
      <JournalCard html={j.html} />
    </DCArtboard>
  );

  return (
    <DesignCanvas>
      <DCSection id="dark" title="어두운 면 · 제국 문서"
        subtitle="잉크빛 표면 — 기밀 문서철, 인물 기록부, 관보, 작전보고, 연대기, 임무 브리핑, 표지">
        {dark.map(board)}
      </DCSection>
      <DCSection id="paper" title="양피지 면 · 사료와 서신"
        subtitle="따뜻한 종이 표면 — 외전 사료, 수배 포고문, 개인 서신">
        {paper.map(board)}
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
