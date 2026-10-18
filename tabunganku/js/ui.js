/* Tabunganku — helper UI: toast, modal, konfirmasi, efek api */
(function (w) {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg; box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 3200);
  }

  const stack = [];
  function modal(html, opt) {
    opt = opt || {};
    const o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = `<div class="modal ${opt.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(o);
    requestAnimationFrame(() => o.classList.add('show'));
    const api = {
      el: o.firstElementChild, overlay: o,
      close() { const i = stack.indexOf(api); if (i > -1) stack.splice(i, 1); o.classList.remove('show'); setTimeout(() => o.remove(), 180); opt.onClose && opt.onClose(); }
    };
    o.addEventListener('mousedown', e => { if (e.target === o) api.close(); });
    o.addEventListener('click', e => { if (e.target.closest('[data-close]')) api.close(); });
    stack.push(api); return api;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close(); });

  function confirmBox(title, text, okLabel, danger) {
    return new Promise(res => {
      let done = false;
      const m = modal(`<div class="confirm"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="row end"><button class="btn ghost" data-close>Batal</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel || 'Ya')}</button></div></div>`, { cls: 'sm', onClose: () => { if (!done) res(false); } });
      m.el.querySelector('[data-ok]').onclick = () => { done = true; res(true); m.close(); };
    });
  }

  /* percikan api / bintang di sekitar elemen */
  function burst(el, emoji) {
    if (!el) return;
    const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span'); p.className = 'spark'; p.textContent = emoji || (i % 3 ? '🔥' : '✨');
      const a = (Math.PI * 2 * i) / 14, d = 50 + Math.random() * 60;
      p.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;font-size:${12 + Math.random() * 12}px`;
      document.body.appendChild(p); setTimeout(() => p.remove(), 1100);
    }
  }

  /* animasi keluar: orang berjalan lalu keluar lewat pintu */
  function logoutAnim(done) {
    const o = document.createElement('div'); o.className = 'lo-anim';
    o.innerHTML = `<div class="lo-scene">
      <div class="lo-wall"></div>
      <div class="lo-door"><div class="lo-light"></div><div class="lo-panel"><i></i></div></div>
      <div class="lo-person"><svg viewBox="0 0 60 110" aria-hidden="true">
        <g class="lo-arm lo-a1"><rect x="26" y="40" width="8" height="30" rx="4" fill="#3b82f6"/></g>
        <g class="lo-leg lo-l1"><rect x="25" y="68" width="10" height="38" rx="5" fill="#1e3a8a"/><rect x="25" y="100" width="17" height="8" rx="4" fill="#0b1220"/></g>
        <rect x="19" y="36" width="22" height="40" rx="10" fill="#60a5fa"/>
        <circle cx="30" cy="22" r="14" fill="#fcd9b6"/><path d="M16 20a14 14 0 0 1 28 0c-5-6-19-7-28 0z" fill="#1f2937"/>
        <g class="lo-leg lo-l2"><rect x="25" y="68" width="10" height="38" rx="5" fill="#2748b8"/><rect x="25" y="100" width="17" height="8" rx="4" fill="#0b1220"/></g>
        <g class="lo-arm lo-a2"><rect x="26" y="40" width="8" height="30" rx="4" fill="#60a5fa"/></g>
      </svg></div>
      <div class="lo-floor"></div>
    </div><p class="lo-txt">Sampai jumpa lagi! 👋</p>`;
    document.body.appendChild(o);
    requestAnimationFrame(() => o.classList.add('go'));
    setTimeout(() => { o.classList.add('out'); }, 2900);
    setTimeout(() => { done && done(); }, 3300);
  }
  function ico(name) {
    const P = {
      wallet: '<path d="M3 7a3 3 0 0 1 3-3h11a2 2 0 0 1 2 2v1h-3a3 3 0 0 0 0 6h3v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="currentColor"/><path d="M15 10h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5a2 2 0 0 1 0-4z" fill="currentColor" opacity=".55"/><circle cx="16" cy="12" r="1.2" fill="#0a1426"/>',
      logout: '<path d="M10 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8v-2h8V5h-8z" fill="currentColor"/><path d="M11 8l-1.4 1.4 1.600 1.600H3v2h8.200l-1.600 1.600L11 16l4-4z" fill="currentColor"/>',
      gear: '<path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7.5 7.5 0 0 0-1.7-1l-.4-2.5a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1a.5.5 0 0 0-.6.2L2.6 8.8a.5.5 0 0 0 .1.6l2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3a.5.5 0 0 0 .6.2l2.4-1a7.5 7.5 0 0 0 1.7 1l.4 2.5a.5.5 0 0 0 .5.4h3.8a.5.5 0 0 0 .5-.4l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1a.5.5 0 0 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>',
      flame: '<path d="M12 2c1 3.5 5 5.5 5 10.2A5 5 0 0 1 12 17a5 5 0 0 1-5-4.8c0-2 1-3.2 2-4.4.3 1.2.9 2 1.8 2.4C10.2 7 10.5 4.2 12 2z" fill="#ff8a1f"/><path d="M12 11c.6 1.6 2.4 2.4 2.4 4.4A2.4 2.4 0 0 1 12 17.8a2.4 2.4 0 0 1-2.4-2.4c0-1.1.6-1.7 1.1-2.4.2.5.5.8.9 1 .1-1.4.2-2.6.4-3z" fill="#ffd23f"/>',
      eye: '<path d="M12 5C6.5 5 2.7 9 1.5 12c1.2 3 5 7 10.5 7s9.3-4 10.5-7C21.3 9 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6.4a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z" fill="currentColor"/>',
      eyeoff: '<path d="M3 4.3 4.3 3l16.7 16.7-1.3 1.3-3-3A11.6 11.6 0 0 1 12 19C6.5 19 2.7 15 1.5 12a14 14 0 0 1 4-5.2zM12 5c5.500 0 9.300 4 10.500 7a14 14 0 0 1-2.700 4l-2.200-2.200A4 4 0 0 0 10.200 8.400L8.500 6.700A11 11 0 0 1 12 5z" fill="currentColor"/>',
      trash: '<path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="currentColor"/>',
      plus: '<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="currentColor"/>',
      cam: '<path d="M9 4 7.600 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.600L15 4zm3 5a4.500 4.500 0 1 1 0 9 4.500 4.500 0 0 1 0-9z" fill="currentColor"/>',
      cal: '<path d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3zM4 9v11h16V9z" fill="currentColor"/>',
      chev: '<path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2.400" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      wa: '<path fill="currentColor" d="M12 2a10 10 0 0 0-8.600 15L2 22l5.200-1.400A10 10 0 1 0 12 2zm5.200 14c-.2.600-1.300 1.200-1.800 1.200-.5.100-1 .2-3.300-.7-2.800-1.200-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800s.7-2 1-2.300c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .5l-.3.500-.4.400c-.1.200-.3.300-.1.600.2.300.8 1.300 1.700 2.100 1.200 1 2.100 1.300 2.400 1.500.3.100.4.100.6-.1l.8-1c.2-.3.400-.2.600-.1l1.900.9c.3.100.5.200.5.300.1.200.1.800-.1 1.400z"/>',
      tt: '<path fill="currentColor" d="M16.500 2h-3.200v13.200a2.800 2.800 0 1 1-2-2.700V9.200a6 6 0 1 0 5.200 5.900V8.600a7.300 7.300 0 0 0 4.300 1.400V6.800A4.300 4.300 0 0 1 16.500 2z"/>',
      mail: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.500 2L12 12.500 19.500 7z" fill="currentColor"/>',
      paw: '<circle cx="6" cy="10" r="2.200" fill="currentColor"/><circle cx="10" cy="6" r="2.200" fill="currentColor"/><circle cx="14" cy="6" r="2.200" fill="currentColor"/><circle cx="18" cy="10" r="2.200" fill="currentColor"/><path d="M12 11c3 0 6 3.200 6 5.500 0 2-1.800 2.500-3 2.500-1 0-2-.5-3-.5s-2 .5-3 .5c-1.200 0-3-.5-3-2.500C6 14.200 9 11 12 11z" fill="currentColor"/>'
    };
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
  }
  w.UI = { esc, toast, modal, confirmBox, burst, ico, logoutAnim };
})(window);
