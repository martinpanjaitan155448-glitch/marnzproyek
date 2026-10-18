/* Tabunganku — Streak Pet (karakter orisinal "Bara") ©marnzproyek
   Sistem: EXP 1/hari saat mencatat PEMASUKAN hari ini · 7 EXP = 1 level
   Junior Lv1–4 · Evolusi Lv5–9 · Ultimate Lv10+
   Lv2–9: dapat pakaian basic · Lv10+: tiap naik 1 level dapat 1 kesempatan Spin */
(function (w) {
  'use strict';
  const { S, save } = Store;
  const EXP_PER_LEVEL = 7, SPIN_FROM = 10;
  const STAGES = [
    { id: 'junior', n: 'Junior', lv: 1 },
    { id: 'evo', n: 'Evolusi', lv: 5 },
    { id: 'ult', n: 'Ultimate', lv: 10 }
  ];
  const FUR = {
    oranye: { n: 'Oranye', b: '#ff8a3d', l: '#ffc98a', d: '#d9531e' },
    cokelat: { n: 'Cokelat', b: '#8a5a3c', l: '#c9a07a', d: '#5e3a22' },
    krem: { n: 'Krem', b: '#f1dcb3', l: '#fff6e0', d: '#cdb27c' },
    biru: { n: 'Biru Es', b: '#6ec6ff', l: '#d9f2ff', d: '#3a8fd1', r: 'rare' },
    hijau: { n: 'Hijau Daun', b: '#5fd08a', l: '#cdf7dc', d: '#2f9a5a', r: 'rare' },
    ungu: { n: 'Ungu Malam', b: '#8b6df0', l: '#dccfff', d: '#5a3fc0', r: 'rare' },
    putih: { n: 'Putih Salju', b: '#f2f5fa', l: '#ffffff', d: '#b8c2d4', r: 'rare' },
    pink: { n: 'Merah Muda', b: '#ff8fc0', l: '#ffd9ea', d: '#d95c97', r: 'rare' },
    emas: { n: 'Emas', b: '#ffc93c', l: '#fff0b0', d: '#d99a10', r: 'epic' }
  };
  const SLOTS = { head: 'Kepala', face: 'Muka', neck: 'Leher', back: 'Punggung', deco: 'Hiasan' };
  const STAR = '0,-10 3,-3 10,-3 4.500,2 6.500,9 0,5 -6.500,9 -4.500,2 -10,-3 -3,-3';
  const RAR = { common: 'Biasa', rare: 'Langka', epic: 'Epik' };

  /* ---- item aksesori (kecil-kecil dulu) ---- */
  const ITEMS = {
    bow: { n: 'Pita Leher', slot: 'neck', ico: '🎀', r: 'common', lv: 2, svg: a => `<g><path d="M${a.cx} ${a.neck + 6} l-20 -11 v22z M${a.cx} ${a.neck + 6} l20 -11 v22z" fill="#ef4444"/><circle cx="${a.cx}" cy="${a.neck + 6}" r="5" fill="#b91c1c"/></g>` },
    cap: { n: 'Topi Kecil', slot: 'head', ico: '🧢', r: 'common', lv: 3, svg: a => `<g><path d="M${a.cx - 34} ${a.top + 24} Q${a.cx - 30} ${a.top - 4} ${a.cx} ${a.top - 4} Q${a.cx + 30} ${a.top - 4} ${a.cx + 34} ${a.top + 24}Z" fill="#3b82f6"/><path d="M${a.cx + 6} ${a.top + 20} Q${a.cx + 40} ${a.top + 14} ${a.cx + 50} ${a.top + 26} L${a.cx + 6} ${a.top + 27}Z" fill="#1d4ed8"/><circle cx="${a.cx}" cy="${a.top - 4}" r="4" fill="#bfdbfe"/></g>` },
    glasses: { n: 'Kacamata Bulat', slot: 'face', ico: '👓', r: 'common', lv: 4, svg: a => `<g fill="rgba(255,255,255,.18)" stroke="#1e293b" stroke-width="3"><circle cx="${a.cx - 22}" cy="${a.face}" r="15"/><circle cx="${a.cx + 22}" cy="${a.face}" r="15"/><path d="M${a.cx - 7} ${a.face}h14" fill="none"/></g>` },
    scarf: { n: 'Syal Merah', slot: 'neck', ico: '🧣', r: 'common', lv: 5, svg: a => `<g><rect x="${a.cx - 40}" y="${a.neck - 4}" width="80" height="16" rx="8" fill="#dc2626"/><path d="M${a.cx + 14} ${a.neck + 8} l12 -2 l6 30 l-16 4z" fill="#b91c1c"/><path d="M${a.cx - 30} ${a.neck + 3}h60" stroke="#fca5a5" stroke-width="2" stroke-dasharray="5 5"/></g>` },
    star: { n: 'Bintang Kecil', slot: 'deco', ico: '⭐', r: 'common', lv: 6, svg: a => `<g class="twinkle"><polygon points="${STAR}" transform="translate(${a.cx + 62} ${a.top + 6}) scale(1.500)" fill="#fde047" stroke="#f59e0b" stroke-width="1"/></g>` },
    flower: { n: 'Bunga Kecil', slot: 'deco', ico: '🌸', r: 'common', lv: 7, svg: a => { const x = a.cx - 50, y = a.top + 26; return `<g>${[0, 72, 144, 216, 288].map(t => `<circle cx="${x + 8 * Math.cos(t * Math.PI / 180)}" cy="${y + 8 * Math.sin(t * Math.PI / 180)}" r="6.500" fill="#f9a8d4"/>`).join('')}<circle cx="${x}" cy="${y}" r="5" fill="#fde047"/></g>`; } },
    partyhat: { n: 'Topi Pesta', slot: 'head', ico: '🎉', r: 'common', lv: 8, svg: a => `<g><path d="M${a.cx - 22} ${a.top + 18} L${a.cx + 4} ${a.top - 40} L${a.cx + 26} ${a.top + 18}Z" fill="#a855f7"/><path d="M${a.cx - 14} ${a.top + 2} l22 -8 M${a.cx - 18} ${a.top + 12} l38 -14" stroke="#fde047" stroke-width="4" stroke-linecap="round"/><circle cx="${a.cx + 4}" cy="${a.top - 40}" r="6" fill="#fde047"/></g>` },
    blush: { n: 'Pipi Merona', slot: 'face', ico: '😊', r: 'common', lv: 9, svg: a => `<g fill="#ff6b9a" opacity=".6"><ellipse cx="${a.cx - 38}" cy="${a.face + 14}" rx="9" ry="6"/><ellipse cx="${a.cx + 38}" cy="${a.face + 14}" rx="9" ry="6"/></g>` },
    /* item spin */
    wings: { n: 'Sayap Kecil', slot: 'back', ico: '🪽', r: 'rare', spin: 1, svg: a => wing(a, '#e0f2fe', '#7dd3fc', 1) },
    crown: { n: 'Mahkota Mini', slot: 'head', ico: '👑', r: 'rare', spin: 1, svg: a => `<g><path d="M${a.cx - 26} ${a.top + 14} V${a.top - 10} L${a.cx - 13} ${a.top + 2} L${a.cx} ${a.top - 16} L${a.cx + 13} ${a.top + 2} L${a.cx + 26} ${a.top - 10} V${a.top + 14}Z" fill="#fbbf24" stroke="#d97706" stroke-width="2"/><circle cx="${a.cx}" cy="${a.top + 2}" r="3.500" fill="#ef4444"/><circle cx="${a.cx - 14}" cy="${a.top + 7}" r="2.500" fill="#38bdf8"/><circle cx="${a.cx + 14}" cy="${a.top + 7}" r="2.500" fill="#38bdf8"/></g>` },
    shades: { n: 'Kacamata Hitam', slot: 'face', ico: '🕶️', r: 'rare', spin: 1, svg: a => `<g><rect x="${a.cx - 38}" y="${a.face - 12}" width="32" height="22" rx="8" fill="#0f172a"/><rect x="${a.cx + 6}" y="${a.face - 12}" width="32" height="22" rx="8" fill="#0f172a"/><path d="M${a.cx - 6} ${a.face - 4}h12" stroke="#0f172a" stroke-width="4"/><path d="M${a.cx - 33} ${a.face - 8}l8 0 M${a.cx + 11} ${a.face - 8}l8 0" stroke="#94a3b8" stroke-width="2.500" stroke-linecap="round"/></g>` },
    cape: { n: 'Jubah Merah', slot: 'back', ico: '🦸', r: 'rare', spin: 1, svg: a => `<g><path d="M${a.cx - 44} ${a.neck - 2} L${a.cx + 44} ${a.neck - 2} L${a.cx + 66} ${a.neck + 44} Q${a.cx} ${a.neck + 56} ${a.cx - 66} ${a.neck + 44}Z" fill="#dc2626"/><path d="M${a.cx - 66} ${a.neck + 44} Q${a.cx} ${a.neck + 56} ${a.cx + 66} ${a.neck + 44} l-4 -8 Q${a.cx} ${a.neck + 46} ${a.cx - 62} ${a.neck + 36}Z" fill="#991b1b"/></g>` },
    bell: { n: 'Lonceng Emas', slot: 'neck', ico: '🔔', r: 'rare', spin: 1, svg: a => `<g><path d="M${a.cx - 30} ${a.neck - 2} Q${a.cx} ${a.neck + 14} ${a.cx + 30} ${a.neck - 2}" stroke="#7f1d1d" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${a.cx}" cy="${a.neck + 12}" r="8" fill="#fbbf24" stroke="#d97706" stroke-width="2"/><path d="M${a.cx - 6} ${a.neck + 14}h12" stroke="#d97706" stroke-width="2"/></g>` },
    halo: { n: 'Halo Cahaya', slot: 'head', ico: '😇', r: 'epic', spin: 1, svg: a => `<g class="glow"><ellipse cx="${a.cx}" cy="${a.top - 18}" rx="28" ry="8" fill="none" stroke="#fde68a" stroke-width="5"/><ellipse cx="${a.cx}" cy="${a.top - 18}" rx="28" ry="8" fill="none" stroke="#fff" stroke-width="1.500" opacity=".8"/></g>` },
    heartglass: { n: 'Kacamata Hati', slot: 'face', ico: '💖', r: 'epic', spin: 1, svg: a => `<g fill="#ff5c8a" opacity=".88" stroke="#be185d" stroke-width="2">${[-22, 22].map(dx => `<path transform="translate(${a.cx + dx} ${a.face + 2}) scale(1.500)" d="M0 8C-16 -4 -11 -14 0 -7 11 -14 16 -4 0 8Z"/>`).join('')}<path d="M${a.cx - 8} ${a.face}h16" fill="none"/></g>` },
    dragon: { n: 'Sayap Naga', slot: 'back', ico: '🐉', r: 'epic', spin: 1, svg: a => wing(a, '#7c3aed', '#c4b5fd', 1.500) }
  };
  function wing(a, fill, stroke, k) {
    const y = a.neck, side = `<path d="M${a.cx + 36} ${y - 6} C${a.cx + 36 + 56 * k} ${y - 70 * k} ${a.cx + 40 + 76 * k} ${y - 10} ${a.cx + 36 + 56 * k} ${y + 12 * k} C${a.cx + 36 + 36 * k} ${y + 22} ${a.cx + 52} ${y + 14} ${a.cx + 36} ${y + 8}Z" fill="${fill}" stroke="${stroke}" stroke-width="2.500" stroke-linejoin="round"/>`;
    return `<g transform="translate(${2 * a.cx} 0) scale(-1 1)"><g class="wl">${side}</g></g><g class="wr">${side}</g>`;
  }
  const ITEM_IDS = Object.keys(ITEMS);
  const BASIC_BY_LEVEL = {}; ITEM_IDS.forEach(k => { if (ITEMS[k].lv) BASIC_BY_LEVEL[ITEMS[k].lv] = k; });
  function poolIds() { return [...ITEM_IDS.filter(k => ITEMS[k].spin), ...Object.keys(FUR).filter(k => !FUR[k].n || ['cokelat', 'krem', 'oranye'].indexOf(k) < 0).map(k => 'fur:' + k)]; }
  function poolInfo(id) {
    if (id.startsWith('fur:')) { const f = FUR[id.slice(4)]; return { id, n: 'Warna ' + f.n, r: f.r || 'rare', color: f.b, fur: true }; }
    const it = ITEMS[id]; return { id, n: it.n, r: it.r, ico: it.ico, slot: it.slot };
  }

  /* ---- level & status ---- */
  const level = () => 1 + Math.floor(S.pet.exp / EXP_PER_LEVEL);
  const expIn = () => S.pet.exp % EXP_PER_LEVEL;
  const stageFor = lv => lv >= 10 ? 'ult' : lv >= 5 ? 'evo' : 'junior';
  function shownStage() { const lv = level(); const s = S.pet.stage; if (s && s !== 'auto') { const st = STAGES.find(x => x.id === s); if (st && lv >= st.lv) return s; } return stageFor(lv); }
  function owned(id) { return S.pet.owned.indexOf(id) > -1; }
  function give(id) { if (!owned(id)) S.pet.owned.push(id); }

  /* beri hadiah level yang belum diberikan (aman dipanggil berulang) */
  function grantRewards() {
    const lv = level(), msgs = [];
    for (let l = 2; l <= lv; l++) {
      if (S.pet.granted.indexOf(l) > -1) continue; S.pet.granted.push(l);
      if (l >= SPIN_FROM) { S.pet.spins++; msgs.push(`Lv.${l}: +1 kesempatan Spin 🎰`); }
      else if (BASIC_BY_LEVEL[l]) { give(BASIC_BY_LEVEL[l]); msgs.push(`Lv.${l}: ${ITEMS[BASIC_BY_LEVEL[l]].n} ${ITEMS[BASIC_BY_LEVEL[l]].ico}`); }
    }
    return msgs;
  }
  /* dipanggil saat pemasukan HARI INI dicatat → +1 EXP sekali sehari */
  function onIncomeToday() {
    const t = Store.today(); if (S.pet.expDays.indexOf(t) > -1) return null;
    const before = level(); S.pet.expDays.push(t); S.pet.exp++;
    const after = level(), msgs = grantRewards(); save();
    return { leveled: after > before, level: after, msgs, evolved: stageFor(after) !== stageFor(before) };
  }

  /* ---- menggambar pet (SVG) ---- */
  const ANCH = { junior: { cx: 100, top: 70, face: 118, neck: 164 }, evo: { cx: 100, top: 50, face: 99, neck: 152 }, ult: { cx: 100, top: 46, face: 93, neck: 144 } };
  function flame(x, y, s, lit, cls) {
    const o = lit ? '#ff7a1a' : '#6f7fa3', i = lit ? '#ffd23f' : '#aab7d6', sc = lit ? s : s * .62;
    return `<g transform="translate(${x} ${y}) scale(${sc})"><g class="${cls || 'flame'}${lit ? '' : ' off'}"><path d="M0 0C8 14 18 22 14 38C12 48-12 48-14 38C-18 22-6 16 0 0Z" fill="${o}"/><path d="M0 14C5 24 9 28 7 38C6 44-6 44-7 38C-9 28-3 24 0 14Z" fill="${i}"/></g></g>`;
  }
  function render(o) {
    const f = FUR[o.fur] || FUR.oranye, st = o.stage || 'junior', a = ANCH[st], lit = o.lit !== false, eq = o.equipped || {}, cx = 100;
    const it = s => (eq[s] && ITEMS[eq[s]]) ? ITEMS[eq[s]].svg(a, f) : '';
    const dk = '#1b1030', y = a.face;
    let tail = '', body = '', fl = '';
    if (st === 'junior') {
      fl = flame(100, 34, 1, lit);
      body = `<ellipse cx="78" cy="182" rx="17" ry="8" fill="${f.d}"/><ellipse cx="122" cy="182" rx="17" ry="8" fill="${f.d}"/><ellipse cx="100" cy="128" rx="64" ry="56" fill="${f.b}"/><ellipse cx="100" cy="148" rx="38" ry="27" fill="${f.l}"/>`;
    } else if (st === 'evo') {
      fl = flame(100, 10, 1.2, lit);
      tail = `<g class="tail"><path d="M130 178 Q170 182 172 142" stroke="${f.b}" stroke-width="13" fill="none" stroke-linecap="round"/>${flame(172, 112, .42, lit, 'flame')}</g>`;
      body = `<ellipse cx="80" cy="196" rx="16" ry="8" fill="${f.d}"/><ellipse cx="120" cy="196" rx="16" ry="8" fill="${f.d}"/>
        <ellipse cx="100" cy="158" rx="40" ry="42" fill="${f.b}"/><ellipse cx="100" cy="166" rx="24" ry="27" fill="${f.l}"/>
        <ellipse cx="58" cy="158" rx="10" ry="17" fill="${f.b}" transform="rotate(20 58 158)"/><ellipse cx="142" cy="158" rx="10" ry="17" fill="${f.b}" transform="rotate(-20 142 158)"/>
        <path d="M70 66L60 36L88 56Z" fill="${f.d}"/><path d="M130 66L140 36L112 56Z" fill="${f.d}"/>
        <ellipse cx="100" cy="99" rx="58" ry="50" fill="${f.b}"/>`;
    } else {
      fl = flame(100, -4, 1.55, lit);
      tail = `<g class="tail"><path d="M134 182 Q180 190 178 138" stroke="${f.b}" stroke-width="15" fill="none" stroke-linecap="round"/>${flame(178, 100, .6, lit, 'flame')}</g>`;
      body = `<ellipse cx="82" cy="200" rx="17" ry="8" fill="${f.d}"/><ellipse cx="118" cy="200" rx="17" ry="8" fill="${f.d}"/>
        <ellipse cx="100" cy="154" rx="37" ry="46" fill="${f.b}"/><ellipse cx="100" cy="162" rx="22" ry="30" fill="${f.l}"/>
        <path d="M100 138l8 13-8 13-8-13z" fill="${lit ? '#ff7a1a' : '#6f7fa3'}" opacity=".9"/>
        <ellipse cx="60" cy="152" rx="11" ry="21" fill="${f.b}" transform="rotate(18 60 152)"/><ellipse cx="140" cy="152" rx="11" ry="21" fill="${f.b}" transform="rotate(-18 140 152)"/>
        <path d="M52 168l-6 8 10-2zM148 168l6 8-10-2z" fill="${f.d}"/>
        <path d="M70 62Q46 28 66 6Q62 36 88 52Z" fill="${f.d}"/><path d="M130 62Q154 28 134 6Q138 36 112 52Z" fill="${f.d}"/>
        <path d="M58 100L42 94L58 84Z M142 100L158 94L142 84Z" fill="${f.d}"/>
        <ellipse cx="100" cy="93" rx="55" ry="47" fill="${f.b}"/>`;
    }
    /* wajah */
    const mood = lit ? 'happy' : 'sad', p = o.personality || 'tenang';
    const eye = x => {
      if (p === 'fiery') {
        const dir = x < cx ? 1 : -1, bx1 = x - 13 * dir, bx2 = x + 12 * dir, by1 = mood === 'sad' ? y - 8 : y - 17, by2 = mood === 'sad' ? y - 17 : y - 8;
        return `<ellipse cx="${x}" cy="${y}" rx="10" ry="10" fill="#fff"/><g class="pupil"><circle cx="${x}" cy="${y + 1}" r="7" fill="#ff9d2e"/><circle cx="${x}" cy="${y + 1}" r="4" fill="${dk}"/></g><path d="M${bx1} ${by1}L${bx2} ${by2}" stroke="${f.d}" stroke-width="5" stroke-linecap="round"/>`;
      }
      if (p === 'ceria') return `<ellipse cx="${x}" cy="${y}" rx="12" ry="13" fill="#fff"/><g class="pupil"><circle cx="${x}" cy="${y + 1}" r="8" fill="${dk}"/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff"/><circle cx="${x + 3}" cy="${y + 4}" r="1.500" fill="#fff"/></g>`;
      return `<ellipse cx="${x}" cy="${y}" rx="10" ry="11" fill="#fff"/><g class="pupil"><circle cx="${x}" cy="${y + 2}" r="6" fill="${dk}"/><circle cx="${x - 2}" cy="${y}" r="2" fill="#fff"/></g><path d="M${x - 12} ${y - 14}H${x + 12}V${y - 2}Q${x} ${y - (mood === 'sad' ? 0 : 6)} ${x - 12} ${y - 2}Z" fill="${f.b}"/>`;
    };
    let mouth;
    if (mood === 'sad') mouth = `<path d="M${cx - 9} ${y + 27}Q${cx} ${y + 19} ${cx + 9} ${y + 27}" stroke="${dk}" stroke-width="3.200" fill="none" stroke-linecap="round"/>`;
    else if (p === 'ceria') mouth = `<path d="M${cx - 13} ${y + 17}Q${cx} ${y + 38} ${cx + 13} ${y + 17}Z" fill="#7a1d3a"/><path d="M${cx - 6} ${y + 27}Q${cx} ${y + 23} ${cx + 6} ${y + 27}Q${cx} ${y + 34} ${cx - 6} ${y + 27}Z" fill="#ff7a9a"/>`;
    else if (p === 'fiery') mouth = `<path d="M${cx - 11} ${y + 22}Q${cx + 2} ${y + 29} ${cx + 13} ${y + 17}" stroke="${dk}" stroke-width="3.200" fill="none" stroke-linecap="round"/><path d="M${cx + 3} ${y + 25}l4-1 -1 6z" fill="#fff"/>`;
    else mouth = `<path d="M${cx - 8} ${y + 23}Q${cx} ${y + 28} ${cx + 8} ${y + 23}" stroke="${dk}" stroke-width="3.200" fill="none" stroke-linecap="round"/>`;
    const cheeks = (p === 'ceria' && !eq.face) ? `<g fill="#ff6b9a" opacity=".45"><ellipse cx="${cx - 40}" cy="${y + 14}" rx="8" ry="5"/><ellipse cx="${cx + 40}" cy="${y + 14}" rx="8" ry="5"/></g>` : '';
    const face = `<g class="eyes">${eye(cx - 22)}${eye(cx + 22)}</g>${cheeks}${mouth}${mood === 'sad' ? `<path d="M${cx + 52} ${y - 18}q6 9 0 14q-6-5 0-14z" fill="#7dd3fc" class="drip"/>` : ''}`;
    return `<svg class="pet-svg ${st} ${lit ? 'lit' : 'unlit'}" viewBox="0 0 200 220" role="img" aria-label="Streak pet ${esc(st)}">
      <ellipse class="shadow" cx="100" cy="210" rx="${st === 'junior' ? 56 : 46}" ry="7" fill="rgba(0,0,0,.28)"/>
      <g class="pet-body">${it('back')}${tail}${fl}${body}${face}${it('neck')}${it('face')}${it('head')}${it('deco')}</g></svg>`;
  }
  const esc = s => UI.esc(s);
  const currentOpts = (over) => Object.assign({ stage: shownStage(), personality: S.pet.personality, fur: S.pet.fur, equipped: S.pet.equipped, lit: Store.isLitToday() }, over || {});

  /* ---- widget melayang ---- */
  const LINES_LIT = ['Apiku menyala! Terima kasih sudah menabung 🔥', 'Hari ini kamu hebat!', 'Sedikit demi sedikit, lama-lama jadi bukit 💪', 'Besok nabung lagi ya!'];
  const LINES_OFF = ['Apiku mulai redup... ayo nabung 🥺', 'Catat pemasukan hari ini biar apiku nyala!', 'Streak-mu menunggu, ayo nabung sekarang!', 'Psst... pemasukan hari ini belum dicatat'];
  let wTimer = null;
  function mountWidget() {
    let el = document.getElementById('petWidget');
    if (!S.started) { el && el.remove(); clearInterval(wTimer); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'petWidget'; el.innerHTML = '<div class="pet-say" hidden></div><button class="pet-btn" aria-label="Streak Pet — ketuk dua kali untuk membuka"></button>';
      document.body.appendChild(el);
      el.querySelector('.pet-btn').addEventListener('click', () => { if (hop.armed) { hop.armed = false; openPet('level'); } else hop(); });
      wTimer = setInterval(idle, 9000);
    }
    el.querySelector('.pet-btn').innerHTML = render(currentOpts());
  }
  function say(msg, ms) { const b = document.querySelector('#petWidget .pet-say'); if (!b) return; b.textContent = msg; b.hidden = false; clearTimeout(say.t); say.t = setTimeout(() => b.hidden = true, ms || 3800); }
  function hop() {
    const b = document.querySelector('#petWidget .pet-btn'); if (!b) return;
    b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop');
    const L = Store.isLitToday() ? LINES_LIT : LINES_OFF; say(L[Math.floor(Math.random() * L.length)] + '  (tap lagi: buka pet)', 3000);
    clearTimeout(hop.t); hop.armed = true; hop.t = setTimeout(() => hop.armed = false, 3000);
  }
  function idle() {
    const b = document.querySelector('#petWidget .pet-btn'); if (!b || document.querySelector('.overlay')) return;
    const r = Math.random(); if (r < .35) { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); } else if (r < .6) { const L = Store.isLitToday() ? LINES_LIT : LINES_OFF; say(L[Math.floor(Math.random() * L.length)]); }
  }
  function ignite(msgs) {
    mountWidget(); const b = document.querySelector('#petWidget .pet-btn');
    UI.burst(b, '🔥'); b && (b.classList.remove('hop'), void b.offsetWidth, b.classList.add('hop'));
    say('Apinya menyala! 🔥 Streak terjaga hari ini');
    if (msgs && msgs.length) setTimeout(() => UI.toast(msgs.join(' · ')), 600);
  }

  /* ---- modal pet ---- */
  let tab = 'level', vaultSlot = 'all', modalApi = null, prevStage = null;
  function openPet(t) {
    if (!S.started) return UI.toast('Mulai menabung dulu di halaman Home 🙂');
    tab = t || tab; if (modalApi) return refreshModal();
    modalApi = UI.modal(shell(), { cls: 'pet-modal', onClose: () => { modalApi = null; mountWidget(); } });
    bindModal();
  }
  function shell() {
    return `<button class="x" data-close aria-label="Tutup">✕</button><h2 class="mt">STREAK PET</h2>
    <div class="pm"><div class="pm-view"><div class="pm-stage" id="pmView"></div><div class="pm-name" id="pmName"></div></div>
    <div class="pm-body"><div class="tabs">${[['level', 'Level'], ['look', 'Penampilan'], ['vault', 'Vault']].map(([k, n]) => `<button data-tab="${k}">${n}</button>`).join('')}</div><div id="pmTab"></div></div></div>`;
  }
  function bindModal() {
    const el = modalApi.el;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-tab],[data-pact]'); if (!b) return;
      if (b.dataset.tab) { tab = b.dataset.tab; return refreshModal(); }
      const a = b.dataset.pact, v = b.dataset.v;
      if (a === 'stage') { S.pet.stage = v; }
      else if (a === 'pers') { S.pet.personality = v; }
      else if (a === 'fur') { if (!owned('fur:' + v)) return UI.toast('Warna terkunci. Naik level untuk spin dan dapatkan!'); S.pet.fur = v; }
      else if (a === 'equip') { const slot = ITEMS[v].slot; if (S.pet.equipped[slot] === v) delete S.pet.equipped[slot]; else S.pet.equipped[slot] = v; }
      else if (a === 'slot') { vaultSlot = v; return refreshModal(); }
      else if (a === 'spin') return openSpin();
      else if (a === 'locked') return UI.toast(v);
      save(); refreshModal(); mountWidget();
    });
    refreshModal();
  }
  function refreshModal() {
    if (!modalApi) return; const el = modalApi.el, lv = level();
    el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const st = shownStage(); el.querySelector('#pmView').innerHTML = render(currentOpts());
    el.querySelector('#pmName').innerHTML = `<b>Bara</b> · ${STAGES.find(s => s.id === st).n} · Lv.${lv}<small>${Store.isLitToday() ? '🔥 Api menyala hari ini' : 'Api padam — catat pemasukan hari ini'}</small>`;
    const box = el.querySelector('#pmTab');
    if (tab === 'level') box.innerHTML = tabLevel(); else if (tab === 'look') box.innerHTML = tabLook(); else box.innerHTML = tabVault();
    if (tab === 'level') { const tr = box.querySelector('.track'), cur = box.querySelector('.node.now'); if (tr && cur) tr.scrollLeft = cur.offsetLeft - tr.clientWidth / 2 + cur.offsetWidth / 2; }
  }
  function tabLevel() {
    const lv = level(), e = expIn(), st = stageFor(lv);
    const chain = STAGES.map((s, i) => `<div class="stg ${st === s.id ? 'now' : ''} ${lv < s.lv ? 'lock' : ''}"><div>${render({ stage: s.id, personality: S.pet.personality, fur: S.pet.fur, equipped: {}, lit: true })}</div><b>${s.n}</b><small>Lv.${s.lv}${st === s.id ? ' · sekarang' : ''}</small></div>${i < 2 ? '<span class="arr">»</span>' : ''}`).join('');
    const from = Math.max(2, lv - 2), nodes = [];
    for (let l = from; l < from + 14; l++) {
      const done = l <= lv, isSpin = l >= SPIN_FROM, itm = BASIC_BY_LEVEL[l] ? ITEMS[BASIC_BY_LEVEL[l]] : null;
      nodes.push(`<div class="node ${done ? 'done' : ''} ${l === lv ? 'now' : ''}"><div class="rw">${isSpin ? '🎰' : itm ? itm.ico : '🎁'}</div><small>${isSpin ? 'Spin ×1' : itm ? esc(itm.n) : '—'}</small><b>${done ? '✔ Didapat' : 'Lv.' + l}</b></div>`);
    }
    const sp = S.pet.spins;
    return `<div class="stages">${chain}</div>
    <div class="lvl"><span>Level saat ini: <b>Lv. ${lv}</b></span><span class="exp">${e}/${EXP_PER_LEVEL}</span></div>
    <div class="bar"><i style="width:${(e / EXP_PER_LEVEL) * 100}%"></i></div>
    <p class="hint">Catat <b>pemasukan</b> hari ini untuk mendapatkan 1 EXP (sekali sehari). ${lv < SPIN_FROM ? `Lv.2–9 mendapat pakaian basic. Dari <b>Lv.${SPIN_FROM}</b>, tiap naik level kamu dapat 1 kesempatan Spin.` : 'Tiap naik level kamu dapat 1 kesempatan Spin.'}</p>
    <div class="track">${nodes.join('')}</div>
    <button class="btn primary spin-go" data-pact="spin">🎰 Spin Kejutan <span class="chip">${sp} kali</span></button>`;
  }
  function tabLook() {
    const lv = level(), cur = shownStage();
    const stg = STAGES.map(s => { const lock = lv < s.lv; return `<button class="opt ${cur === s.id ? 'on' : ''}" data-pact="${lock ? 'locked' : 'stage'}" data-v="${lock ? 'Terbuka di Lv.' + s.lv : s.id}">${render({ stage: s.id, personality: S.pet.personality, fur: S.pet.fur, equipped: {}, lit: true })}<small>${s.n}${lock ? ' 🔒' : ''}</small></button>`; }).join('');
    const prs = [['tenang', 'Tenang'], ['fiery', 'Fiery'], ['ceria', 'Ceria']].map(([k, n]) => `<button class="pill ${S.pet.personality === k ? 'on' : ''}" data-pact="pers" data-v="${k}">${n}</button>`).join('');
    const keys = Object.keys(FUR), n = keys.length, R = 62, rin = 34;
    const seg = keys.map((k, i) => {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2, g = .03, A = a0 + g, B = a1 - g, big = 0;
      const P = (r, a) => `${(80 + r * Math.cos(a)).toFixed(2)} ${(80 + r * Math.sin(a)).toFixed(2)}`;
      const own = owned('fur:' + k);
      return `<path d="M${P(rin, A)}L${P(R, A)}A${R} ${R} 0 ${big} 1 ${P(R, B)}L${P(rin, B)}A${rin} ${rin} 0 ${big} 0 ${P(rin, A)}Z" fill="${FUR[k].b}" opacity="${own ? 1 : .28}" stroke="${S.pet.fur === k ? '#fff' : 'transparent'}" stroke-width="3" class="seg" data-pact="fur" data-v="${k}"><title>${FUR[k].n}${own ? '' : ' (terkunci)'}</title></path>`;
    }).join('');
    return `<h4>Pilih Stage</h4><div class="opts">${stg}</div><p class="hint">Tampilan yang dipilih tidak memengaruhi progres level.</p>
    <h4>Kepribadian</h4><div class="pills">${prs}</div>
    <h4>Warna Bulu</h4><div class="wheelrow"><svg viewBox="0 0 160 160" class="wheel">${seg}<circle cx="80" cy="80" r="28" fill="${FUR[S.pet.fur].b}" stroke="rgba(255,255,255,.4)" stroke-width="2"/></svg><div><b>${FUR[S.pet.fur].n}</b><p class="hint">Warna redup masih terkunci. Dapatkan lewat Spin Kejutan (Lv.${SPIN_FROM}+).</p></div></div>`;
  }
  function tabVault() {
    const chips = [['all', 'Semua'], ...Object.entries(SLOTS)].map(([k, n]) => `<button class="pill ${vaultSlot === k ? 'on' : ''}" data-pact="slot" data-v="${k}">${n}</button>`).join('');
    const list = ITEM_IDS.filter(k => vaultSlot === 'all' || ITEMS[k].slot === vaultSlot);
    const cards = list.map(k => {
      const it = ITEMS[k], has = owned(k), on = S.pet.equipped[it.slot] === k;
      const how = it.lv ? `Dapat di Lv.${it.lv}` : 'Dapat dari Spin';
      return `<button class="item r-${it.r} ${on ? 'on' : ''} ${has ? '' : 'lock'}" data-pact="${has ? 'equip' : 'locked'}" data-v="${has ? k : how}"><span class="ic">${has ? it.ico : '🔒'}</span><b>${esc(it.n)}</b><small>${has ? (on ? 'Dipakai' : SLOTS[it.slot]) : how}</small></button>`;
    }).join('');
    return `<div class="pills">${chips}</div><div class="items">${cards}</div><p class="hint">Ketuk item untuk memakai / melepas. Satu item per slot.</p>`;
  }

  /* ---- Spin Kejutan ---- */
  function openSpin() {
    const lv = level(); const m = UI.modal('', { cls: 'spin-modal' }); drawSpin(m, null);
    function drawSpin(mm, result) {
      const pool = poolIds(), free = pool.filter(id => !owned(id)), sp = S.pet.spins;
      const cells = pool.map(id => { const p = poolInfo(id), has = owned(id); return `<div class="cell r-${p.r} ${has ? 'has' : ''} ${result && result.id === id ? 'win' : ''}"><span class="ic">${p.fur ? `<i class="dot" style="background:${p.color}"></i>` : p.ico}</span><small>${esc(p.n)}</small>${has ? '<em>Dimiliki</em>' : ''}</div>`; }).join('');
      const machine = `<div class="machine ${result ? '' : ''}"><div class="dome">${[1, 2, 3, 4, 5, 6, 7].map(i => `<i class="ball b${i}"></i>`).join('')}</div><div class="base"><button class="knob" data-spin ${sp > 0 && free.length ? '' : 'disabled'}>Spin<br><small>${sp} kali</small></button></div></div>`;
      const res = result ? `<div class="reveal r-${result.r}"><div class="big">${result.fur ? `<i class="dot" style="background:${result.color}"></i>` : result.ico}</div><b>Kamu mendapatkan ${esc(result.n)}!</b><small>${RAR[result.r]}</small><div class="row end"><button class="btn ghost" data-close>Tutup</button><button class="btn primary" data-use>Pakai sekarang</button></div></div>` : '';
      mm.el.innerHTML = `<button class="x" data-close aria-label="Tutup">✕</button><h2 class="mt">SPIN KEJUTAN</h2><div class="spin-wrap"><div class="grid4">${cells}</div>${machine}</div>${res}<p class="hint">${free.length ? 'Naik level (Lv.' + SPIN_FROM + '+) untuk mendapatkan kesempatan spin.' : 'Semua item sudah kamu miliki! 🎉'}</p>`;
      const knob = mm.el.querySelector('[data-spin]');
      if (knob) knob.onclick = () => {
        if (S.pet.spins < 1 || !free.length) return; knob.disabled = true; mm.el.querySelector('.machine').classList.add('shake');
        setTimeout(() => {
          const wts = free.map(id => poolInfo(id).r === 'epic' ? 1 : poolInfo(id).r === 'rare' ? 3 : 5); let t = Math.random() * wts.reduce((a, b) => a + b, 0), pick = free[0];
          for (let i = 0; i < free.length; i++) { t -= wts[i]; if (t <= 0) { pick = free[i]; break; } }
          S.pet.spins--; give(pick); save(); const info = poolInfo(pick); UI.burst(mm.el.querySelector('.machine'), '✨'); drawSpin(mm, info);
          const u = mm.el.querySelector('[data-use]'); u && (u.onclick = () => { if (info.fur) S.pet.fur = pick.slice(4); else S.pet.equipped[ITEMS[pick].slot] = pick; save(); mm.close(); mountWidget(); refreshModal(); });
          refreshModal();
        }, 1500);
      };
    }
    m.overlay.addEventListener('click', () => { /* tutup: sinkron tampilan */ });
    return m;
  }

  w.Pet = { render, mountWidget, openPet, onIncomeToday, ignite, grantRewards, level, expIn, shownStage, ITEMS, FUR, STAGES, EXP_PER_LEVEL, currentOpts, say };
})(window);
