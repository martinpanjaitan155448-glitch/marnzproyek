/* Tabunganku — grafik SVG ringan tanpa library (©marnzproyek) */
(function (w) {
  'use strict';
  const IN = '#3b82f6', OUT = '#ef4444';   // pemasukan biru, pengeluaran merah
  const esc = s => UI.esc(s);
  const short = v => { if (v >= 1e6) { const x = v / 1e6; return (x % 1 ? x.toFixed(1) : x) + 'M'; } if (v >= 1e3) { const x = v / 1e3; return (x % 1 ? x.toFixed(1) : x) + 'K'; } return String(v); };
  function scale(maxVal) {
    if (maxVal <= 0) return { max: 1000, step: 250 };
    const raw = maxVal / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    const step = m * p; return { step, max: Math.ceil(maxVal / step) * step };
  }
  let seq = 0;

  /* ---------- Grafik garis/area pemasukan & pengeluaran ---------- */
  function lines(el, o) {
    const W = 640, H = 270, L = 46, R = 14, T = 14, B = 28, id = 'lg' + (++seq);
    const n = o.labels.length, all = o.series.flatMap(s => s.data.filter(v => v != null));
    const sc = scale(Math.max(0, ...all)), iw = W - L - R, ih = H - T - B;
    const X = i => L + (n === 1 ? iw / 2 : (iw * i) / (n - 1)), Y = v => T + ih - (v / sc.max) * ih;
    let g = '';
    for (let v = 0; v <= sc.max + 1e-9; v += sc.step) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="ax">${short(v)}</text>`;
    const every = n > 20 ? 5 : n > 10 ? 2 : 1;
    o.labels.forEach((lb, i) => { if (i % every === 0 || i === n - 1) g += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" class="ax">${esc(lb)}</text>`; });
    function path(data) {
      const pts = []; data.forEach((v, i) => { if (v != null) pts.push([X(i), Y(v)]); });
      if (!pts.length) return { d: '', area: '' };
      if (pts.length === 1) { const [x, y] = pts[0]; return { d: `M${x - .1} ${y}L${x + .1} ${y}`, area: '', last: pts[0] }; }
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = .18;
        const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
        const c1y = Math.min(hi, Math.max(lo, p1[1] + (p2[1] - p0[1]) * t)), c2y = Math.min(hi, Math.max(lo, p2[1] - (p3[1] - p1[1]) * t));
        d += `C${p1[0] + (p2[0] - p0[0]) * t} ${c1y} ${p2[0] - (p3[0] - p1[0]) * t} ${c2y} ${p2[0]} ${p2[1]}`;
      }
      const last = pts[pts.length - 1];
      return { d, area: d + `L${last[0]} ${Y(0)}L${pts[0][0]} ${Y(0)}Z`, last };
    }
    let defs = '', body = '';
    o.series.forEach((s, k) => {
      const p = path(s.data);
      defs += `<linearGradient id="${id}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".38"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
      body += `<path d="${p.area}" fill="url(#${id}${k})"/><path d="${p.d}" fill="none" stroke="${s.color}" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (p.last) body += `<circle cx="${p.last[0]}" cy="${p.last[1]}" r="3.500" fill="${s.color}"/>`;
    });
    el.innerHTML = `<div class="cw"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'Grafik')}"><defs>${defs}</defs>${g}${body}<line class="guide" x1="0" x2="0" y1="${T}" y2="${T + ih}" style="display:none"/><rect class="hit" x="${L}" y="${T}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="tip" hidden></div></div>`;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), guide = el.querySelector('.guide'), hit = el.querySelector('.hit');
    const move = e => {
      const r = svg.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - L) / iw) * (n - 1))));
      guide.style.display = ''; guide.setAttribute('x1', X(i)); guide.setAttribute('x2', X(i));
      tip.hidden = false; tip.innerHTML = `<b>${esc(o.tipLabel ? o.tipLabel(i) : o.labels[i])}</b>` + o.series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}: ${esc(o.fmt(s.data[i] || 0))}</span>`).join('');
      const leftPct = (X(i) / W) * 100; tip.style.left = Math.min(Math.max(leftPct, 18), 82) + '%';
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; guide.style.display = 'none'; });
  }

  /* ---------- Donat kategori ---------- */
  function donut(el, o) {
    const r = 70, c = 2 * Math.PI * r, total = o.items.reduce((a, b) => a + b.value, 0);
    let off = 0, arcs = '';
    if (total > 0) o.items.forEach(it => {
      if (!it.value) return; const len = (it.value / total) * c, gap = o.items.filter(x => x.value).length > 1 ? 2.500 : 0;
      arcs += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${it.color}" stroke-width="28" stroke-dasharray="${Math.max(len - gap, .1)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"><title>${esc(it.name)}: ${esc(o.fmt(it.value))}</title></circle>`;
      off += len;
    });
    el.innerHTML = `<svg viewBox="0 0 200 200" class="donut" role="img" aria-label="Kategori pengeluaran"><circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--track)" stroke-width="28" ${total ? 'opacity=".25"' : ''}/>${arcs}<text x="100" y="${total ? 96 : 100}" text-anchor="middle" class="dn-v">${total ? esc(o.fmt(total)) : 'Belum ada'}</text><text x="100" y="116" text-anchor="middle" class="dn-l">${total ? 'Total' : 'pengeluaran'}</text></svg>`;
  }

  /* ---------- Bar perbandingan bulanan ---------- */
  function bars(el, o) {
    const W = 380, H = 240, L = 44, R = 8, T = 12, B = 30, n = o.groups.length;
    const sc = scale(Math.max(0, ...o.groups.flatMap(g => [g.a, g.b]))), iw = W - L - R, ih = H - T - B, gw = iw / n, bw = Math.min(22, gw / 3.200);
    const Y = v => T + ih - (v / sc.max) * ih; let s = '';
    for (let v = 0; v <= sc.max + 1e-9; v += sc.step) s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" class="ax">${short(v)}</text>`;
    o.groups.forEach((g, i) => {
      const cx = L + gw * i + gw / 2;
      s += `<rect x="${cx - bw - 1.500}" y="${Y(g.a)}" width="${bw}" height="${Math.max(ih - (Y(g.a) - T), 0)}" rx="3" fill="${IN}"><title>${esc(g.label)} pemasukan: ${esc(o.fmt(g.a))}</title></rect>`;
      s += `<rect x="${cx + 1.500}" y="${Y(g.b)}" width="${bw}" height="${Math.max(ih - (Y(g.b) - T), 0)}" rx="3" fill="${OUT}"><title>${esc(g.label)} pengeluaran: ${esc(o.fmt(g.b))}</title></rect>`;
      s += `<text x="${cx}" y="${H - 10}" text-anchor="middle" class="ax${g.cur ? ' cur' : ''}">${esc(g.label)}</text>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Perbandingan bulanan">${s}</svg>`;
  }

  /* ---------- Gauge setengah lingkaran ---------- */
  function gauge(el, o) {
    const id = 'gg' + (++seq), r = 100, len = Math.PI * r, pct = Math.max(0, Math.min(1, o.value / (o.max || 1)));
    const d = `M${120 - r} 125 A${r} ${r} 0 0 1 ${120 + r} 125`;
    el.innerHTML = `<svg viewBox="0 0 240 150" class="gauge" role="img" aria-label="${esc(o.aria || 'Gauge')}"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="var(--a1)"/><stop offset="1" stop-color="var(--a2)"/></linearGradient></defs><path d="${d}" fill="none" stroke="var(--track)" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${id})" stroke-width="16" stroke-linecap="round" stroke-dasharray="${pct * len} ${len}" style="transition:stroke-dasharray .8s"/><text x="120" y="100" text-anchor="middle" class="g-v">${Math.round(pct * 100)}%</text><text x="120" y="120" text-anchor="middle" class="dn-l">${esc(o.sub || '')}</text></svg>`;
  }
  w.Charts = { lines, donut, bars, gauge, IN, OUT };
})(window);
