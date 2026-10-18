/* Tabunganku v1.5 — ©marnzproyek */
(function () {
  'use strict';
  const { S, save, rp, num, today, ym, addMonths, daysIn, MONTHS, MONTHS_L, uid, sum } = Store;
  const { esc, toast, modal, confirmBox, ico } = UI;
  const VERSION = '1.5', ADMIN = 'marnzproyek@gmail.com';
  const CATS = [
    { id: 'makan', n: 'Makan & Minum', c: '#3b82f6', e: '🍜' },
    { id: 'sekolah', n: 'Peralatan Sekolah', c: '#34d399', e: '📚' },
    { id: 'pulsa', n: 'Pulsa & Internet', c: '#fbbf24', e: '📱' },
    { id: 'hiburan', n: 'Hiburan', c: '#8b5cf6', e: '🎮' },
    { id: 'lainnya', n: 'Lainnya', c: '#ec4899', e: '✨' }
  ];
  const catOf = id => CATS.find(c => c.id === id) || CATS[4];
  const THEMES = [['red', 'Merah', '#ff4d6d'], ['orange', 'Jingga', '#ff7a1a'], ['yellow', 'Kuning', '#f5b800'], ['green', 'Hijau', '#16a34a'], ['blue', 'Biru', '#2f7cff'], ['indigo', 'Nila', '#4f46e5'], ['violet', 'Ungu', '#9333ea']];
  const NAV = [['home', 'Home'], ['chart', 'Savings Chart'], ['about', 'About This App'], ['account', 'Account'], ['contact', 'Contact']];
  const PAGES = {
    home: ['wallet', 'Target Tabungan', 'Tentukan targetmu, lalu mulai menabung'],
    chart: ['wallet', 'Grafik Tabungan', 'Pantau pemasukan dan pengeluaranmu dengan mudah'],
    about: ['wallet', 'Tentang Aplikasi Ini', 'Kenali Tabunganku lebih dekat'],
    account: ['wallet', 'Akun', 'Profil dan ringkasan tabunganmu'],
    contact: ['wallet', 'Kontak', 'Hubungi pembuatnya']
  };
  const ui = { page: 'home', month: ym(today()), hide: false, type: 'in', draft: { title: '', amount: '', cat: 'makan', date: '' } };
  const $ = (s, r) => (r || document).querySelector(s);

  /* ============ util ============ */
  const parseAmt = v => parseInt(String(v).replace(/\D/g, ''), 10) || 0;
  const fmtInput = v => { const n = String(v).replace(/\D/g, '').slice(0, 12); return n ? n.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; };
  function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; }
  function avatarSrc() { return S.profile.photo || 'foto/profil/default.svg'; }
  function pct(cur, prev) { if (!prev) return null; return ((cur - prev) / prev) * 100; }
  function deltaHtml(cur, prev, goodUp, suffix) {
    const p = pct(cur, prev);
    if (p === null) return `<span class="delta flat">${cur ? 'Baru bulan ini' : '—'}</span>`;
    const up = p >= 0, good = goodUp ? up : !up, c = Math.abs(p) < .05 ? 'flat' : good ? 'up' : 'dn';
    return `<span class="delta ${c}">${up ? '↑' : '↓'} ${Math.abs(p).toFixed(0)}%${suffix ? ' ' + suffix : ''}</span>`;
  }
  function resizeImage(file, max, cb) {
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .82)); }; im.onerror = () => toast('File bukan gambar yang valid', 'err'); im.src = fr.result; };
    fr.readAsDataURL(file);
  }

  /* ============ render utama ============ */
  function render() {
    const [ic, t, sub] = PAGES[ui.page];
    $('#app').innerHTML = `<header class="hdr"><div class="logo">${ico(ic)}</div><div class="tt"><h1>${t}</h1><p>${sub}</p></div>
      <div class="right"><button class="icon-btn" data-act="settings" aria-label="Pengaturan" title="Pengaturan">${ico('gear')}</button>
      <button class="avatar" data-act="go" data-p="account" aria-label="Profil" title="${esc(S.profile.name)}"><img src="${esc(avatarSrc())}" alt="Foto profil" data-fb="foto/profil/default.svg"></button></div></header>
      <main class="page" id="page">${({ home: pHome, chart: pChart, about: pAbout, account: pAccount, contact: pContact })[ui.page]()}</main>`;
    if (ui.page === 'chart' && S.started) drawCharts();
    renderNav(); Pet.mountWidget();
  }
  function renderNav() {
    const n = $('#nav .nav-in');
    n.innerHTML = '<i class="nav-ind"></i>' + NAV.map(([k, l]) => `<button data-act="go" data-p="${k}" class="${ui.page === k ? 'on' : ''}">${l}</button>`).join('');
    placeInd();
  }
  function placeInd() { const b = $('#nav button.on'), i = $('#nav .nav-ind'); if (b && i) { i.style.left = b.offsetLeft + 'px'; i.style.width = b.offsetWidth + 'px'; } }
  function go(p) { ui.page = p; render(); window.scrollTo({ top: 0 }); }

  /* ============ HOME ============ */
  function pHome() {
    const full = S.goals.length >= Store.MAX_GOALS;
    if (!S.goals.length) return `<section class="card hero"><div class="big"><span class="wlogo">${ico('wallet')}</span></div><h2>Mulai perjalanan menabungmu</h2><p class="muted" style="max-width:480px;margin:0 auto 18px">Buat minimal 1 nama tabungan beserta targetnya (contoh: “Menabung untuk membeli HP — Rp 5.000.000”). Setelah menekan <b>Mulai Menabung</b>, grafik, streak, dan Streak Pet akan aktif.</p><button class="btn primary" data-act="goal-add">${ico('plus')} Tambah Target</button></section>`;
    return `<div class="row sb" style="margin-bottom:14px"><span class="count">🎯 ${S.goals.length}/${Store.MAX_GOALS} target</span>${S.started ? '<span class="count">🔥 Menabung aktif</span>' : ''}</div>
    <div class="goals">${S.goals.map(g => `<article class="goal ${g.id === S.activeGoal ? 'active' : ''}" data-act="goal-active" data-id="${g.id}" tabindex="0">
      ${g.id === S.activeGoal ? '<span class="badge">Target aktif</span>' : ''}
      <button class="del" data-act="goal-del" data-id="${g.id}" aria-label="Hapus target ${esc(g.name)}">${ico('trash')}</button>
      <div class="pic">${g.photo ? `<img src="${esc(g.photo)}" alt="">` : '🎯'}</div>
      <div class="inf"><h3>${esc(g.name)}</h3><div class="amt">${rp(g.target)}</div></div></article>`).join('')}
      <button class="addgoal ${full ? 'full' : ''}" data-act="goal-add"><div><div class="plus">${ico('plus')}</div><b>Tambah target</b><p style="font-size:12.5px;margin-top:4px">${full ? 'Maksimal 5 target. Hapus salah satu untuk membuat yang baru.' : 'Nama tabungan + target + foto'}</p></div></button></div>
    <p class="hint muted" style="margin-top:14px;font-size:12.5px">Ketuk kartu untuk menjadikannya target aktif (dipakai di grafik tabungan).</p>`;
  }
  function openGoalForm() {
    if (S.goals.length >= Store.MAX_GOALS) return toast('Maksimal 5 target. Hapus salah satu dulu untuk membuat yang baru.', 'err');
    let photo = null;
    const m = modal(`<button class="x" data-close aria-label="Tutup">✕</button><h2>Tambah Target Tabungan</h2>
      <form id="gf" novalidate><label class="photo-pick" id="gp"><span>${ico('cam')}<br><b>Tambah foto</b><br><small>Foto barang yang ingin kamu tabung (opsional)</small></span><input type="file" accept="image/*"></label>
      <div class="fld"><label for="gn">Nama tabungan</label><input id="gn" class="inp" maxlength="60" placeholder="contoh: Menabung untuk membeli HP" autocomplete="off"></div>
      <div class="fld"><label for="gt">Target (Rp)</label><input id="gt" class="inp" inputmode="numeric" placeholder="contoh: 5.000.000" autocomplete="off"></div>
      <button class="btn primary full" type="submit">${S.started ? '＋ Simpan Target' : '🔥 Mulai Menabung'}</button>
      ${S.started ? '' : '<p class="hint muted" style="text-align:center;margin-top:10px">Menekan “Mulai Menabung” akan mengaktifkan grafik, streak, dan Streak Pet.</p>'}</form>`);
    const f = $('#gf', m.el), fi = $('input[type=file]', m.el);
    fi.onchange = () => { const file = fi.files[0]; if (!file) return; resizeImage(file, 720, d => { photo = d; $('#gp', m.el).innerHTML = `<img src="${d}" alt="Pratinjau"><input type="file" accept="image/*" hidden>`; }); };
    $('#gt', m.el).oninput = e => e.target.value = fmtInput(e.target.value);
    f.onsubmit = e => {
      e.preventDefault(); const name = $('#gn', m.el).value.trim(), target = parseAmt($('#gt', m.el).value);
      if (!name) return toast('Isi nama tabungan dulu', 'err');
      if (target < 1) return toast('Isi target tabungan (lebih dari 0)', 'err');
      if (S.goals.length >= Store.MAX_GOALS) return toast('Maksimal 5 target', 'err');
      const g = { id: uid(), name, target, photo, created: today() }; S.goals.push(g);
      const first = !S.started; if (first) { S.started = true; S.activeGoal = g.id; }
      if (!save()) { S.goals.pop(); if (first) { S.started = false; S.activeGoal = null; } return; }
      m.close(); render();
      if (first) { Pet.grantRewards(); save(); Pet.mountWidget(); setTimeout(() => { UI.burst($('#petWidget .pet-btn'), '🔥'); Pet.say('Halo! Aku Bara 🔥 Catat pemasukan tiap hari ya!'); }, 400); toast('Selamat! Kamu mulai menabung 🎉'); }
      else toast('Target ditambahkan');
    };
  }
  async function delGoal(id) {
    const g = S.goals.find(x => x.id === id); if (!g) return;
    if (S.goals.length <= 1) return toast('Minimal harus ada 1 target tabungan.', 'err');
    if (!await confirmBox('Hapus target?', `“${g.name}” akan dihapus. Catatan pemasukan & pengeluaran tetap aman.`, 'Hapus', true)) return;
    S.goals = S.goals.filter(x => x.id !== id); if (S.activeGoal === id) S.activeGoal = S.goals[0].id; save(); render(); toast('Target dihapus');
  }

  /* ============ SAVINGS CHART ============ */
  function lockHtml() { return `<section class="card lock"><div class="big">🔒</div><h2>Fitur belum aktif</h2><p class="muted" style="margin:8px 0 18px">Buat minimal 1 target tabungan di halaman Home, lalu tekan <b>Mulai Menabung</b> untuk membuka grafik, streak, dan Streak Pet.</p><button class="btn primary" data-act="go" data-p="home">Ke Home</button></section>`; }
  function pChart() {
    if (!S.started) return lockHtml();
    const M = ui.month, P = addMonths(M, -1), tx = S.tx.filter(t => ym(t.date) === M), ptx = S.tx.filter(t => ym(t.date) === P);
    const inc = sum(tx, 'in'), out = sum(tx, 'out'), pinc = sum(ptx, 'in'), pout = sum(ptx, 'out');
    const saldo = sum(S.tx, 'in') - sum(S.tx, 'out'), endPrev = S.tx.filter(t => ym(t.date) < M).reduce((a, t) => a + (t.type === 'in' ? t.amount : -t.amount), 0);
    const [y, mo] = M.split('-').map(Number), nd = daysIn(M), streak = Store.streak();
    const d = ui.draft; if (!d.date) d.date = today();
    const lit = Store.litSet(), first = (new Date(y, mo - 1, 1).getDay() + 6) % 7, t0 = today();
    let cal = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => `<div class="dw">${x}</div>`).join('') + '<div></div>'.repeat(first);
    for (let i = 1; i <= nd; i++) { const ds = `${M}-${String(i).padStart(2, '0')}`; cal += `<div class="d ${lit.has(ds) ? 'lit' : ''} ${ds === t0 ? 'today' : ''} ${ds > t0 ? 'fut' : ''}" title="${lit.has(ds) ? 'Ada pemasukan' : ''}">${i}</div>`; }
    const g = S.goals.find(x => x.id === S.activeGoal) || S.goals[0];
    const catTot = CATS.map(c => ({ ...c, v: tx.filter(t => t.type === 'out' && t.cat === c.id).reduce((a, t) => a + t.amount, 0) }));
    const recent = [...S.tx].sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts).slice(0, 6);
    return `<div class="toolbar"><div class="mchip"><button data-act="mprev" aria-label="Bulan sebelumnya">‹</button><span>${ico('cal')} 1 - ${nd} ${MONTHS[mo - 1]} ${y}</span><button data-act="mnext" aria-label="Bulan berikutnya" ${M >= ym(t0) ? 'disabled style="opacity:.3"' : ''}>›</button></div></div>
    <div class="grid g2"><div class="stack">
      <section class="card"><h3>✍️ Catat Transaksi</h3>
        <div class="seg2"><button class="in ${ui.type === 'in' ? 'on' : ''}" data-act="ttype" data-v="in">Pemasukan</button><button class="out ${ui.type === 'out' ? 'on' : ''}" data-act="ttype" data-v="out">Pengeluaran</button></div>
        <form id="txf" novalidate>
          <div class="fld"><label for="tt">${ui.type === 'in' ? 'Pemasukan' : 'Pengeluaran'}:</label><input id="tt" class="inp" maxlength="60" autocomplete="off" placeholder="${ui.type === 'in' ? 'contoh: uang dari sekolah' : 'contoh: beli pulpen'}" value="${esc(d.title)}"></div>
          <div class="fld"><label for="ta">Sejumlah:</label><input id="ta" class="inp" inputmode="numeric" autocomplete="off" placeholder="contoh: ${ui.type === 'in' ? '15.000' : '5.000'}" value="${esc(d.amount)}"></div>
          ${ui.type === 'out' ? `<div class="fld"><label for="tc">Kategori</label><select id="tc" class="inp">${CATS.map(c => `<option value="${c.id}" ${d.cat === c.id ? 'selected' : ''}>${c.e} ${c.n}</option>`).join('')}</select></div>` : ''}
          <div class="fld"><label for="td">Tanggal</label><input id="td" type="date" class="inp" max="${t0}" value="${d.date}"></div>
          <button class="btn primary full" type="submit" style="${ui.type === 'out' ? 'background:linear-gradient(135deg,#dc2626,#f87171)' : ''}">${ui.type === 'in' ? '＋ Catat Pemasukan' : '－ Catat Pengeluaran'}</button>
          <p class="hint muted" style="margin-top:8px;font-size:12px">${ui.type === 'in' ? '🔥 Pemasukan hari ini akan menyalakan streak & memberi 1 EXP untuk pet.' : 'Pengeluaran tidak menyalakan streak.'}</p></form></section>
      <section class="card"><div class="bal"><div class="wi">${ico('wallet')}</div><div><small>Total Saldo</small><div class="v"><span id="balv">${ui.hide ? 'Rp ••••••' : rp(saldo)}</span><button class="eye" data-act="hide" aria-label="Sembunyikan saldo">${ico(ui.hide ? 'eyeoff' : 'eye')}</button></div></div></div>
        ${deltaHtml(saldo, endPrev, true, 'dibanding bulan lalu')}
        <div class="split"><div><small>Pemasukan</small><b style="color:var(--in)">${ui.hide ? 'Rp ••••' : rp(inc)}</b>${deltaHtml(inc, pinc, true)}</div><div><small>Pengeluaran</small><b style="color:var(--out)">${ui.hide ? 'Rp ••••' : rp(out)}</b>${deltaHtml(out, pout, false)}</div></div></section>
    </div><div class="stack">
      <section class="card"><h3>📈 Grafik Pemasukan & Pengeluaran <span class="lg"><span><i style="background:${Charts.IN}"></i>Pemasukan</span><span><i style="background:${Charts.OUT}"></i>Pengeluaran</span></span></h3><div id="chLine"></div></section>
      <section class="card"><h3>${ico('flame')} Streak Menabung <span class="sbadge">${ico('flame')} ${streak} hari</span></h3>
        <p class="muted" style="font-size:12.5px;margin:-6px 0 6px">${Store.isLitToday() ? '🔥 Api hari ini sudah menyala. Mantap!' : 'Api hari ini padam — catat <b>pemasukan</b> untuk menyalakannya.'}</p><div class="cal-wrap"><div class="cal">${cal}</div></div></section>
    </div></div>
    <div class="grid g3" style="margin-top:14px">
      <section class="card"><h3>Kategori Pengeluaran</h3><div class="cat"><div id="chDonut"></div><ul>${catTot.map(c => { const tot = catTot.reduce((a, b) => a + b.v, 0); return `<li><i style="background:${c.c};margin-top:4px"></i><div>${c.n}<em>${rp(c.v)}</em></div><b>${tot ? Math.round(c.v / tot * 100) : 0}%</b></li>`; }).join('')}</ul></div></section>
      <section class="card"><h3>📊 Perbandingan Bulanan</h3><div id="chBars"></div><div class="lg" style="justify-content:center;margin-top:6px"><span><i style="background:${Charts.IN}"></i>Pemasukan</span><span><i style="background:${Charts.OUT}"></i>Pengeluaran</span></div></section>
      <section class="card"><h3>🕒 Transaksi Terbaru <button class="link" data-act="tx-all">Lihat Semua</button></h3>${recent.length ? `<ul class="txs">${recent.map(txRow).join('')}</ul>` : '<div class="empty">Belum ada transaksi.<br>Catat yang pertama di sebelah kiri 👈</div>'}</section>
    </div>
    <section class="card" style="margin-top:14px"><h3>Jumlah Tabungan saat ini</h3>${g ? `<div class="grid g2b" style="align-items:center"><div id="chGauge"></div><div class="gtxt"><p>Target aktif: <b>${esc(g.name)}</b></p><p style="margin:6px 0">Tabungan terkumpul<br><b style="font-size:22px">${rp(Math.max(saldo, 0))}</b></p><p>Sisa target<br><b style="font-size:22px">${rp(Math.max(g.target - Math.max(saldo, 0), 0))}</b></p>${saldo >= g.target ? '<p style="color:var(--ok);margin-top:8px">🎉 Target tercapai!</p>' : ''}</div></div>` : '<div class="empty">Belum ada target.</div>'}</section>`;
  }
  function txRow(t) {
    const c = t.type === 'out' ? catOf(t.cat) : null, dt = t.date.split('-');
    return `<li><div class="ti">${c ? c.e : '💰'}</div><div><b>${esc(t.title)}</b><small>${+dt[2]} ${MONTHS[dt[1] - 1]} ${dt[0]}${c ? ' · ' + c.n : ''}</small></div><div class="am ${t.type}">${t.type === 'in' ? '+' : '-'} ${rp(t.amount)}</div></li>`;
  }
  function drawCharts() {
    const M = ui.month, nd = daysIn(M), t0 = today(), isCur = M === ym(t0), last = isCur ? +t0.slice(8) : nd, tx = S.tx.filter(t => ym(t.date) === M);
    const labels = [], ins = [], outs = [];
    for (let i = 1; i <= nd; i++) { const ds = `${M}-${String(i).padStart(2, '0')}`; labels.push(i + ' ' + MONTHS[+M.slice(5) - 1]); const f = i <= last; ins.push(f ? sum(tx.filter(t => t.date === ds), 'in') : null); outs.push(f ? sum(tx.filter(t => t.date === ds), 'out') : null); }
    Charts.lines($('#chLine'), { labels: labels.map(l => l.split(' ')[0] + ' ' + l.split(' ')[1]), series: [{ name: 'Pemasukan', color: Charts.IN, data: ins }, { name: 'Pengeluaran', color: Charts.OUT, data: outs }], fmt: rp, aria: 'Grafik pemasukan dan pengeluaran harian' });
    const items = CATS.map(c => ({ name: c.n, color: c.c, value: tx.filter(t => t.type === 'out' && t.cat === c.id).reduce((a, t) => a + t.amount, 0) }));
    Charts.donut($('#chDonut'), { items, fmt: rp });
    const groups = []; for (let k = -5; k <= 0; k++) { const m = addMonths(M, k), tt = S.tx.filter(t => ym(t.date) === m); groups.push({ label: MONTHS[+m.slice(5) - 1], a: sum(tt, 'in'), b: sum(tt, 'out'), cur: k === 0 }); }
    Charts.bars($('#chBars'), { groups, fmt: rp });
    const g = S.goals.find(x => x.id === S.activeGoal) || S.goals[0];
    if (g && $('#chGauge')) { const saldo = Math.max(sum(S.tx, 'in') - sum(S.tx, 'out'), 0); Charts.gauge($('#chGauge'), { value: saldo, max: g.target, sub: 'dari target', aria: 'Progres tabungan terhadap target' }); }
  }
  function addTx(e) {
    e.preventDefault(); const title = $('#tt').value.trim(), amount = parseAmt($('#ta').value), date = $('#td').value || today(), cat = ui.type === 'out' ? $('#tc').value : null;
    if (!title) return toast(ui.type === 'in' ? 'Isi dulu keterangan pemasukan' : 'Isi dulu keterangan pengeluaran', 'err');
    if (amount < 1) return toast('Isi jumlah uang (lebih dari 0)', 'err');
    if (date > today()) return toast('Tanggal tidak boleh di masa depan', 'err');
    const t0 = today(), wasLit = Store.isLitToday();
    S.tx.push({ id: uid(), type: ui.type, title, amount, cat, date, ts: Date.now() });
    if (!save()) { S.tx.pop(); return; }
    ui.draft = { title: '', amount: '', cat: 'makan', date: '' }; ui.month = ym(date) > ui.month || ym(date) < ui.month ? ym(date) : ui.month;
    let res = null; if (ui.type === 'in' && date === t0) res = Pet.onIncomeToday();
    render();
    if (ui.type === 'in') {
      if (date === t0 && !wasLit) { Pet.ignite(res && res.msgs); toast('Pemasukan dicatat — api streak menyala! 🔥'); }
      else toast('Pemasukan dicatat');
      if (res && res.leveled) setTimeout(() => { Pet.say('Naik level! Lv.' + res.level + (res.evolved ? ' — aku berevolusi! ✨' : ' 🎉'), 5000); UI.burst($('#petWidget .pet-btn'), '⭐'); }, 900);
    } else toast('Pengeluaran dicatat');
  }
  function allTx() {
    const list = [...S.tx].sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
    const m = modal(`<button class="x" data-close>✕</button><h2>Semua Transaksi (${list.length})</h2>${list.length ? `<ul class="txs">${list.map(t => txRow(t).replace('</li>', `<button class="x" data-del="${t.id}" aria-label="Hapus transaksi">${ico('trash')}</button></li>`).replace('grid-template-columns', '')).join('')}</ul>` : '<div class="empty">Belum ada transaksi.</div>'}`, { cls: 'wide' });
    m.el.querySelectorAll('li').forEach(li => { li.style.gridTemplateColumns = '40px 1fr auto auto'; });
    m.el.addEventListener('click', async e => { const b = e.target.closest('[data-del]'); if (!b) return; if (!await confirmBox('Hapus transaksi?', 'Transaksi ini akan dihapus dari catatan dan grafik.', 'Hapus', true)) return; S.tx = S.tx.filter(t => t.id !== b.dataset.del); save(); m.close(); render(); allTx(); });
  }

  /* ============ ABOUT ============ */
  function pAbout() {
    return `<section class="card prose"><h3 style="font-size:20px"><span class="wlogo sm">${ico('wallet')}</span> Tabunganku <span class="count">v${VERSION}</span></h3>
      <p>Tabunganku adalah aplikasi pencatat tabungan yang dibuat supaya menabung terasa seperti bermain game: sederhana, visual, dan bikin ketagihan. Kamu menetapkan target (misalnya HP baru), mencatat uang masuk dan keluar sendiri, lalu melihat perkembangannya lewat grafik yang cantik — sambil ditemani <b>Streak Pet</b> yang tumbuh seiring konsistensimu.</p>
      <h3>Kegunaan</h3><div class="feat">
        <div><span>🎯</span><b>Target tabungan</b><p>Simpan hingga 5 target lengkap dengan nama, nominal, dan foto barang impianmu supaya makin semangat.</p></div>
        <div><span>✍️</span><b>Catat mandiri</b><p>Tulis keterangan dan jumlah pemasukan maupun pengeluaran. Contoh: “uang dari sekolah — 15.000”.</p></div>
        <div><span>📈</span><b>Grafik otomatis</b><p>Grafik garis, donat kategori, dan perbandingan bulanan mengikuti catatanmu. Biru untuk pemasukan, merah untuk pengeluaran.</p></div>
        <div><span>🔥</span><b>Streak menabung</b><p>Api menyala setiap hari kamu mencatat pemasukan. Pengeluaran tidak menyalakan api, jadi kamu terdorong benar-benar menabung.</p></div>
        <div><span>🐾</span><b>Streak Pet</b><p>Teman virtual yang naik level, berevolusi (Junior → Evolusi → Ultimate), bisa didandani, dan punya Spin Kejutan.</p></div>
        <div><span>🎨</span><b>Tampilan & pengingat</b><p>Pilih 7 warna pelangi untuk tema, dan aktifkan pengingat agar streak-mu tidak padam.</p></div></div>
      <h3>Keunggulan</h3>
      <p>• <b>Gratis & ringan</b> — berjalan langsung di browser, tanpa pendaftaran.<br>• <b>Privat</b> — datamu tersimpan di perangkatmu sendiri, bukan dijual atau dibagikan.<br>• <b>Memotivasi</b> — streak, level, dan hadiah pet membuat menabung jadi kebiasaan.<br>• <b>Jelas</b> — warna konsisten: biru = pemasukan, merah = pengeluaran.<br>• <b>Bisa dipasang</b> seperti aplikasi (PWA) dan tetap bisa dibuka saat offline.</p>
      <h3>Cara kerja singkat</h3>
      <p>1) Buat minimal satu target di Home lalu tekan <b>Mulai Menabung</b>. 2) Buka <b>Savings Chart</b> dan catat pemasukan / pengeluaran. 3) Pemasukan hari ini menyalakan api streak dan memberi 1 EXP untuk pet. 4) Setiap 7 EXP pet naik 1 level; dari Level 10 setiap naik level kamu mendapat 1 kesempatan Spin untuk item baru.</p>
      <div class="maker"><div class="mk">M</div><div><small class="muted">Dibuat oleh</small><div style="font-size:18px;font-weight:800">marnzproyek</div><small class="muted">Aplikasi ini dirancang dan dikembangkan oleh marnzproyek, untuk membantu membiasakan menabung sejak dini.</small></div></div>
      <p class="muted" style="margin-top:16px;text-align:center">©marnzproyek · Versi ${VERSION}</p></section>`;
  }

  /* ============ CONTACT ============ */
  function pContact() {
    return `<p class="muted" style="margin-bottom:14px">Ada saran, kendala, atau mau kolaborasi? Hubungi lewat sosial media di bawah.</p>
    <div class="contacts"><a class="ct wa" href="https://wa.me/6283837758593" target="_blank" rel="noopener noreferrer"><div class="ci">${ico('wa')}</div><div><small>WhatsApp</small><b>083837758593</b></div></a>
    <a class="ct tt" href="https://www.tiktok.com/@marnz12345" target="_blank" rel="noopener noreferrer"><div class="ci">${ico('tt')}</div><div><small>TikTok</small><b>@marnz12345</b></div></a></div>
    <p class="muted" style="margin-top:22px;text-align:center">©marnzproyek</p>`;
  }

  /* ============ ACCOUNT ============ */
  function pAccount() {
    const saldo = sum(S.tx, 'in') - sum(S.tx, 'out');
    return `<div class="grid g2b"><section class="card"><h3>Profil</h3><div class="prof"><label class="pf" title="Ganti foto"><img src="${esc(avatarSrc())}" alt="Foto profil" data-fb="foto/profil/default.svg"><span>Ganti</span><input type="file" id="pfile" accept="image/*" hidden></label>
      <div style="flex:1;min-width:200px"><div class="fld"><label for="pn">Nama</label><input id="pn" class="inp" maxlength="30" value="${esc(S.profile.name)}"></div><button class="btn primary" data-act="save-name">Simpan nama</button></div></div>
      <p class="hint muted" style="margin-top:14px;font-size:12.5px">📁 Lokasi foto profil: <code>foto/profil</code>. Foto yang kamu pilih disimpan di database Google bersama datamu. Foto bawaan ada di <code>foto/profil/default.svg</code> — ganti file itu kalau mau foto bawaan sendiri.</p></section>
      <section class="card"><h3>Ringkasan</h3><div class="stat"><div><small>Total tabungan</small><b>${rp(saldo)}</b></div><div><small>Streak saat ini</small><b>${Store.streak()} hari</b></div><div><small>Streak terbaik</small><b>${Store.bestStreak()} hari</b></div><div><small>Level pet</small><b>${S.started ? 'Lv. ' + Pet.level() : '—'}</b></div><div><small>Target</small><b>${S.goals.length}/${Store.MAX_GOALS}</b></div><div><small>Transaksi</small><b>${S.tx.length}</b></div></div>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="open-pet">${ico('paw')} Buka Streak Pet</button><button class="btn" data-act="settings">${ico('gear')} Pengaturan</button><button class="btn" data-act="logout">Keluar</button></div></section></div>
    <section class="card" style="margin-top:14px"><h3>Data</h3><p class="muted" style="margin-bottom:12px;font-size:13.5px">Datamu tersimpan di database Google (akunmu). Unduh cadangan atau hapus semuanya.</p><div class="row"><button class="btn" data-act="export">⬇️ Unduh cadangan (JSON)</button><button class="btn danger" data-act="reset">Hapus semua data</button></div></section>`;
  }

  /* ============ KELUAR AKUN: konfirmasi (Batal / Lanjut) + animasi keluar pintu ============ */
  function logoutFlow() {
    let go = false;
    const m = modal(`<div class="confirm logout-confirm"><div class="lc-ico">${ico('logout')}</div><h3>Keluar akun?</h3><p>Anda yakin ingin keluar dari akun Anda saat ini?</p><div class="row end"><button class="btn ghost" data-close>Batal</button><button class="btn danger" data-lanjut>Lanjut</button></div></div>`, { cls: 'sm' });
    m.el.querySelector('[data-lanjut]').onclick = () => {
      if (go) return; go = true; m.close();
      UI.logoutAnim(async () => { try { await TabunganAuth.logout(); } catch (e) { location.reload(); } });
    };
  }

  /* ============ PENGATURAN ============ */
  function settings() {
    const st = S.settings, supported = 'Notification' in window;
    const m = modal(`<button class="x" data-close>✕</button><h2>Pengaturan</h2><div class="sheet">
      <div class="sec"><h4>Tampilan Aplikasi</h4><div class="card" style="padding:14px"><p class="muted" style="font-size:12.5px;margin-bottom:10px">Pilih warna fitur (bawaan: Biru)</p><div class="themes">${THEMES.map(([k, n, c]) => `<div><button class="theme ${st.theme === k ? 'on' : ''}" data-theme="${k}" style="background:${c}" aria-label="Warna ${n}"></button><small>${n}</small></div>`).join('')}</div></div></div>
      <div class="sec"><h4>Notifikasi</h4><div class="lst"><button class="lrow" data-set="notif"><span>Pengingat Streak Pet</span><span class="sw ${st.notif ? 'on' : ''}"></span></button>
      <div class="lrow"><span>Jam pengingat</span><input type="time" id="ntime" class="inp" style="width:auto" value="${st.notifTime}"></div>
      <button class="lrow" data-set="ntest"><span>Kirim notifikasi tes</span><span class="v">›</span></button></div>
      <p class="hint muted" style="font-size:12px;margin:8px 4px">${supported ? 'Pesan: “Streak pet menunggu mu, ayo nabung sekarang untuk menghidupkan streak pet mu”. Pengingat muncul saat aplikasi terbuka / terpasang. Untuk notifikasi saat aplikasi benar-benar tertutup dibutuhkan server push (mis. Firebase Cloud Messaging).' : 'Browser ini tidak mendukung notifikasi.'}</p></div>
      <div class="sec"><h4>Akun</h4><div class="lst"><button class="lrow logout-row" data-set="logout"><span>${ico('logout')} Keluar dari akun</span><span class="v">›</span></button></div></div>
      <div class="sec"><h4>About</h4><div class="lst"><div class="lrow"><span>Version</span><span class="v">${VERSION}</span></div><div class="lrow"><span>Email Admin:</span><a class="v" style="color:var(--a2)" href="mailto:${ADMIN}">${ADMIN}</a></div>
      <div class="row" style="justify-content:center;margin-top:4px"><button class="btn" data-legal="privacy-policy">Privacy Policy</button><button class="btn" data-legal="terms-of-service">Terms of Service</button></div></div></div></div>`);
    m.el.addEventListener('click', async e => {
      const th = e.target.closest('button.theme'); if (th) { S.settings.theme = th.dataset.theme; save(); applyTheme(); m.el.querySelectorAll('.theme').forEach(b => b.classList.toggle('on', b === th)); setTimeout(placeInd, 50); return; }
      const lg = e.target.closest('[data-legal]'); if (lg) return legal(lg.dataset.legal);
      const s = e.target.closest('[data-set]'); if (!s) return;
      if (s.dataset.set === 'logout') return logoutFlow();
      if (s.dataset.set === 'notif') {
        if (!S.settings.notif) {
          if (!supported) return toast('Browser tidak mendukung notifikasi', 'err');
          const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
          if (p !== 'granted') return toast('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.', 'err');
          S.settings.notif = true;
        } else S.settings.notif = false;
        save(); s.querySelector('.sw').classList.toggle('on', S.settings.notif);
      } else if (s.dataset.set === 'ntest') {
        if (!supported) return toast('Browser tidak mendukung notifikasi', 'err');
        const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        if (p === 'granted') { pushNotif(); toast('Notifikasi tes dikirim'); } else toast('Izin notifikasi ditolak', 'err');
      }
    });
    $('#ntime', m.el).onchange = e => { S.settings.notifTime = e.target.value || '19:00'; save(); };
  }
  function legal(name) {
    const lbl = name === 'privacy-policy' ? 'Privacy Policy' : 'Terms of Service', src = `legal/${name}.html`;
    modal(`<button class="x" data-close>✕</button><h2>${lbl}</h2><iframe class="legal-frame" src="${src}" title="${lbl}"></iframe><p style="text-align:center;margin-top:10px"><a class="link" style="margin:0" href="${src}" target="_blank" rel="noopener">Buka di tab baru ↗</a></p>`, { cls: 'wide' });
  }
  async function pushNotif() {
    const title = 'Tabunganku', body = 'Streak pet menunggu mu, ayo nabung sekarang untuk menghidupkan streak pet mu';
    try { const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null; if (reg) return reg.showNotification(title, { body, icon: 'icons/icon.svg', badge: 'icons/icon.svg', tag: 'streak-pet' }); } catch (e) { /* lanjut */ }
    try { new Notification(title, { body, icon: 'icons/icon.svg' }); } catch (e) { /* abaikan */ }
  }
  function checkReminder() {
    const st = S.settings; if (!S.started || !st.notif || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date(), hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (hm >= st.notifTime && st.lastNotif !== today() && !Store.isLitToday()) { st.lastNotif = today(); save(); pushNotif(); }
  }

  /* ============ jam real-time ============ */
  const dtf = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let lastDay = today();
  function tick() {
    const n = new Date(); $('#clockD').textContent = dtf.format(n);
    $('#clockT').textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2, '0')).join(':');
    if (today() !== lastDay) { lastDay = today(); if (ui.month === ym(addMonths(today(), -1)) || true) { render(); } }
  }

  /* ============ event ============ */
  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
    if (act === 'go') go(a.dataset.p);
    else if (act === 'goal-add') openGoalForm();
    else if (act === 'goal-del') { e.stopPropagation(); delGoal(a.dataset.id); }
    else if (act === 'goal-active') { if (S.started) { S.activeGoal = a.dataset.id; save(); render(); toast('Target aktif diganti'); } }
    else if (act === 'settings') settings();
    else if (act === 'open-pet') Pet.openPet('level');
    else if (act === 'ttype') { ui.type = a.dataset.v; const t = $('#tt'); if (t) { ui.draft.title = t.value; ui.draft.amount = $('#ta').value; ui.draft.date = $('#td').value; } render(); }
    else if (act === 'mprev') { ui.month = addMonths(ui.month, -1); render(); }
    else if (act === 'mnext') { if (ui.month < ym(today())) { ui.month = addMonths(ui.month, 1); render(); } }
    else if (act === 'hide') { ui.hide = !ui.hide; render(); }
    else if (act === 'tx-all') allTx();
    else if (act === 'save-name') { S.profile.name = ($('#pn').value.trim() || 'Pengguna').slice(0, 30); save(); toast('Nama disimpan'); render(); }
    else if (act === 'export') { const b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'tabunganku-cadangan-' + today() + '.json'; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 1000); }
    else if (act === 'logout') logoutFlow();
    else if (act === 'reset') { if (await confirmBox('Hapus semua data?', 'Semua target, transaksi, dan data pet akun ini akan dihapus permanen dari database.', 'Hapus semua', true)) { await Store.reset(); location.reload(); } }
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.goal')) { e.preventDefault(); e.target.click(); } });
  document.addEventListener('submit', e => { if (e.target.id === 'txf') addTx(e); });
  document.addEventListener('input', e => {
    if (e.target.id === 'ta') e.target.value = fmtInput(e.target.value);
    if (ui.page === 'chart' && ['tt', 'ta', 'tc', 'td'].includes(e.target.id)) { ui.draft = { title: $('#tt').value, amount: $('#ta').value, cat: $('#tc') ? $('#tc').value : ui.draft.cat, date: $('#td').value }; }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'pfile' && e.target.files[0]) resizeImage(e.target.files[0], 320, d => { S.profile.photo = d; if (save()) { render(); toast('Foto profil diganti'); } });
  });
  document.addEventListener('error', e => { const i = e.target; if (i.tagName === 'IMG' && i.dataset.fb && !i.dataset.done) { i.dataset.done = 1; i.src = i.dataset.fb; } }, true);
  window.addEventListener('resize', placeInd);

  /* ============ start ============ */
  applyTheme(); if (S.started) { Pet.grantRewards(); save(); }
  render(); tick(); setInterval(tick, 1000); setInterval(checkReminder, 30000); setTimeout(checkReminder, 3000);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
