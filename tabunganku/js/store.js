/* Tabunganku — penyimpanan data & helper (©marnzproyek)
   Data disimpan di database Google (Firebase Firestore) — project yang sama
   dengan index.html (marnz-proyek-8e247). Setiap akun punya 1 dokumen:
   koleksi `tabunganku_users` / dokumen `<uid akun>`. */
(function (w) {
  'use strict';
  const LOCAL_KEY = 'tabunganku.v1';          // data versi lama (localStorage) — hanya dipindahkan sekali ke cloud
  const COLLECTION = 'tabunganku_users';
  const FREE_OWNED = ['fur:oranye', 'fur:cokelat', 'fur:krem'];
  const MAX_GOALS = 5;

  /* Konfigurasi Firebase — sama persis dengan index.html */
  const firebaseConfig = {
    apiKey: "AIzaSyCGGJSQQECBwTxkMbpnUbqzesL9j3YfGsw",
    authDomain: "marnz-proyek-8e247.firebaseapp.com",
    projectId: "marnz-proyek-8e247",
    storageBucket: "marnz-proyek-8e247.firebasestorage.app",
    messagingSenderId: "425976801019",
    appId: "1:425976801019:web:b325399e5dde4fff8f325e"
  };

  function fresh() {
    return {
      v: 1, started: false, goals: [], activeGoal: null, tx: [],
      profile: { name: 'Pengguna', photo: null },
      settings: { theme: 'blue', notif: false, notifTime: '19:00', lastNotif: null },
      pet: { exp: 0, expDays: [], granted: [], spins: 0, owned: FREE_OWNED.slice(), equipped: {}, stage: 'auto', personality: 'tenang', fur: 'oranye' }
    };
  }
  function merge(base, o) {
    for (const k in o) {
      if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], o[k]);
      else base[k] = o[k];
    }
    return base;
  }

  /* S selalu objek yang sama (app.js menyimpannya sekali di awal),
     jadi data dari cloud dimasukkan ke dalam objek itu, bukan mengganti objeknya. */
  let S = fresh();
  function replaceS(next) { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, next); }

  /* ---------- Firebase ---------- */
  let fb = null, auth = null, db = null, ref = null, account = null;
  function initFirebase() {
    if (fb) return fb;
    if (typeof w.firebase === 'undefined') throw new Error('sdk-missing');
    if (!w.firebase.apps.length) w.firebase.initializeApp(firebaseConfig);
    auth = w.firebase.auth();
    db = w.firebase.firestore();
    // Antrean tulis offline: perubahan tetap terkirim ke Google walau halaman ditutup/dimuat ulang
    try { db.enablePersistence({ synchronizeTabs: true }).catch(() => { }); } catch (e) { /* abaikan */ }
    fb = w.firebase;
    return fb;
  }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const payload = () => ({ account, json: JSON.stringify(S), updatedAt: fb.firestore.FieldValue.serverTimestamp() });

  /* Dipanggil setelah login: ambil data akun dari Firestore (atau buat baru). */
  async function attach(user, extra) {
    initFirebase(); extra = extra || {};
    ref = db.collection(COLLECTION).doc(user.uid);
    const prov = (user.providerData && user.providerData[0]) || {};
    const acc = {
      email: (user.email || prov.email || '').toLowerCase(),
      name: extra.name || user.displayName || '',
      provider: prov.providerId || 'password'
    };
    if (extra.phone) acc.phone = extra.phone;

    const snap = await ref.get();          // gagal (offline tanpa cache) -> error, data tidak ditimpa
    if (snap.exists) {
      const d = snap.data() || {};
      let next = fresh();
      try { if (d.json) next = merge(fresh(), JSON.parse(d.json)); } catch (e) { /* data rusak -> mulai bersih */ }
      replaceS(next);
      account = Object.assign({}, d.account || {}, acc, { name: acc.name || (d.account && d.account.name) || '' });
      if (!acc.phone && d.account && d.account.phone) account.phone = d.account.phone;
      if (extra.phone || !d.account) ref.set(payload()).catch(() => { });
    } else {
      // Akun baru. Jika di perangkat ini ada data lama (localStorage), pindahkan ke akun ini sekali saja.
      let old = null;
      try { const r = localStorage.getItem(LOCAL_KEY); if (r) old = merge(fresh(), JSON.parse(r)); } catch (e) { /* abaikan */ }
      replaceS(old || fresh());
      account = acc;
      await withTimeout(ref.set(payload()), 8000).then(() => {
        if (old) { try { localStorage.removeItem(LOCAL_KEY); } catch (e) { } }
      }).catch(err => { if (err && err.message !== 'timeout') throw err; });
    }
    return S;
  }

  let lastErrAt = 0;
  function saveFailed(err) {
    const now = Date.now(); if (now - lastErrAt < 3000) return; lastErrAt = now;
    const c = err && err.code;
    const msg = c === 'permission-denied' ? 'Akses database ditolak. Cek aturan Firestore di Firebase Console.'
      : c === 'invalid-argument' ? 'Penyimpanan penuh. Coba pakai foto yang lebih kecil.'
        : 'Gagal menyimpan ke database Google. Periksa koneksi internetmu.';
    w.UI && w.UI.toast(msg, 'err');
  }
  function save() {
    if (!ref) return false;
    const size = JSON.stringify(S).length;
    if (size > 900000) { saveFailed({ code: 'invalid-argument' }); return false; }   // batas dokumen Firestore ±1 MB
    ref.set(payload()).catch(saveFailed);
    return true;
  }
  /* Hapus semua data akun ini. Mengembalikan Promise (tunggu maks. 4 dtk agar aman sebelum reload). */
  function reset() {
    replaceS(fresh());
    if (!ref) return Promise.resolve(S);
    return withTimeout(ref.set(payload()), 4000).then(() => S, () => S);
  }
  function signOut() { return auth ? auth.signOut() : Promise.resolve(); }

  const pad = n => String(n).padStart(2, '0');
  const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dstr(new Date());
  const ym = s => s.slice(0, 7);
  function addMonths(m, n) { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
  function daysIn(m) { const [y, mm] = m.split('-').map(Number); return new Date(y, mm, 0).getDate(); }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTHS_L = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const num = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rp = n => (n < 0 ? '-' : '') + 'Rp ' + num(n);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---- streak: menyala bila ada PEMASUKAN di hari itu ---- */
  function litSet() { const s = new Set(); S.tx.forEach(t => { if (t.type === 'in') s.add(t.date); }); return s; }
  function isLitToday() { return litSet().has(today()); }
  function streak() {
    const set = litSet(); const d = new Date(); let c = 0;
    if (!set.has(dstr(d))) d.setDate(d.getDate() - 1);   // hari ini belum nyala: streak masih hidup sampai hari berakhir
    while (set.has(dstr(d))) { c++; d.setDate(d.getDate() - 1); }
    return c;
  }
  function bestStreak() {
    const days = [...litSet()].sort(); let best = 0, cur = 0, prev = null;
    days.forEach(s => {
      const [y, m, dd] = s.split('-').map(Number); const t = new Date(y, m - 1, dd).getTime();
      cur = (prev !== null && Math.round((t - prev) / 864e5) === 1) ? cur + 1 : 1; prev = t; best = Math.max(best, cur);
    });
    return best;
  }
  const sum = (arr, type) => arr.reduce((a, t) => a + (t.type === type ? t.amount : 0), 0);

  w.Store = {
    get S() { return S; }, save, reset, MAX_GOALS, initFirebase, attach, signOut,
    get auth() { return auth; },
    pad, dstr, today, ym, addMonths, daysIn, MONTHS, MONTHS_L, num, rp, uid, litSet, isLitToday, streak, bestStreak, sum
  };
})(window);
