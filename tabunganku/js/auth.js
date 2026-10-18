/* Tabunganku — Login / Daftar (©marnzproyek)
   Sistem login disalin dari index.html (Marnz Store): Email + Password, Google, GitHub,
   validasi form daftar, pesan error Firebase, dan animasi transisi Masuk <-> Daftar.
   Setelah login, data akun diambil dari Firestore lalu aplikasi tabungan dijalankan. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const APP_SCRIPTS = ['js/charts.js', 'js/pet.js', 'js/app.js'];

  /* =================================================================
     TOAST NOTIFIKASI (sama dengan index.html)
  ================================================================= */
  function showToast(pesan, tipe) {
    tipe = tipe || 'sukses';
    let box = $('authToasts');
    if (!box) { box = document.createElement('div'); box.id = 'authToasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'a-toast ' + (tipe === 'sukses' ? 'ok' : 'bad');
    const ic = document.createElement('i'); ic.className = 'fas ' + (tipe === 'sukses' ? 'fa-check-circle' : 'fa-exclamation-circle');
    t.appendChild(ic); t.appendChild(document.createTextNode(' ' + pesan));
    box.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); t.classList.add('out'); setTimeout(() => t.remove(), 500); }, 4500);
  }

  /* =================================================================
     PESAN ERROR FIREBASE YANG JELAS (sama dengan index.html)
  ================================================================= */
  function pesanDariError(error) {
    const kode = error && error.code ? error.code : '';
    const daftar = {
      'auth/popup-closed-by-user': 'Login dibatalkan.',
      'auth/cancelled-popup-request': 'Login dibatalkan.',
      'auth/email-already-in-use': 'Email sudah terdaftar!',
      'auth/invalid-email': 'Format email tidak valid!',
      'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)!',
      'auth/invalid-credential': 'Email atau sandi salah!',
      'auth/wrong-password': 'Email atau sandi salah!',
      'auth/user-not-found': 'Akun tidak ditemukan, silakan daftar dulu!',
      'auth/user-disabled': 'Akun ini dinonaktifkan.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
      'auth/network-request-failed': 'Koneksi internet bermasalah!',
      'auth/popup-blocked': 'Popup diblokir browser. Izinkan popup untuk situs ini.',
      'auth/operation-not-allowed': 'Metode login ini belum diaktifkan di Firebase Console (Authentication > Sign-in method).',
      'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan metode login lain. Pakai metode yang sama seperti saat mendaftar.',
      'auth/unauthorized-domain': 'Domain "' + (location.hostname || 'file') + '" belum diizinkan. Tambahkan di Firebase Console > Authentication > Settings > Authorized domains.',
      'auth/operation-not-supported-in-this-environment': 'Login sosial tidak jalan lewat file:// . Buka lewat http://localhost atau hosting (Netlify/Live Server).',
      'permission-denied': 'Akses database ditolak. Cek aturan Firestore di Firebase Console (lihat README).',
      'unavailable': 'Koneksi ke database Google bermasalah. Periksa internetmu lalu coba lagi.'
    };
    if (daftar[kode]) return daftar[kode];
    if (location.protocol === 'file:') return daftar['auth/operation-not-supported-in-this-environment'];
    return 'Terjadi kesalahan sistem!' + (kode ? ' (' + kode + ')' : '');
  }

  /* =================================================================
     LOADING TOMBOL (mencegah klik berkali-kali)
  ================================================================= */
  async function jalankanFungsi(tombol, proses) {
    if (!tombol) return;
    const teksAsli = tombol.innerHTML;
    tombol.disabled = true;
    tombol.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    try { await proses(); }
    catch (error) { console.error('Firebase Error:', error); showToast(pesanDariError(error), 'gagal'); }
    finally { tombol.disabled = false; tombol.innerHTML = teksAsli; }
  }

  /* =================================================================
     VALIDASI FORM DAFTAR (sama dengan index.html)
  ================================================================= */
  (function () {
    const els = { email: $('regEmail'), name: $('regName'), phone: $('regPhone'), pass: $('regPass') };
    if (!els.email || !els.name || !els.phone || !els.pass) return;
    const order = ['email', 'name', 'phone', 'pass'];
    const touched = {};
    const PHONE_MIN = 9, PHONE_MAX = 15;

    const passRules = [
      { k: 'len', t: '8+ karakter', test: v => v.length >= 8 },
      { k: 'upper', t: '1 huruf besar', test: v => /[A-Z]/.test(v) },
      { k: 'num', t: '1 angka', test: v => /\d/.test(v) },
      { k: 'sym', t: '1 simbol', test: v => /[^A-Za-z0-9\s]/.test(v) }
    ];
    const validators = {
      email(v) {
        v = v.trim();
        if (!v) return 'Email wajib diisi';
        if (!v.includes('@')) return 'Email harus memakai tanda @, contoh: nama@email.com';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Email belum lengkap, contoh: nama@email.com';
        return '';
      },
      name(v) { return v.trim() ? '' : 'Nama lengkap wajib diisi'; },
      phone(v) {
        const d = v.replace(/\D/g, '');
        if (!d) return 'Nomor WhatsApp wajib diisi';
        if (d.length < PHONE_MIN) return 'Nomor WhatsApp kurang ' + (PHONE_MIN - d.length) + ' angka (minimal ' + PHONE_MIN + ')';
        if (d.length > PHONE_MAX) return 'Nomor WhatsApp kelebihan ' + (d.length - PHONE_MAX) + ' angka (maksimal ' + PHONE_MAX + ')';
        return '';
      },
      pass(v) {
        if (!v) return 'Password wajib diisi';
        const kurang = passRules.filter(r => !r.test(v)).map(r => r.t);
        return kurang.length ? 'Belum terpenuhi: ' + kurang.join(', ') : '';
      }
    };
    const box = key => document.querySelector('[data-reg-field="' + key + '"]');

    function renderRules() {
      const v = els.pass.value;
      passRules.forEach(r => {
        const row = document.querySelector('#regPassRules [data-rule="' + r.k + '"]');
        if (row) row.classList.toggle('ok', r.test(v));
      });
    }
    function render(key) {
      const input = els[key], wrap = box(key);
      if (!input || !wrap) return '';
      const err = validators[key](input.value);
      const msg = wrap.querySelector('.reg-msg'), ok = wrap.querySelector('.reg-ok');
      const show = !!touched[key];
      input.classList.toggle('reg-invalid', show && !!err);
      input.classList.toggle('reg-valid', show && !err);
      if (ok) ok.classList.toggle('on', show && !err);
      if (msg) { msg.querySelector('span').textContent = (show && err) ? err : ''; msg.classList.toggle('show', show && !!err); }
      input.setAttribute('aria-invalid', (show && !!err) ? 'true' : 'false');
      return err;
    }
    // Format nomor HP: hanya angka, dikelompokkan 4-4-4 (0812 3456 7890)
    function formatPhone() {
      const el = els.phone, aktif = document.activeElement === el;
      const pos = el.selectionStart || 0;
      const digitSebelum = el.value.slice(0, pos).replace(/\D/g, '').length;
      const d = el.value.replace(/\D/g, '').slice(0, PHONE_MAX + 5);
      const f = d.replace(/(.{4})(?=.)/g, '$1 ');
      if (f === el.value) return;
      el.value = f;
      if (aktif) {
        let c = 0, i = 0;
        for (; i < f.length && c < digitSebelum; i++) { if (/\d/.test(f[i])) c++; }
        try { el.setSelectionRange(i, i); } catch (e) { }
      }
    }
    order.forEach(key => {
      const input = els[key];
      input.addEventListener('input', () => { if (key === 'phone') formatPhone(); if (key === 'pass') renderRules(); if (touched[key]) render(key); });
      input.addEventListener('change', () => { if (key === 'phone') formatPhone(); if (key === 'pass') renderRules(); if (input.value) touched[key] = true; render(key); });
      input.addEventListener('blur', () => { if (input.value) { touched[key] = true; render(key); } });
    });
    // Tombol mata: lihat / sembunyikan password
    const eye = $('regPassEye');
    if (eye) eye.addEventListener('click', () => {
      const tampil = els.pass.type === 'password';
      els.pass.type = tampil ? 'text' : 'password';
      eye.setAttribute('aria-pressed', tampil ? 'true' : 'false');
      eye.setAttribute('aria-label', tampil ? 'Sembunyikan password' : 'Tampilkan password');
      eye.innerHTML = '<i class="fas ' + (tampil ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
      els.pass.focus();
    });
    // Dipanggil tombol Daftar: cek semua kolom, fokus ke kolom pertama yang salah
    window.regValidateAll = function () {
      let pertama = null;
      order.forEach(key => { touched[key] = true; if (render(key) && !pertama) pertama = key; });
      renderRules();
      if (pertama) {
        els[pertama].focus();
        try { els[pertama].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { }
        return false;
      }
      return true;
    };
    renderRules();
  })();

  /* =================================================================
     PINDAH TAB MASUK <-> DAFTAR + animasi (sama dengan index.html)
  ================================================================= */
  const AUTH_TEXT = {
    login: { title: 'Welcome <span class="y">Back</span>', sub: 'Enter your credentials to access your secure account' },
    register: { title: 'Create <span class="y">Account</span>', sub: 'Join us today to access your secure workspace' }
  };
  let authCurrentTab = 'login', authBusy = false;

  function applyAuthTab(tab) {
    const formLogin = $('formLogin'), formRegister = $('formRegister'), title = $('authTitle'), sub = $('authSubtitle');
    if (formLogin) formLogin.classList.add('hidden-el');
    if (formRegister) formRegister.classList.add('hidden-el');
    if (tab === 'login' && formLogin) formLogin.classList.remove('hidden-el');
    else if (tab === 'register' && formRegister) formRegister.classList.remove('hidden-el');
    if (AUTH_TEXT[tab]) {
      if (title) title.innerHTML = AUTH_TEXT[tab].title;
      if (sub) sub.textContent = AUTH_TEXT[tab].sub;
      authCurrentTab = tab;
    }
  }
  function switchAuthTab(tab) {
    if (!AUTH_TEXT[tab] || authBusy) return;
    const card = $('authCard'), loader = $('authLoader');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!card || !loader || card.offsetWidth === 0 || tab === authCurrentTab || reduceMotion) { applyAuthTab(tab); return; }

    authBusy = true;
    const fades = Array.from(document.querySelectorAll('.auth-fade'));
    const oldHeight = card.offsetHeight;
    // 1) isi kartu memudar, pemuat (kotak kaca + cahaya emas) muncul
    fades.forEach(el => el.classList.add('auth-fade-out'));
    loader.classList.add('on');
    setTimeout(() => {
      // 2) ganti form + judul, sambil tinggi kartu berubah dengan halus
      card.style.transition = 'none';
      card.style.height = oldHeight + 'px';
      applyAuthTab(tab);
      fades.forEach(el => el.classList.remove('auth-fade-out'));
      card.style.height = 'auto';
      const newHeight = card.offsetHeight;
      card.style.height = oldHeight + 'px';
      void card.offsetHeight;
      card.style.transition = 'height 0.5s cubic-bezier(.4,0,.2,1)';
      card.style.height = newHeight + 'px';
      loader.classList.remove('on');
      // 3) bersihkan
      setTimeout(() => { card.style.height = ''; card.style.transition = ''; authBusy = false; }, 560);
    }, 650);
  }
  $('authGoRegister').addEventListener('click', () => switchAuthTab('register'));
  $('authGoLogin').addEventListener('click', () => switchAuthTab('login'));

  /* =================================================================
     MASUK KE APLIKASI: ambil data dari Firestore, lalu jalankan app
  ================================================================= */
  let pendingExtra = null, entering = false, entered = false;

  function showCard() {
    const boot = $('authBoot'); if (boot) boot.classList.add('hidden-el');
    $('authCard').classList.remove('hidden-el');
  }
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = res; s.onerror = () => rej(new Error('Gagal memuat ' + src));
      document.body.appendChild(s);
    });
  }
  async function enter(user) {
    if (entering || entered) return;
    entering = true;
    try {
      await Store.attach(user, pendingExtra || {});
      for (const src of APP_SCRIPTS) await loadScript(src);
      entered = true;
      const scr = $('authScreen');
      scr.style.transition = 'opacity .4s ease'; scr.style.opacity = '0'; scr.style.pointerEvents = 'none';
      setTimeout(() => scr.classList.add('hidden-el'), 420);
    } catch (error) {
      console.error('Gagal masuk ke aplikasi:', error);
      entering = false;
      showToast(pesanDariError(error), 'gagal');
      showCard();
    }
  }

  /* =================================================================
     FIREBASE AUTH
  ================================================================= */
  let fbAuth = null;
  try { Store.initFirebase(); fbAuth = Store.auth; }
  catch (e) {
    console.error('Firebase SDK gagal dimuat. Cek koneksi internet.', e);
    showCard();
    showToast('Firebase gagal dimuat. Cek koneksi internet lalu muat ulang halaman.', 'gagal');
    return;
  }

  const loginSosial = async (provider, namaProvider) => {
    try {
      const result = await fbAuth.signInWithPopup(provider);
      showToast(namaProvider + ' Terhubung! Menyiapkan Sistem...', 'sukses');
      enter(result.user);
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        showToast('Popup diblokir, mengalihkan halaman login...', 'gagal');
        await fbAuth.signInWithRedirect(provider);
        return;
      }
      throw error;
    }
  };

  // Hasil login redirect (cadangan jika popup diblokir browser)
  fbAuth.getRedirectResult().then(result => {
    if (result && result.user) { showToast('Login berhasil! Menyiapkan Sistem...', 'sukses'); enter(result.user); }
  }).catch(error => { console.error('Redirect login error:', error); showToast(pesanDariError(error), 'gagal'); });

  const btnGoogle = $('btnGoogle');
  btnGoogle.addEventListener('click', e => { e.preventDefault(); jalankanFungsi(btnGoogle, () => loginSosial(new firebase.auth.GoogleAuthProvider(), 'Google')); });
  const btnGithub = $('btnGithub');
  btnGithub.addEventListener('click', e => { e.preventDefault(); jalankanFungsi(btnGithub, () => loginSosial(new firebase.auth.GithubAuthProvider(), 'GitHub')); });

  const btnDaftar = $('btnDaftar');
  btnDaftar.addEventListener('click', e => {
    e.preventDefault();
    const email = ($('regEmail').value || '').trim();
    const name = ($('regName').value || '').trim();
    const phone = ($('regPhone').value || '').replace(/\D/g, '');
    const pass = $('regPass').value || '';
    // Validasi per kolom: pesan tampil tepat di bawah kolom yang salah
    if (window.regValidateAll && !window.regValidateAll()) return;
    jalankanFungsi(btnDaftar, async () => {
      pendingExtra = { name, phone };        // dipakai saat data akun baru dibuat di database
      let result;
      try { result = await fbAuth.createUserWithEmailAndPassword(email, pass); }
      catch (err) { pendingExtra = null; throw err; }
      try { await result.user.updateProfile({ displayName: name }); } catch (err) { /* nama sudah tersimpan di database */ }
      showToast('Daftar Berhasil! Menyiapkan Sistem...', 'sukses');
      enter(result.user);
    });
  });

  const btnMasuk = $('btnMasuk');
  btnMasuk.addEventListener('click', e => {
    e.preventDefault();
    const email = ($('inputEmail').value || '').trim();
    const pass = $('inputPassword').value || '';
    if (!email || !pass) return showToast('Isi email dan sandi!', 'gagal');
    jalankanFungsi(btnMasuk, async () => {
      const result = await fbAuth.signInWithEmailAndPassword(email, pass);
      showToast('Berhasil Masuk!', 'sukses');
      enter(result.user);
    });
  });

  // Pantau status login: sudah login -> masuk aplikasi, belum -> tampilkan kotak login
  fbAuth.onAuthStateChanged(user => {
    if (user) enter(user);
    else if (!entered) showCard();
  });

  // Tombol Keluar (dipanggil dari app.js)
  window.TabunganAuth = {
    async logout() {
      try { await Store.signOut(); } catch (e) { /* abaikan */ }
      location.reload();
    }
  };
})();
