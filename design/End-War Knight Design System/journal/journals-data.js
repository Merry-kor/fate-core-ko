/* 종전의 기사 — 저널 디자인 10종 콘텐츠
   각 항목: { id, label, group, w, h, html }
   group: 'dark' | 'paper'
   이미지 경로는 journal/ 기준 상대경로(../assets/...) */
window.JOURNALS = [

/* ════════════════════════════════════════════════════
   01 · 기밀 문서철 (Classified Dossier)
   ════════════════════════════════════════════════════ */
{
  id: 'dossier', label: '01 · 기밀 문서철', group: 'dark', w: 720, h: 884,
  html: `
  <div class="jr jr-dark">
    <div class="jr-dossier__bar">
      <span>기밀 · GEHEIM</span>
      <span>열람등급 — SCHWARZ Ⅳ</span>
    </div>
    <div class="jr-pad">
      <div class="jr-dossier__head">
        <div>
          <div class="jr-eyebrow">제국 보안성 · 문서철 ITPA—0774</div>
          <h1 class="jr-title lg" style="margin-top:12px;">제4치유원 밀폐구역<br>사건 조사 보고</h1>
          <div class="jr-subtitle">Vorfall im 4. Heilanstalt — 미결 · 재조사 권고</div>
        </div>
        <div class="jr-stamp">검열필</div>
      </div>

      <dl class="jr-dossier__metarow jr-meta" style="grid-template-columns:repeat(4,auto);">
        <div><dt>발생</dt><dd>제국력 1147.03.19</dd></div>
        <div><dt>관할</dt><dd>아들러부르크 동부</dd></div>
        <div><dt>분류</dt><dd>이단 · 기밀처분</dd></div>
        <div><dt>상태</dt><dd style="color:var(--accent-crimson-bright);">진행중</dd></div>
      </dl>

      <p class="jr-lede" style="margin-bottom:16px;">제4치유원 밀폐구역에서 다수의 시민이 행방불명되었다. 현장에서 회수된 가스 밀폐 설비와 <span class="jr-redact">████ 명령서</span>는 본 사건이 단순 사고가 아님을 시사한다.</p>

      <p class="jr-prose">조사관은 밀폐구역 내부에서 비정상적인 신비 잔향을 감지하였다. 벽면에 남은 흔적은 <span class="jr-redact">██████████████</span> 으로 추정되며, 생존자 진술에 따르면 화물칸을 통해 침입한 정체불명의 무장 집단이 봉인을 파괴하고 수용자들을 탈출시켰다고 한다.</p>

      <p class="jr-prose">탈출을 도운 자들은 군용 외투와 제국 정규 화기를 소지하고 있었다. 그중 한 명은 <em style="font-style:italic;color:var(--accent-gold);">고철을 다루는 신비</em>를 사용해 방폭문을 통째로 진흙으로 환원시켰다고 진술되었다. 이는 <span class="jr-redact">스피어헤드 ███</span> 의 수법과 일치한다.</p>

      <div class="jr-chips" style="margin:20px 0;">
        <span class="jr-chip trouble">제국이 지운 이름들</span>
        <span class="jr-chip situation">봉인이 풀린 밀폐구역 #단기</span>
      </div>

      <p class="jr-prose">본 조사관은 이 사건을 단순 탈주 방조가 아닌 <strong style="color:var(--text-strong);">조직적 항명</strong>으로 재분류할 것을 권고한다. 관련자 전원에 대한 <span class="jr-redact">█████ 영장</span> 발부가 요청된 상태다.</p>
    </div>

    <div class="jr-pad" style="position:absolute;bottom:0;left:0;right:0;padding-top:0;">
      <div class="jr-rule hair" style="margin-bottom:12px;"></div>
      <div class="jr-between jr-foot">
        <span>조사관 — 대이단심문관실 직속</span>
        <span>사본 3부 · 원본 봉인 보관</span>
      </div>
    </div>
  </div>`
},

/* ════════════════════════════════════════════════════
   02 · 인물 기록부 (Personnel Dossier)
   ════════════════════════════════════════════════════ */
{
  id: 'npc', label: '02 · 인물 기록부', group: 'dark', w: 760, h: 624,
  html: `
  <div class="jr jr-dark">
    <div class="jr-npc">
      <div class="jr-npc__portrait">
        <img src="../assets/portraits/anya.png" alt="안야 슈탈">
        <div class="jr-npc__id">
          <div class="jr-eyebrow" style="color:var(--ewk-gold-300);">소위 · 스피어헤드</div>
          <div class="jr-title md" style="margin-top:6px;">안야 슈탈</div>
          <div class="jr-foot" style="margin-top:4px;">Anya Stahl · 군번 미상</div>
        </div>
      </div>

      <div class="jr-npc__body">
        <div class="jr-eyebrow">인물 기록부 · PERSONNEL</div>
        <p class="jr-prose" style="font-size:14.5px;margin-top:12px;">고철을 부리는 스피어헤드의 뒷골목 이단아. 버려진 것들 속에서 쓸모를 읽어내고, 그것을 무기로 되살린다. 말은 짧고 손은 빠르다.</p>

        <div class="jr-chips" style="margin:16px 0;">
          <span class="jr-chip identity">고철을 부리는 뒷골목 이단아</span>
          <span class="jr-chip trouble">쓸모없는 건 없다, 나 자신조차도</span>
        </div>

        <div style="margin-top:auto;">
          <div class="jr-side-label">주요 기량</div>
          <div class="jr-stat"><span class="jr-stat__name">제작 · 고철 환원</span><span class="jr-stat__val">+4 · 엄청남</span></div>
          <div class="jr-stat"><span class="jr-stat__name">사격</span><span class="jr-stat__val">+3 · 우수</span></div>
          <div class="jr-stat"><span class="jr-stat__name">은밀</span><span class="jr-stat__val">+2 · 양호</span></div>

          <div style="margin-top:16px;">
            <div class="jr-between" style="margin-bottom:6px;">
              <span class="jr-side-label" style="margin:0;">교전 위험 평가</span>
              <span class="jr-foot" style="color:var(--accent-crimson-bright);">높음 · 4/5</span>
            </div>
            <div class="jr-meter threat"><span style="width:80%;"></span></div>
          </div>
        </div>
      </div>
    </div>
  </div>`
},

/* ════════════════════════════════════════════════════
   03 · 관보 / 지명 사전 (Gazetteer)
   ════════════════════════════════════════════════════ */
{
  id: 'gazetteer', label: '03 · 관보 · 지명 사전', group: 'dark', w: 720, h: 860,
  html: `
  <div class="jr jr-dark">
    <div class="jr-gaz__hero">
      <img src="../assets/scenes/c2_blackiron.png" alt="흑철상회">
      <div class="jr-gaz__overlay">
        <div class="jr-eyebrow" style="color:var(--ewk-gold-300);">제국 관보 · 지명 사전</div>
        <h1 class="jr-title xl" style="margin-top:8px;">흑철상회</h1>
        <div class="jr-subtitle">루어스 공업단지 · Schwarzeisen—Handelskontor</div>
      </div>
    </div>

    <dl class="jr-gaz__facts">
      <div class="jr-gaz__fact"><dt>행정구</dt><dd>루어스 제3공구</dd></div>
      <div class="jr-gaz__fact"><dt>통제 세력</dt><dd>제미나이 상회</dd></div>
      <div class="jr-gaz__fact"><dt>위협 등급</dt><dd style="color:var(--accent-crimson-bright);">적색</dd></div>
    </dl>

    <div class="jr-pad">
      <p class="jr-lede" style="margin-bottom:14px;">굴뚝의 장막 아래, 기름과 금속 가루로 숨이 막히는 거리. 흑철상회는 루어스 공업단지의 심장이자, 제국 밑바닥의 모든 거래가 흘러드는 어두운 우물이다.</p>

      <p class="jr-prose">낮에는 합법적인 주물 공장이지만, 밤이 되면 밀수와 청부의 시장이 열린다. 회랑마다 사슬과 도르래가 늘어서 있고, 붉게 달아오른 용광로의 불빛만이 유일한 등불이다.</p>

      <div class="jr-chips" style="margin:18px 0;">
        <span class="jr-chip situation">사방에서 늘어진 사슬과 도르래</span>
        <span class="jr-chip situation">붉게 달아오른 용광로의 열기</span>
      </div>

      <p class="jr-prose">이곳에서 안야 일행은 추격을 따돌리고 쓸 만한 고철을 확보했다. 그러나 흑철상회의 주인은 결코 빚을 잊지 않는다 — 한 번 발을 들인 자는 반드시 대가를 치른다.</p>

      <div class="jr-rule hair" style="margin:18px 0 10px;"></div>
      <div class="jr-foot">최종 갱신 · 제2장 시점 — 정보원 「새벽까마귀」 제공</div>
    </div>
  </div>`
},

/* ════════════════════════════════════════════════════
   04 · 작전 사후 보고 (After-Action Report)
   ════════════════════════════════════════════════════ */
{
  id: 'aar', label: '04 · 작전 사후 보고', group: 'dark', w: 720, h: 800,
  html: `
  <div class="jr jr-dark jr-pad">
    <div class="jr-aar__head">
      <div>
        <div class="jr-eyebrow">작전 사후 보고 · NACHBERICHT</div>
        <h1 class="jr-title lg" style="margin-top:10px;">야간 화물열차 강행 돌파</h1>
      </div>
      <dl class="jr-meta" style="text-align:right;justify-items:end;grid-template-columns:1fr;gap:8px;">
        <div><dt>작전명</dt><dd>EISBRECHER</dd></div>
        <div><dt>일자</dt><dd>1147.04.02</dd></div>
        <div><dt>지휘</dt><dd>제1사단 특임</dd></div>
      </dl>
    </div>

    <div style="margin:24px 0 8px;" class="jr-side-label">교전 목표 및 결과</div>

    <div class="jr-obj">
      <div class="jr-obj__num">01</div>
      <div class="jr-obj__body">
        <div class="jr-obj__title">방폭문 경비 제압</div>
        <div class="jr-obj__note">이반 — 「강하게」 극복, 총합 +5 (엄청남). 강철 문 완파.</div>
      </div>
      <span class="jr-tag green">완료</span>
    </div>

    <div class="jr-obj">
      <div class="jr-obj__num">02</div>
      <div class="jr-obj__body">
        <div class="jr-obj__title">고철 야수 부품 확보</div>
        <div class="jr-obj__note">안야 — 「세심하게」 기회 만들기, 총합 +6 (환상적). 공짜 발현 2회.</div>
      </div>
      <span class="jr-tag green">완료</span>
    </div>

    <div class="jr-obj">
      <div class="jr-obj__num">03</div>
      <div class="jr-obj__body">
        <div class="jr-obj__title">수용자 전원 후송</div>
        <div class="jr-obj__note">체온 저하로 1명 낙오 — 임시 은신처에서 회복 조치.</div>
      </div>
      <span class="jr-tag gold">부분 달성</span>
    </div>

    <div class="jr-obj" style="border-bottom:none;">
      <div class="jr-obj__num">04</div>
      <div class="jr-obj__body">
        <div class="jr-obj__title">흔적 은폐</div>
        <div class="jr-obj__note">제국 보안성에 사건 노출 — 추적 개시 확인.</div>
      </div>
      <span class="jr-tag crimson">실패</span>
    </div>

    <div class="jr-rule" style="margin:22px 0 16px;"></div>
    <p class="jr-prose" style="font-size:15px;">강철 문이 굉음과 함께 무너졌다. 작전 목표는 대부분 달성되었으나, 제국의 눈을 완전히 따돌리지는 못했다. 다음 행로는 국경을 향한다.</p>

    <div class="jr-seal-wax">승인<br>제1사단<br>스피어헤드</div>
  </div>`
},

/* ════════════════════════════════════════════════════
   05 · 전역 연대기 (Timeline)
   ════════════════════════════════════════════════════ */
{
  id: 'timeline', label: '05 · 전역 연대기', group: 'dark', w: 700, h: 884,
  html: `
  <div class="jr jr-dark jr-pad">
    <div class="jr-eyebrow">전역 연대기 · CHRONIK</div>
    <h1 class="jr-title lg" style="margin:10px 0 6px;">스피어헤드의 행로</h1>
    <div class="jr-subtitle" style="margin-bottom:26px;">제1사단 특임 위관조가 걸어온 길</div>

    <div class="jr-tl">
      <div class="jr-tl__item crimson">
        <div class="jr-tl__date">프롤로그 · 1147.03</div>
        <div class="jr-tl__title">가스실 안에서</div>
        <div class="jr-tl__body">제4치유원 밀폐구역. 제국이 지우려 한 이름들 사이에서, 네 명의 기사가 처음으로 같은 숨을 쉬었다.</div>
      </div>

      <div class="jr-tl__item">
        <div class="jr-tl__date">제1장 · 1147.03</div>
        <div class="jr-tl__title">눈먼자들의 도시</div>
        <div class="jr-tl__body">아들러부르크의 뒷골목. 제미나이의 추격을 따돌리고, 루가 장갑차를 진흙으로 되돌렸다.</div>
      </div>

      <div class="jr-tl__item">
        <div class="jr-tl__date">제2장 · 1147.04</div>
        <div class="jr-tl__title">계약으로 이어진 유산</div>
        <div class="jr-tl__body">야간 화물열차와 루어스 공업단지. 흑철상회에서 빚을 졌고, 제4치유원의 진실에 한 걸음 더 다가섰다.</div>
      </div>

      <div class="jr-tl__item crimson">
        <div class="jr-tl__date">제3장 · 1147.04</div>
        <div class="jr-tl__title">국경의 밤</div>
        <div class="jr-tl__body">외곽 제분소의 지하. 전날 밤의 그림자가 국경마을까지 따라붙는다. 동쪽 삼림 너머에 무엇이 기다리는가.</div>
      </div>

      <div class="jr-tl__item" style="padding-bottom:0;">
        <div class="jr-tl__date">다음 장 · 미기록</div>
        <div class="jr-tl__title" style="color:var(--text-muted);font-style:italic;">아직 쓰이지 않은 페이지</div>
        <div class="jr-tl__body">…</div>
      </div>
    </div>
  </div>`
},

/* ════════════════════════════════════════════════════
   06 · 임무 브리핑 (Mission Briefing)
   ════════════════════════════════════════════════════ */
{
  id: 'briefing', label: '06 · 임무 브리핑', group: 'dark', w: 740, h: 820,
  html: `
  <div class="jr jr-dark jr-pad">
    <div class="jr-between" style="align-items:flex-start;">
      <div>
        <div class="jr-eyebrow">임무 브리핑 · EINSATZBEFEHL</div>
        <h1 class="jr-title lg" style="margin-top:10px;">외곽 제분소 잠입</h1>
        <div class="jr-subtitle">전날 밤의 진실을 캐낸다</div>
      </div>
      <span class="jr-tag crimson">기밀 작전</span>
    </div>

    <div class="jr-rule" style="margin:20px 0 22px;"></div>

    <div class="jr-mb__grid">
      <div>
        <div class="jr-side-label">교전 목표</div>
        <div class="jr-task done">
          <div class="jr-task__box">✓</div>
          <div><div class="jr-task__t">제분소 외곽 정찰</div><div class="jr-task__d">경비 배치와 진입로를 확인한다.</div></div>
        </div>
        <div class="jr-task">
          <div class="jr-task__box"></div>
          <div><div class="jr-task__t">지하 봉인실 진입</div><div class="jr-task__d">전날 밤 무언가가 묻힌 곳. 흔적을 따라간다.</div></div>
        </div>
        <div class="jr-task">
          <div class="jr-task__box"></div>
          <div><div class="jr-task__t">증거 회수 후 이탈</div><div class="jr-task__d">국경마을로 돌아오기 전, 추격을 차단한다.</div></div>
        </div>
      </div>

      <div>
        <div class="jr-mb__map">위치 지도<br>「외곽 제분소」<br>이미지 자리</div>
        <div class="jr-side-card" style="margin-top:14px;">
          <div class="jr-side-label">보상</div>
          <div class="jr-between" style="margin-bottom:6px;"><span style="font-size:13px;color:var(--text-body);">운명점</span><span class="jr-stat__val">+2</span></div>
          <div class="jr-between"><span style="font-size:13px;color:var(--text-body);">이정표</span><span class="jr-stat__val">소</span></div>
        </div>
        <div class="jr-side-card">
          <div class="jr-side-label">난이도 · 위험</div>
          <div class="jr-dots"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div>
        </div>
      </div>
    </div>

    <div class="jr-rule hair" style="margin:24px 0 12px;"></div>
    <p class="jr-prose" style="font-size:14.5px;">거미줄과 먼지 사이, 등불 하나가 낡은 지도를 비춘다. 이곳에 묻힌 비밀은 결코 곱게 잠들어 있지 않다.</p>
  </div>`
},

/* ════════════════════════════════════════════════════
   07 · 표지 / 목차 (Codex Cover + Index)
   ════════════════════════════════════════════════════ */
{
  id: 'cover', label: '07 · 표지 · 목차', group: 'dark', w: 680, h: 1296,
  html: `
  <div class="jr jr-dark">
    <div class="jr-cover__hero">
      <img src="../assets/scenes/cover.png" alt="종전의 기사">
    </div>

    <div class="jr-toc">
      <div class="jr-between" style="margin-bottom:14px;">
        <div class="jr-eyebrow">목차 · INHALT</div>
        <div class="jr-seal sm">終</div>
      </div>

      <div class="jr-toc__row">
        <span class="jr-toc__num">00</span><span class="jr-toc__name">프롤로그 — 종전의 기사</span>
        <span class="jr-toc__lead"></span><span class="jr-toc__pg">003</span>
      </div>
      <div class="jr-toc__row">
        <span class="jr-toc__num">01</span><span class="jr-toc__name">눈먼자들의 도시</span>
        <span class="jr-toc__lead"></span><span class="jr-toc__pg">021</span>
      </div>
      <div class="jr-toc__row">
        <span class="jr-toc__num">02</span><span class="jr-toc__name">계약으로 이어진 유산</span>
        <span class="jr-toc__lead"></span><span class="jr-toc__pg">047</span>
      </div>
      <div class="jr-toc__row">
        <span class="jr-toc__num">03</span><span class="jr-toc__name">국경의 밤</span>
        <span class="jr-toc__lead"></span><span class="jr-toc__pg">079</span>
      </div>
      <div class="jr-toc__row" style="border-bottom:none;">
        <span class="jr-toc__num" style="color:var(--text-faint);">04</span><span class="jr-toc__name" style="color:var(--text-muted);font-style:italic;">— 미기록</span>
        <span class="jr-toc__lead"></span><span class="jr-toc__pg" style="color:var(--text-faint);">···</span>
      </div>
    </div>
  </div>`
},

/* ════════════════════════════════════════════════════
   08 · 사료 / 외전 (Chronicle — parchment)
   ════════════════════════════════════════════════════ */
{
  id: 'chronicle', label: '08 · 사료 · 외전', group: 'paper', w: 700, h: 904,
  html: `
  <div class="jr jr-paper jr-pad-lg">
    <div class="jr-chron__head">
      <div class="jr-ornament">✦ ✦ ✦</div>
      <div class="jr-eyebrow paper" style="justify-content:center;margin:14px 0 8px;">제국 비사 · 외전</div>
      <h1 class="jr-title lg" style="font-size:32px;">신비라 불리는 것에 대하여</h1>
      <div class="jr-subtitle">Über das, was man Mysterium nennt</div>
      <div class="jr-rule full" style="margin:18px auto;max-width:320px;"></div>
    </div>

    <p class="jr-prose jr-dropcap" style="margin-top:18px;">신비는 정의되지 않는다. 그것을 다루는 자마다 다른 이름으로 부르고, 다른 모습으로 발현시킨다. 어떤 이에게는 고철을 되살리는 손이며, 어떤 이에게는 강철을 진흙으로 되돌리는 숨결이고, 또 어떤 이에게는 쌍둥이의 피에 새겨진 전승이다.</p>

    <div style="display:grid;grid-template-columns:1fr 200px;gap:24px;align-items:start;margin:18px 0;">
      <p class="jr-prose">제국은 이 힘을 두려워하여 「치유원」이라는 이름의 시설에 가두려 했다. 그러나 신비는 가둘 수 있는 것이 아니다. 그것은 사람의 정의 그 자체이기 때문이다. 한 사람의 신비를 지운다는 것은, 그 사람을 지운다는 것과 같다.</p>
      <div class="jr-margin">방주(傍註) — 본 기록은 영물 「루」의 대지에 새겨진 구전을 옮긴 것이다. 그의 시간은 인간의 것보다 아득히 길다.</div>
    </div>

    <div class="jr-ornament" style="margin:8px 0;">✦</div>

    <p class="jr-prose">그러므로 이 무용담을 기록하는 까닭은 단순하다. 인간은 금방 죽지만, 이야기는 남는다. 제국이 지우려 한 이름들이, 적어도 이 양피지 위에서만큼은 영원히 살아 있도록.</p>

    <div class="jr-rule full" style="margin:24px auto 0;max-width:200px;"></div>
    <div class="jr-foot" style="text-align:center;margin-top:14px;">— 루의 대지에 새겨진 기록 중에서</div>
  </div>`
},

/* ════════════════════════════════════════════════════
   09 · 포고문 / 수배령 (Proclamation — parchment)
   ════════════════════════════════════════════════════ */
{
  id: 'proclamation', label: '09 · 포고문 · 수배령', group: 'paper', w: 680, h: 900,
  html: `
  <div class="jr jr-paper" style="overflow:visible;">
    <div class="jr-proc__banner">
      <div class="jr-proc__kicker">제국 보안성 포고 · STECKBRIEF</div>
      <div style="font-family:var(--font-serif);font-weight:900;font-size:44px;letter-spacing:0.3em;margin-top:6px;">현상수배</div>
      <div class="jr-seal jr-proc__seal">終</div>
    </div>

    <div class="jr-proc__body">
      <p class="jr-foot" style="color:var(--paper-text-faint);margin-bottom:18px;">아래 인물을 보거나 그 행방을 아는 자는<br>즉시 가장 가까운 제국 보안소에 신고하라.</p>

      <div class="jr-proc__name">스피어헤드 이탈자 4인</div>
      <div class="jr-subtitle" style="margin:4px 0 18px;">제1사단 특임 위관조 — 탈주 및 조직적 항명</div>

      <div class="jr-proc__reward">
        <span class="jr-foot" style="color:var(--ewk-crimson-700);letter-spacing:0.18em;">현 상 금</span>
        <b>30,000 마르크</b>
        <span class="jr-foot" style="color:var(--paper-text-faint);">생사 불문 · 1인당</span>
      </div>

      <div style="text-align:left;max-width:420px;margin:22px auto 0;">
        <div class="jr-eyebrow paper" style="margin-bottom:10px;">고발 죄목</div>
        <p class="jr-prose" style="font-size:14px;line-height:1.7;">· 제4치유원 밀폐구역 봉인 파괴<br>· 수용자 무단 후송 및 탈주 방조<br>· 제국 정규 화기 불법 보유<br>· 이단 신비 행사 — <em>가장 중대한 죄</em></p>
      </div>

      <div class="jr-rule full" style="margin:24px auto 14px;max-width:240px;"></div>
      <div class="jr-foot" style="color:var(--paper-text-faint);">대이단심문관실 직인 · 위조 시 극형</div>
    </div>
  </div>`
},

/* ════════════════════════════════════════════════════
   10 · 서신 (Correspondence — parchment)
   ════════════════════════════════════════════════════ */
{
  id: 'letter', label: '10 · 서신', group: 'paper', w: 680, h: 824,
  html: `
  <div class="jr jr-paper">
    <div class="jr-letter">
      <div class="jr-letter__date">제국력 1147년 4월 7일 · 국경마을에서</div>

      <div class="jr-letter__salute">친애하는 루트비히 중령께,</div>

      <div class="jr-letter__body">
        <p>당신이 이 편지를 읽을 무렵이면, 나는 이미 국경을 넘었을 것입니다. 부디 나를 배신자라 부르지는 말아 주십시오. 나는 다만, 더 이상 외면할 수 없었을 뿐입니다.</p>
        <p>제4치유원에서 본 것을 당신께 말할 수는 없습니다. 다만 한 가지만 전합니다 — 그곳에서 지워진 이름들은 죄인이 아니었습니다. 그들은 그저 다른 방식으로 숨을 쉬는 사람들이었습니다.</p>
        <p>제국의 태양은 여전히 등 뒤에서 빛나고 있겠지요. 그러나 나는 이제 그 빛이 무엇을 그림자로 가리는지 압니다. 언젠가 당신도 같은 질문 앞에 서게 될 것입니다.</p>
      </div>

      <div class="jr-letter__sign">
        <div class="name">구스타프 폰 아르님</div>
        <div class="role">전(前) 제국 보안성 · 제1사단</div>
        <div class="jr-wax" style="margin-top:16px;">終</div>
      </div>
    </div>
  </div>`
}

];
