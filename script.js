// ParkEase — Smart Spot Booking & Live Parking Utilities
// Supported User Roles: Normal User (1-day pre-book) & Membership User (7-day pre-book, 20% off)

const FL = {
  b: { n: 'Basement Level', v: 'Car', p: 'B', c: 36, r: 40, t: 'Covered · Standard & SUV' },
  g: { n: 'Ground Floor', v: 'EV', p: 'G', c: 24, r: 35, t: 'EV Fast Charging · Priority' },
  f: { n: 'First Floor', v: 'Bike', p: 'F', c: 24, r: 15, t: 'Two Wheeler · Secure Bays' }
};

const LOCS = [
  { name: 'City Center Mall', dist: '0.4 km', info: 'Covered · CCTV · EV Charging' },
  { name: 'Central Metro Station', dist: '1.2 km', info: 'Direct Concourse Link · 24/7' },
  { name: 'Airport Express Hub', dist: '4.8 km', info: 'Long-term · Valet Available' },
  { name: 'Riverside Financial Plaza', dist: '2.1 km', info: 'Corporate · Security Monitored' }
];

const MEMBERSHIP_PRICE = 999; // Annual ParkEase Membership (no monthly passes)

// Pre-defined users for testing multi-user scenarios
const DEFAULT_USERS = [
  { id: 'u1', name: 'User 1', phone: '9811223344', plate: 'DL 01 AB 1001', isMember: false },
  { id: 'u2', name: 'User 2', phone: '9822334455', plate: 'DL 02 CD 2002', isMember: false },
  { id: 'u3', name: 'User 3 (Member)', phone: '9833445566', plate: 'DL 03 EF 3003', isMember: true }
];

let USERS = [];
try {
  USERS = JSON.parse(localStorage.getItem('pk_users') || 'null');
} catch (e) {}
if (!Array.isArray(USERS) || USERS.length === 0) {
  USERS = DEFAULT_USERS;
  try { localStorage.setItem('pk_users', JSON.stringify(USERS)); } catch (e) {}
}

let CURRENT_USER_ID = localStorage.getItem('pk_cur_uid') || 'u1';
let currentUser = USERS.find(u => u.id === CURRENT_USER_ID) || USERS[0];

const saveUsers = () => {
  try {
    localStorage.setItem('pk_users', JSON.stringify(USERS));
    localStorage.setItem('pk_cur_uid', currentUser.id);
  } catch (e) {}
};

let S = {
  loc: LOCS[0].name
};
try {
  const storedS = JSON.parse(localStorage.getItem('pk_s') || '{}');
  Object.assign(S, storedS);
} catch (e) {}

const saveS = () => {
  try { localStorage.setItem('pk_s', JSON.stringify(S)); } catch (e) {}
};

// Date & Time calculation helpers
const getTodayDateStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const getTimestampForDateAndHour = (dateStr, hour) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, hour, 0, 0, 0);
  return dt.getTime();
};

const isMember = () => Boolean(currentUser && currentUser.isMember);

// Temporary booking / selection state
let T = {
  tab: 0,
  slot: null,
  fl: 'b',
  dateOffset: 0, // 0 = Today, 1 = Tomorrow, ..., up to 7
  dateStr: getTodayDateStr(0),
  startHour: 10,
  hrs: 1,
  veh: 'Car',
  last: null
};

// Shared Global Bookings Registry
let GLOBAL_BOOKINGS = [];
try {
  GLOBAL_BOOKINGS = JSON.parse(localStorage.getItem('pk_global_bookings') || 'null');
} catch (e) {}

// Seed with the exact user scenario if first time
if (!Array.isArray(GLOBAL_BOOKINGS) || GLOBAL_BOOKINGS.length === 0) {
  const todayStr = getTodayDateStr(0);
  const start10am = getTimestampForDateAndHour(todayStr, 10);
  const end1pm = getTimestampForDateAndHour(todayStr, 13);
  const start1pm = end1pm;
  const end5pm = getTimestampForDateAndHour(todayStr, 17);
  const start11am = getTimestampForDateAndHour(todayStr, 11);
  const end12pm = getTimestampForDateAndHour(todayStr, 12);

  GLOBAL_BOOKINGS = [
    {
      id: 'PK1001',
      userId: 'u1',
      userName: 'User 1',
      plate: 'DL 01 AB 1001',
      slot: 'B4',
      fl: 'b',
      loc: LOCS[0].name,
      vehicle: 'Car',
      dateStr: todayStr,
      startHour: 10,
      hours: 3,
      startTime: start10am,
      endTime: end1pm,
      amount: 120,
      at: start10am,
      landmark: 'Near Elevator',
      notes: 'Initial test reservation (10:00 AM - 01:00 PM)',
      exited: false
    },
    {
      id: 'PK1002',
      userId: 'u2',
      userName: 'User 2',
      plate: 'DL 02 CD 2002',
      slot: 'B4',
      fl: 'b',
      loc: LOCS[0].name,
      vehicle: 'Car',
      dateStr: todayStr,
      startHour: 13,
      hours: 4,
      startTime: start1pm,
      endTime: end5pm,
      amount: 160,
      at: start1pm,
      landmark: 'Near Elevator',
      notes: 'Next reservation on B4 (01:00 PM - 05:00 PM)',
      exited: false
    },
    {
      id: 'PK1003',
      userId: 'u1',
      userName: 'User 1',
      plate: 'DL 01 AB 1001',
      slot: 'B12',
      fl: 'b',
      loc: LOCS[0].name,
      vehicle: 'Car',
      dateStr: todayStr,
      startHour: 11,
      hours: 1,
      startTime: start11am,
      endTime: end12pm,
      amount: 40,
      at: start11am,
      landmark: 'Pillar C3',
      notes: 'Uncontested slot (extensible without conflict)',
      exited: false
    }
  ];
  try { localStorage.setItem('pk_global_bookings', JSON.stringify(GLOBAL_BOOKINGS)); } catch (e) {}
}

const saveBookings = () => {
  try { localStorage.setItem('pk_global_bookings', JSON.stringify(GLOBAL_BOOKINGS)); } catch (e) {}
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s || '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const dateF = t => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const timeF = t => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// Web Audio API Synthesizer
const snd = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playGate() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.12); // A5
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  },
  playHonk() {
    try {
      this.init();
      if (!this.ctx) return;
      [0, 0.18].forEach(dt => {
        const t = this.ctx.currentTime + dt;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(448, t + 0.04);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch (e) {}
  },
  playChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(659.25, t + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, t + 0.16); // G5
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch (e) {}
  }
};

// Toast notification helper
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 250);
  }, 3600);
}

// Active Booking logic for current user
const getActiveBooking = () => {
  const now = Date.now();
  // Find current user's active session or upcoming session
  const active = GLOBAL_BOOKINGS.find(h => h.userId === currentUser.id && !h.exited && now >= h.startTime && now < h.endTime);
  if (active) return active;
  const upcoming = GLOBAL_BOOKINGS.find(h => h.userId === currentUser.id && !h.exited && now < h.endTime);
  return upcoming || null;
};

const getBookingById = id => {
  if (!id) return getActiveBooking() || GLOBAL_BOOKINGS.find(h => h.userId === currentUser.id) || GLOBAL_BOOKINGS[0] || null;
  return GLOBAL_BOOKINGS.find(h => h.id === id) || null;
};

const getTimeInfo = h => {
  if (!h) return { leftStr: '00:00:00', isExpired: true, pct: 100, isNearExpiry: false, minsLeft: 0, isUpcoming: false };
  const now = Date.now();
  if (now < h.startTime) {
    const untilStartMs = h.startTime - now;
    const totalSecs = Math.floor(untilStartMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = n => String(n).padStart(2, '0');
    return {
      leftStr: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
      hrsLeft: hrs,
      minsLeft: mins,
      isExpired: false,
      isUpcoming: true,
      pct: 0,
      isNearExpiry: false
    };
  }

  const leftMs = h.endTime - now;
  if (leftMs <= 0) {
    return { leftStr: '00:00:00', isExpired: true, isUpcoming: false, pct: 100, isNearExpiry: true, minsLeft: 0 };
  }
  const totalSecs = Math.floor(leftMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = n => String(n).padStart(2, '0');
  const totalMs = h.endTime - h.startTime;
  const elapsed = now - h.startTime;
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalMs) * 100)));
  const minsLeft = Math.ceil(leftMs / 60000);
  return {
    leftStr: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
    hrsLeft: hrs,
    minsLeft: mins,
    isExpired: false,
    isUpcoming: false,
    pct,
    isNearExpiry: minsLeft <= 15
  };
};

// Date options: 0 to 7 days
// Normal user: Day 0 & 1 unlocked, Days 2-7 locked
// Member user: Days 0 to 7 all unlocked
function getDateOptions() {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const isLocked = !isMember() && i > 1;
    dates.push({
      offset: i,
      dateStr,
      dayName,
      fullDate,
      isLocked
    });
  }
  return dates;
}

// Slot availability calculation based on selected Date & Time window
const busy = (f, i) => {
  const n = FL[f].p + i;
  const reqStart = getTimestampForDateAndHour(T.dateStr, T.startHour);
  const reqEnd = reqStart + T.hrs * 36e5;
  return GLOBAL_BOOKINGS.some(h => 
    h.loc === S.loc && 
    h.slot === n && 
    !h.exited &&
    h.startTime < reqEnd && 
    h.endTime > reqStart
  );
};

const free = f => Array.from({ length: FL[f].c }, (_, i) => i + 1).filter(i => !busy(f, i)).length;

const bill = (hours = T.hrs, flKey = T.fl) => {
  const f = FL[flKey] || FL.b;
  const sub = f.r * hours;
  const d = isMember() ? Math.round(sub * 0.2) : 0;
  return { sub, d, total: sub - d, rate: f.r };
};

// SVG Icons
const IC = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  pass: '<rect x="3" y="4" width="18" height="16" rx="3"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/><circle cx="16" cy="15" r="1.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="12 8 15 15 12 13 9 15 12 8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  gate: '<rect x="3" y="10" width="4" height="11" rx="1"/><rect x="17" y="10" width="4" height="11" rx="1"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="16" x2="17" y2="16"/>',
  car: '<path d="M5 11l2-5h10l2 5v6H5v-6z"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  sound: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'
};

const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const back = h => `<button class="back" data-go="${h}">${ic('back')}Back</button>`;
const tick = `<div class="tick">${ic('check')}</div>`;

// QR Code SVG generator with dynamic seed
function qr(seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
  let o = '';
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const fx = x < 7 ? 0 : x > 13 ? 14 : -1;
      const fy = y < 7 ? 0 : y > 13 ? 14 : -1;
      let v;
      if (fx >= 0 && fy >= 0 && !(fx && fy)) {
        const dx = x - fx, dy = y - fy;
        v = dx % 6 === 0 || dy % 6 === 0 || (dx > 1 && dx < 5 && dy > 1 && dy < 5);
      } else {
        v = rnd() > 0.5;
      }
      if (v) o += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
    }
  }
  return `<svg class="qr" viewBox="0 0 21 21" role="img" aria-label="Digital Entry Pass QR">${o}</svg>`;
}

const card = u => `
  <div class="pcard">
    <b>ParkEase Membership</b>
    <span>${esc(u.name)}</span>
    <small>Vehicle: ${esc(u.plate)} · Status: Active VIP Member</small>
  </div>`;

// Global Header Bar: Displays Current User & Quick Switcher
const userBar = () => `
  <div class="user-switch-bar">
    <div style="display:flex; align-items:center; gap:8px;">
      <span class="user-badge-role ${currentUser.isMember ? 'member' : ''}">
        ${currentUser.isMember ? '⭐ Member' : 'Normal User'}
      </span>
      <span style="font-weight:700; font-size:13px;">${esc(currentUser.name)}</span>
      <span style="font-family:monospace; font-size:11px; color:var(--mute); background:var(--soft); padding:2px 6px; border-radius:4px;">${esc(currentUser.plate)}</span>
    </div>
    <button class="user-pill-btn" data-act="openUserSwitcher" title="Switch between User 1, User 2, User 3">
      ${ic('user')}
      <span>Switch User</span>
    </button>
  </div>
`;

// VIEWS OBJECT
const V = {
  splash() {
    setTimeout(() => {
      if (!location.hash || location.hash === '#/splash') location.hash = '#/home';
    }, 2200);
    return `
      <section class="splash">
        <div class="top">
          <span>${timeF(Date.now())}</span>
          <span class="status-badge"><span class="dot"></span>Live Parking Network</span>
        </div>
        <div class="mid">
          <div class="logo">P</div>
          <h1>ParkEase</h1>
          <p class="mute">Find, park & operate digital gates with zero stress.</p>
        </div>
        <div class="load"><i></i></div>
      </section>`;
  },

  home() {
    const act = getActiveBooking();
    let actCard = '';
    if (act) {
      const timeInfo = getTimeInfo(act);
      actCard = `
        <div class="live-session-card">
          <div class="live-badge-row">
            <span class="live-tag"><span class="radar"></span>${timeInfo.isUpcoming ? 'Upcoming Reservation' : 'Active Parking'}</span>
            <small style="color: #94a3b8; font-weight: 700;">${esc(act.loc || S.loc)}</small>
          </div>
          <div class="live-main-info">
            <div>
              <div class="live-slot-title">Slot ${act.slot}</div>
              <div class="live-slot-sub">${FL[act.fl]?.n || 'Basement'} · ${esc(act.plate)} · ${timeF(act.startTime)}–${timeF(act.endTime)}</div>
            </div>
            <div class="live-timer-box">
              <div class="live-timer-val" id="live-timer-val">${timeInfo.leftStr}</div>
              <div class="live-timer-lbl">${timeInfo.isUpcoming ? 'Starts in' : timeInfo.isExpired ? 'Overstay' : 'Time Remaining'}</div>
            </div>
          </div>
          <div class="live-actions-row">
            <button class="live-action-btn" data-go="#/pass/${act.id}">
              ${ic('pass')}<span>Pass & Gate</span>
            </button>
            <button class="live-action-btn" data-act="openExt" data-id="${act.id}">
              ${ic('clock')}<span>Extend</span>
            </button>
            <button class="live-action-btn" data-go="#/find/${act.id}">
              ${ic('compass')}<span>Find Car</span>
            </button>
          </div>
        </div>`;
    }

    const curLocObj = LOCS.find(l => l.name === S.loc) || LOCS[0];

    // Filter relevant booked slots for the garage schedule
    const allGarageBookings = GLOBAL_BOOKINGS.filter(b => b.loc === S.loc && !b.exited);

    return `
      ${userBar()}

      <div class="row">
        <div class="loc-wrap">
          <label class="loc">
            ${ic('pin')}
            <select id="loc" aria-label="Location">
              ${LOCS.map(l => `<option value="${l.name}"${l.name === S.loc ? ' selected' : ''}>${l.name}</option>`).join('')}
            </select>
          </label>
        </div>
        <span class="status-badge"><span class="dot"></span>Open 24/7</span>
      </div>

      ${actCard}

      <!-- ALL BOOKED SLOTS SECTION (GARAGE SCHEDULE) -->
      <section class="booked-slots-section">
        <div class="booked-slots-header">
          <h2>All Booked Slots (Garage Schedule)</h2>
          <span class="status-badge"><span class="dot"></span>${allGarageBookings.length} Active / Reserved</span>
        </div>
        <p class="mute" style="font-size:13px; margin-bottom:12px;">Live reservations across all drivers for ${esc(S.loc)}.</p>

        ${allGarageBookings.length ? allGarageBookings.map(b => {
          const isMine = b.userId === currentUser.id;
          const tInfo = getTimeInfo(b);
          return `
            <div class="booked-slot-item ${isMine ? 'mine' : ''}">
              <div class="booked-slot-top">
                <div class="booked-slot-badge">
                  <span>Slot ${b.slot}</span>
                  <span class="floor-tag">${FL[b.fl]?.p} Floor · ${FL[b.fl]?.n}</span>
                </div>
                <span class="pill ${tInfo.isUpcoming ? '' : 'on'}">${tInfo.isUpcoming ? 'Upcoming' : 'Active Now'}</span>
              </div>
              <div class="booked-slot-time">
                ${ic('clock')}
                <span>${dateF(b.startTime)}: <b>${timeF(b.startTime)} – ${timeF(b.endTime)}</b> (${b.hours} hr)</span>
              </div>
              <div class="booked-slot-user">
                Driver: <b>${esc(b.userName)}</b> · Plate: <code style="font-family:monospace">${esc(b.plate)}</code>
                ${isMine ? '<span style="color:var(--acc); font-weight:700; margin-left:6px;">(You)</span>' : ''}
              </div>

              ${isMine ? `
                <div class="booked-slot-actions">
                  <button class="btn btn-sm btn-sec" data-go="#/pass/${b.id}">
                    ${ic('pass')} Pass & Gate
                  </button>
                  <button class="btn btn-sm btn-sec" data-act="openExt" data-id="${b.id}">
                    ${ic('clock')} Extend
                  </button>
                  <button class="btn btn-sm btn-sec" data-go="#/find/${b.id}">
                    ${ic('compass')} Find Car
                  </button>
                </div>
              ` : `
                <div style="margin-top:8px; font-size:11px; color:var(--mute); display:flex; align-items:center; gap:4px;">
                  🔒 Booked by another driver. You can reserve this slot before or after this time window.
                </div>
              `}
            </div>
          `;
        }).join('') : `
          <div class="empty" style="padding:24px 0;">
            <p>No booked slots at this location right now. All slots are free!</p>
          </div>
        `}
      </section>

      <h1>Find the best parking near you.</h1>
      <p class="mute">${curLocObj.dist} away · ${curLocObj.info}</p>

      <div class="grid3">
        ${Object.entries(FL).map(([k, f]) => `
          <button class="card" data-go="#/floor/${k}">
            <span class="tile">${f.p}</span>
            <span>
              <b>${f.n}</b>
              <small>${f.t} · ${inr(f.r)}/hr</small>
            </span>
            <em>${free(k)} slots free</em>
          </button>
        `).join('')}
      </div>

      ${isMember() ? '' : `
        <button class="banner" data-go="#/member">
          <div>
            <b>Join ParkEase Membership</b>
            <small>Pre-book up to 7 days ahead & save 20% on all bookings</small>
          </div>
          <span class="tile" style="background:#fff; color:var(--acc); width:38px; height:38px; font-size:16px;">★</span>
        </button>
      `}
    `;
  },

  floor(k) {
    const f = FL[k];
    if (!f) return V.home();
    if (T.fl !== k) {
      T.fl = k;
      T.tab = 0;
      T.slot = null;
    }

    const dateOptions = getDateOptions();

    // Floor slots pagination
    let s = '';
    for (let i = T.tab * 12 + 1; i <= T.tab * 12 + 12; i++) {
      const n = f.p + i;
      const isBusy = busy(k, i);
      s += `<button class="slot${T.slot === n ? ' sel' : ''}" ${isBusy ? 'disabled' : ''} data-act="pick" data-i="${n}" aria-label="Slot ${n}">
        <span>${n}</span>
      </button>`;
    }

    const reqStart = getTimestampForDateAndHour(T.dateStr, T.startHour);
    const reqEnd = reqStart + T.hrs * 36e5;

    // Start hour selector options: 8 AM to 10 PM
    const hourOptions = [];
    for (let h = 8; h <= 22; h++) {
      const dummyDate = new Date();
      dummyDate.setHours(h, 0, 0, 0);
      const label = dummyDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      hourOptions.push({ h, label });
    }

    return `
      ${userBar()}
      ${back('#/home')}
      <h1>${f.n}</h1>
      <p class="mute">${f.t} · ${inr(f.r)}/hr. Select date, time window and reserve your bay.</p>

      <!-- 1. PRE-BOOKING DATE SELECTOR (1-Day for Normal, 7-Day for Member) -->
      <div class="date-section">
        <div class="date-section-header">
          <span class="date-section-title">1. Select Reservation Date</span>
          <span class="date-rule-tag">${isMember() ? '⭐ Member: 7-Day Advance' : 'Normal: Max 1-Day Advance'}</span>
        </div>
        <div class="date-scroll-list">
          ${dateOptions.map(d => `
            <button class="date-chip ${T.dateOffset === d.offset ? 'sel' : ''} ${d.isLocked ? 'locked' : ''}" 
                    data-act="pickDate" 
                    data-offset="${d.offset}" 
                    data-locked="${d.isLocked ? '1' : '0'}">
              ${d.isLocked ? '<span class="date-chip-lock" title="Membership required">🔒</span>' : ''}
              <span class="date-chip-day">${d.dayName}</span>
              <span class="date-chip-date">${d.fullDate}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 2. TIME WINDOW & DURATION -->
      <div class="time-selector-row">
        <label>
          <span>Start Time</span>
          <select id="sel-start-hour" data-act="pickStartHour">
            ${hourOptions.map(opt => `
              <option value="${opt.h}" ${T.startHour === opt.h ? 'selected' : ''}>${opt.label}</option>
            `).join('')}
          </select>
        </label>
        <label>
          <span>Duration</span>
          <span class="step" style="margin-top:2px;">
            <button data-act="hrs" data-d="-1" aria-label="Fewer hours">−</button>
            <b>${T.hrs} hr</b>
            <button data-act="hrs" data-d="1" aria-label="More hours">+</button>
          </span>
        </label>
      </div>

      <div style="font-size:12px; font-weight:700; color:var(--mute); margin-bottom:10px;">
        Selected Window: <span style="color:var(--ink);">${dateF(reqStart)}: ${timeF(reqStart)} – ${timeF(reqEnd)}</span>
      </div>

      <div class="tabs">
        ${Array.from({ length: f.c / 12 }, (_, t) => `
          <button class="tab${T.tab === t ? ' sel' : ''}" data-act="tab" data-i="${t}">Slots ${t * 12 + 1}–${t * 12 + 12}</button>
        `).join('')}
      </div>

      <div class="legend">
        <span><i></i>Available</span>
        <span><i style="background:var(--soft)"></i>Occupied</span>
        <span><i style="background:var(--acc);border-color:var(--acc)"></i>Selected</span>
      </div>

      <div class="slots">${s}</div>

      <div class="bar2">
        <span>${T.slot ? `Selected: <b>${T.slot}</b>` : 'Select an open slot'}</span>
        <button class="btn" ${T.slot ? '' : 'disabled'} data-go="#/book">Reserve Slot</button>
      </div>`;
  },

  book() {
    if (!T.slot) return V.home();
    const f = FL[T.fl];
    const b = bill();
    const reqStart = getTimestampForDateAndHour(T.dateStr, T.startHour);
    const reqEnd = reqStart + T.hrs * 36e5;

    return `
      ${userBar()}
      ${back('#/floor/' + T.fl)}
      <h1>Complete Reservation</h1>
      <p class="mute">Review your parking spot and express entry details.</p>
      
      <div class="list">
        <div class="r">
          <span>Parking Location</span>
          <b>${esc(S.loc)}</b>
        </div>
        <div class="r">
          <span>Floor & Slot</span>
          <b>${f.n} (${T.slot})</b>
        </div>
        <div class="r">
          <span>Reservation Date</span>
          <b>${dateF(reqStart)} (${T.dateOffset === 0 ? 'Today' : T.dateOffset === 1 ? 'Tomorrow' : dateF(reqStart)})</b>
        </div>
        <div class="r">
          <span>Reserved Time Window</span>
          <b>${timeF(reqStart)} – ${timeF(reqEnd)} (${T.hrs} hr)</b>
        </div>
        <div class="r">
          <span>Driver & Plate</span>
          <b style="font-family:monospace; background:var(--soft); padding:2px 8px; border-radius:6px;">${esc(currentUser.name)} (${esc(currentUser.plate)})</b>
        </div>
      </div>

      <h2>Payment Breakdown</h2>
      <div class="list">
        <div class="r">
          <span>${inr(f.r)} × ${T.hrs} hr</span>
          <b>${inr(b.sub)}</b>
        </div>
        ${b.d ? `<div class="r ok"><span>Member Privilege (20% off)</span><b>−${inr(b.d)}</b></div>` : ''}
        <div class="r tot">
          <span>Total Payable</span>
          <b>${inr(b.total)}</b>
        </div>
      </div>

      ${isMember() ? '' : '<button class="link" data-go="#/member">Save 20% with ParkEase Membership</button>'}
      
      <div class="bar2">
        <button class="btn full" data-act="payBook">Pay ${inr(b.total)} & Get Pass</button>
      </div>`;
  },

  paid() {
    const h = T.last;
    if (!h) return V.home();
    return `
      <div class="done">
        ${tick}
        <h1>Reservation Confirmed!</h1>
        <p class="mute">Your digital pass is ready. You can now use the boom barrier gate simulator.</p>
      </div>
      
      <div class="ticket">
        <div class="qr-wrapper">
          <div class="qr-scanner-line"></div>
          ${qr(h.id)}
        </div>
        <div class="qr-sec-tag">Secure Anti-Fraud Dynamic Pass</div>
        <div class="list" style="margin-top:14px; text-align:left;">
          <div class="r"><span>Pass ID</span><b style="font-family:monospace">${h.id}</b></div>
          <div class="r"><span>Slot Assigned</span><b>${h.slot} (${FL[h.fl]?.n || 'Basement'})</b></div>
          <div class="r"><span>Driver / Plate</span><b>${esc(h.userName)} (${esc(h.plate)})</b></div>
          <div class="r"><span>Time Slot</span><b>${timeF(h.startTime)} – ${timeF(h.endTime)}</b></div>
          <div class="r"><span>Amount Paid</span><b>${inr(h.amount)}</b></div>
        </div>
      </div>

      <div style="display:grid; gap:10px;">
        <button class="btn full" data-go="#/pass/${h.id}">
          ${ic('gate')} Open Gate Pass & Simulator
        </button>
        <button class="btn btn-sec full" data-go="#/find/${h.id}">
          ${ic('compass')} Open Find My Car Guide
        </button>
        <button class="ghost" data-go="#/home">Back to Garage Home</button>
      </div>`;
  },

  pass(id) {
    const h = getBookingById(id);
    if (!h) {
      return `
        ${userBar()}
        <h1>Digital Pass</h1>
        <div class="empty">
          <p>No active parking pass found. Reserve a slot to get your digital pass.</p>
          <button class="btn" data-go="#/home">Find Parking</button>
        </div>`;
    }
    const timeInfo = getTimeInfo(h);

    return `
      ${userBar()}
      ${back('#/home')}
      <div class="row">
        <h1>Digital Pass & Gate</h1>
        <span class="pill ${timeInfo.isUpcoming ? '' : timeInfo.isExpired ? '' : 'on'}">${timeInfo.isUpcoming ? 'Upcoming' : timeInfo.isExpired ? 'Expired' : 'Active Pass'}</span>
      </div>
      <p class="mute">Show this pass to scanner or use the interactive boom barrier simulator below.</p>

      <div class="ticket">
        <div class="qr-wrapper">
          <div class="qr-scanner-line"></div>
          ${qr(h.id)}
        </div>
        <div class="qr-sec-tag">Dynamic Gate Token · Rolling ID #${h.id}</div>
        <div class="list" style="margin-top:14px; text-align:left;">
          <div class="r"><span>Location</span><b>${esc(h.loc || S.loc)}</b></div>
          <div class="r"><span>Slot Number</span><b>${h.slot}</b></div>
          <div class="r"><span>Driver / Plate</span><b>${esc(h.userName)} (${esc(h.plate)})</b></div>
          <div class="r"><span>Date</span><b>${dateF(h.startTime)}</b></div>
          <div class="r"><span>Time Slot</span><b>${timeF(h.startTime)} – ${timeF(h.endTime)}</b></div>
          <div class="r"><span>Time Remaining</span><b>${timeInfo.isUpcoming ? 'Starts in ' + timeInfo.leftStr : timeInfo.leftStr}</b></div>
        </div>
      </div>

      <!-- GATE SIMULATOR -->
      <div class="gate-card">
        <div class="row">
          <h2>Interactive Boom Barrier Simulator</h2>
          <span class="status-badge"><span class="dot"></span>Live Gate</span>
        </div>
        <p class="mute">Test the real-time boom barrier mechanism used at parking entries and exits.</p>

        <div class="gate-stage">
          <div class="traffic-light">
            <div class="light-bulb red active" id="light-red"></div>
            <div class="light-bulb green" id="light-green"></div>
          </div>
          <div class="gate-barrier-wrapper">
            <div class="gate-pillar">
              <div class="gate-pivot"></div>
            </div>
            <div class="gate-arm" id="gate-arm"></div>
          </div>
          <div class="gate-road"></div>
        </div>

        <div class="gate-message-banner gate-msg-closed" id="gate-msg">
          Barrier Down • Scan Pass or Tap Below
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <button class="btn btn-ok" id="btn-open-gate" data-act="simGate" data-type="entry" data-id="${h.id}">
            ${ic('gate')} Open Entry Gate
          </button>
          <button class="btn btn-sec" data-act="simGate" data-type="exit" data-id="${h.id}">
            ${ic('check')} Open Exit Gate
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <button class="btn btn-sec" data-act="openExt" data-id="${h.id}">
          ${ic('clock')} Extend Time
        </button>
        <button class="btn" data-go="#/find/${h.id}">
          ${ic('compass')} Find My Car
        </button>
      </div>`;
  },

  find(id) {
    const h = getBookingById(id);
    if (!h) {
      return `
        ${userBar()}
        <h1>Find My Car</h1>
        <div class="empty">
          <p>No parked vehicle record found. Book a parking slot to enable vehicle location guidance.</p>
          <button class="btn" data-go="#/home">Find Parking</button>
        </div>`;
    }

    const timeInfo = getTimeInfo(h);
    const landmarkPresets = ['Near Elevator', 'Pillar C3', 'South Staircase', 'EV Charging Bay', 'Section B Row 2'];
    const activeLandmark = h.landmark || 'Near Elevator';

    return `
      ${userBar()}
      ${back('#/home')}
      <div class="row">
        <h1>Find My Car</h1>
        <span class="status-badge"><span class="dot"></span>Pinned Spot</span>
      </div>
      <p class="mute">Pedestrian walking directions and spot locator for ${esc(h.loc || S.loc)}.</p>

      <div class="find-hero">
        <div class="spot-pill-large">
          <div class="spot-code-box">${h.slot}</div>
          <div>
            <b style="font-size:18px;">${FL[h.fl]?.n || 'Basement Level'}</b>
            <small style="color:var(--mute); margin-top:2px;">${esc(h.plate)} · Slot ${h.slot}</small>
            <small style="color:var(--ok); font-weight:700; margin-top:2px;">
              ${timeInfo.isUpcoming ? 'Starts at ' + timeF(h.startTime) : timeInfo.isExpired ? 'Session Expired' : timeInfo.leftStr + ' remaining'}
            </small>
          </div>
        </div>

        <h2>Walking Directions to Your Spot</h2>
        <div class="walk-step">
          <div class="step-num">1</div>
          <div>
            <b>Take the Pedestrian Elevator</b>
            <p class="mute">From mall/station concourse, take Elevator B down to ${FL[h.fl]?.n || 'Basement Level'}.</p>
          </div>
        </div>
        <div class="walk-step">
          <div class="step-num">2</div>
          <div>
            <b>Follow Yellow Walking Lane</b>
            <p class="mute">Exit elevator lobby and proceed straight past Pillar C2 along the safety lane.</p>
          </div>
        </div>
        <div class="walk-step">
          <div class="step-num">3</div>
          <div>
            <b>Arrive at Bay ${h.slot}</b>
            <p class="mute">Slot ${h.slot} is located on your right, marked with overhead bay indicator.</p>
          </div>
        </div>
      </div>

      <!-- HONK HORN & FLASH LIGHTS SIMULATOR -->
      <div class="honk-box">
        <svg class="honk-car-svg" id="honk-car-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 11l2-5h10l2 5v6H5v-6z"/>
          <circle cx="8" cy="17" r="1.5" fill="currentColor"/>
          <circle cx="16" cy="17" r="1.5" fill="currentColor"/>
          <line x1="2" y1="13" x2="4" y2="13"/>
          <line x1="20" y1="13" x2="22" y2="13"/>
        </svg>
        <b style="font-size:16px; display:block;">Can't spot your vehicle?</b>
        <p style="color:#94a3b8; font-size:13px; margin:4px 0 14px;">Trigger vehicle alarm and hazard lights simulator to locate your car.</p>
        <button class="btn btn-sm btn-sec" style="background:#fff; color:#0f172a; margin:0 auto;" data-act="honkCar" data-slot="${h.slot}">
          ${ic('sound')} Flash Lights & Honk Horn
        </button>
      </div>

      <!-- LANDMARK & CUSTOM SPOT NOTES -->
      <div class="landmark-box">
        <h2>Spot Landmark & Notes</h2>
        <p class="mute">Tag a nearby pillar or leave yourself a reminder note.</p>
        
        <div class="landmark-tags">
          ${landmarkPresets.map(tag => `
            <button class="landmark-tag${activeLandmark === tag ? ' active' : ''}" data-act="tagLandmark" data-tag="${tag}" data-id="${h.id}">
              ${tag}
            </button>
          `).join('')}
        </div>

        <div style="margin-top:12px;">
          <input id="spot-note" placeholder="Custom note: e.g. Parked opposite Pillar C3 near ramp" value="${esc(h.notes || '')}">
          <button class="btn btn-sm btn-sec" style="margin-top:8px;" data-act="saveNote" data-id="${h.id}">
            Save Note
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <button class="btn btn-sec" data-act="openExt" data-id="${h.id}">
          ${ic('clock')} Extend Parking
        </button>
        <button class="btn btn-ok" data-act="exitParking" data-id="${h.id}">
          ${ic('check')} Completed / Exited
        </button>
      </div>`;
  },

  history() {
    const l = GLOBAL_BOOKINGS.filter(b => b.userId === currentUser.id);
    return `
      ${userBar()}
      <h1>My Parking History</h1>
      <p class="mute">Reservations and digital receipts for ${esc(currentUser.name)}.</p>
      ${l.length ? l.map(h => {
        const on = Date.now() < h.endTime && !h.exited;
        return `
          <div class="hcard">
            <div class="r">
              <b style="font-size:16px;">Slot ${h.slot} (${FL[h.fl]?.n || 'Basement'})</b>
              <span class="pill${on ? ' on' : ''}">${on ? 'Active' : 'Completed'}</span>
            </div>
            <div class="r"><span>Location</span><b>${esc(h.loc || S.loc)}</b></div>
            <div class="r"><span>Time Slot</span><b>${dateF(h.startTime)} · ${timeF(h.startTime)}–${timeF(h.endTime)} (${h.hours} hr)</b></div>
            <div class="r"><span>Vehicle Plate</span><b>${esc(h.plate)}</b></div>
            <div class="r"><span>Total Paid</span><b>${inr(h.amount)}</b></div>
            <div style="display:flex; gap:8px; padding:10px 0;">
              <button class="btn btn-sm btn-sec" data-go="#/pass/${h.id}">View Pass</button>
              <button class="btn btn-sm btn-sec" data-go="#/find/${h.id}">Find Spot</button>
              ${on ? `<button class="btn btn-sm btn-ok" data-act="openExt" data-id="${h.id}">Extend</button>` : ''}
            </div>
          </div>`;
      }).join('') : `
        <div class="empty">
          <p>No parking sessions found for ${esc(currentUser.name)}. Book a slot to start!</p>
          <button class="btn" data-go="#/home">Find Parking Now</button>
        </div>
      `}`;
  },

  profile() {
    const m = isMember();
    return `
      ${userBar()}
      <div class="who">
        <span class="av">${esc((currentUser.name || 'U')[0].toUpperCase())}</span>
        <div>
          <h1>${esc(currentUser.name)}</h1>
          <p class="mute">Driver Account · <span class="user-badge-role ${m ? 'member' : ''}">${m ? '⭐ Membership User' : 'Normal User'}</span></p>
        </div>
      </div>

      <details open>
        <summary>Account & Vehicle Details</summary>
        <div class="pad">
          <label>Full Name
            <input id="nm" value="${esc(currentUser.name)}" autocomplete="name" placeholder="Driver Name">
          </label>
          <label>Phone Number
            <input id="ph" inputmode="tel" value="${esc(currentUser.phone)}" autocomplete="tel" placeholder="10-digit mobile number">
          </label>
          <label>Vehicle Registration Plate (LPR)
            <input id="pl" value="${esc(currentUser.plate)}" placeholder="e.g. DL 01 AB 8421" style="font-family:monospace; text-transform:uppercase;">
          </label>
          <button class="btn" data-act="saveP">Save Profile</button>
        </div>
      </details>

      <details open>
        <summary>ParkEase Membership Status</summary>
        <div class="pad">
          <p>${m ? `⭐ <b>Membership User Active</b>. You enjoy <b>7-day advance pre-booking</b> and <b>20% discount</b> on all bookings!` : 'You are currently a <b>Normal User</b> (eligible for 1-day advance pre-booking and standard rates).'}</p>
          <button class="btn" data-go="#/member">${m ? 'View Membership Benefits' : '⭐ Purchase Membership (₹999)'}</button>
        </div>
      </details>

      <details>
        <summary>About ParkEase Smart Parking</summary>
        <div class="pad">
          <p class="mute">ParkEase provides seamless smart parking with strict collision prevention: once a slot is booked for a time window, conflicting extensions or double-bookings are automatically blocked.</p>
        </div>
      </details>

      <footer>
        <p>© ParkEase Technologies. Smart, green & collision-free parking.</p>
        <button data-act="clear">Reset & reload demo test data</button>
      </footer>`;
  },

  member() {
    const m = isMember();
    return `
      ${userBar()}
      ${back('#/profile')}
      <h1>ParkEase Membership</h1>
      <p class="mute">Upgrade your driver account with exclusive parking privileges.</p>
      
      <div style="background:#fff; border:1px solid var(--line); border-radius:18px; padding:20px; margin:16px 0; box-shadow:var(--shadow-sm);">
        <div class="row">
          <div>
            <h2 style="margin:0; font-size:18px;">${m ? '⭐ Membership Active' : 'ParkEase VIP Membership'}</h2>
            <p class="mute" style="font-size:13px; margin:4px 0 0;">Strictly for registered drivers & regular commuters</p>
          </div>
          <span class="user-badge-role ${m ? 'member' : ''}">${m ? 'Active Member' : 'Normal User'}</span>
        </div>

        <div style="margin:16px 0; display:grid; gap:10px;">
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="font-size:18px;">📅</span>
            <div>
              <b>7-Day Advance Pre-Booking</b>
              <small>Normal users can pre-book only 1 day before. Members can book up to 7 days in advance.</small>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="font-size:18px;">🏷️</span>
            <div>
              <b>20% Flat Discount on All Bookings</b>
              <small>Instant deduction automatically applied during checkout.</small>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="font-size:18px;">⚡</span>
            <div>
              <b>Express Digital Gate Pass & Priority Bays</b>
              <small>Fast-track boom barrier access simulator and EV charging bays.</small>
            </div>
          </div>
        </div>

        ${m ? card(currentUser) : ''}
      </div>

      <div class="bar2">
        <span><b>${inr(MEMBERSHIP_PRICE)} / Year</b></span>
        <button class="btn" data-act="payMem">${m ? 'Renew Membership' : 'Pay ₹999 & Activate Membership'}</button>
      </div>`;
  },

  mpaid() {
    return `
      <div class="done">
        ${tick}
        <h1>Welcome to ParkEase Membership!</h1>
        <p class="mute">You can now pre-book up to 7 days in advance and save 20% on all bookings.</p>
      </div>
      ${card(currentUser)}
      <button class="btn full" data-go="#/home">Start Booking with Member Perks</button>`;
  }
};

// UPI Payment Sheet Modal
function sheet(amount, title, done) {
  const o = document.createElement('div');
  o.className = 'ov';
  o.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Pay using UPI">
      <h2 style="margin:0">Pay using UPI</h2>
      <p class="mute" style="margin:0">${title} · <b>${inr(amount)}</b></p>
      <input id="upi" placeholder="yourname@bank" autocomplete="off" autocapitalize="none">
      <div class="chips">
        ${['@okaxis', '@ybl', '@paytm', '@upi'].map(s => `<button class="chip" data-s="${s}">${s}</button>`).join('')}
      </div>
      <p class="err" id="err" role="alert"></p>
      <button class="btn full" id="go">Pay ${inr(amount)}</button>
      <button class="ghost" id="cx">Cancel</button>
    </div>`;
  document.body.appendChild(o);
  const u = o.querySelector('#upi'), go = o.querySelector('#go'), er = o.querySelector('#err');
  u.focus();

  o.onclick = e => {
    if (e.target === o || e.target.id === 'cx') o.remove();
    const s = e.target.dataset.s;
    if (s) {
      u.value = u.value.split('@')[0] + s;
      u.focus();
    }
  };

  go.onclick = () => {
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(u.value.trim())) {
      er.textContent = 'Enter a valid UPI ID (e.g. name@bank).';
      u.focus();
      return;
    }
    er.textContent = '';
    go.disabled = true;
    go.textContent = 'Verifying UPI pin…';
    setTimeout(() => {
      o.remove();
      snd.playChime();
      done();
    }, 1200);
  };
}

// User Switcher Modal
function openUserSwitcher() {
  const o = document.createElement('div');
  o.className = 'ov';
  o.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Switch User">
      <div class="row" style="margin-bottom:4px;">
        <h2 style="margin:0">Switch Driver Profile</h2>
        <span class="status-badge"><span class="dot"></span>Multi-User Mode</span>
      </div>
      <p class="mute" style="margin:0">Switch between test users to test overlapping bookings and extension rules.</p>
      
      <div class="user-switch-list">
        ${USERS.map(u => `
          <button class="user-switch-card ${u.id === currentUser.id ? 'active' : ''}" data-uid="${u.id}">
            <div>
              <b style="font-size:15px;">${esc(u.name)}</b>
              <small style="margin-top:2px;">Plate: <code style="font-family:monospace; background:var(--soft); padding:1px 6px; border-radius:4px;">${esc(u.plate)}</code></small>
            </div>
            <div style="text-align:right;">
              <span class="user-badge-role ${u.isMember ? 'member' : ''}">${u.isMember ? '⭐ Member' : 'Normal User'}</span>
              <small style="font-size:11px; margin-top:4px; color:var(--mute);">${u.isMember ? '7-Day Pre-book · 20% Off' : '1-Day Pre-book'}</small>
            </div>
          </button>
        `).join('')}
      </div>

      <div style="border-top:1px solid var(--line); padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <b style="font-size:14px;">Toggle Membership Role</b>
          <p class="mute" style="font-size:12px; margin:0;">Switch ${esc(currentUser.name)} between Normal & Member</p>
        </div>
        <button class="btn btn-sm btn-sec" id="btn-toggle-membership">
          ${currentUser.isMember ? 'Set Normal User' : '⭐ Set Membership User'}
        </button>
      </div>

      <button class="ghost" id="cx-user" style="margin-top:8px;">Close</button>
    </div>
  `;
  document.body.appendChild(o);

  o.onclick = e => {
    if (e.target === o || e.target.id === 'cx-user') {
      o.remove();
      return;
    }
    const card = e.target.closest('.user-switch-card');
    if (card) {
      const uid = card.dataset.uid;
      const targetUser = USERS.find(u => u.id === uid);
      if (targetUser) {
        currentUser = targetUser;
        saveUsers();
        o.remove();
        showToast(`Switched account to ${currentUser.name} (${currentUser.isMember ? '⭐ Member' : 'Normal User'})`, 'info');
        render();
      }
    }
    if (e.target.id === 'btn-toggle-membership') {
      currentUser.isMember = !currentUser.isMember;
      saveUsers();
      o.remove();
      showToast(`${currentUser.name} is now a ${currentUser.isMember ? '⭐ Membership User' : 'Normal User'}!`, 'success');
      render();
    }
  };
}

// Extend Parking Modal with Subsequent Booking Collision Detection
function openExtendSheet(bookingId) {
  const h = getBookingById(bookingId);
  if (!h) {
    showToast('No booking record found to extend.', 'warn');
    return;
  }
  const f = FL[h.fl] || FL.b;

  // Query shared bookings for subsequent reservations on the SAME slot
  const nextBookings = GLOBAL_BOOKINGS.filter(b => 
    b.id !== h.id &&
    b.slot === h.slot &&
    b.loc === h.loc &&
    !b.exited &&
    b.startTime >= h.endTime
  ).sort((a, b) => a.startTime - b.startTime);

  const nextBooking = nextBookings[0] || null;
  const maxGapMs = nextBooking ? Math.max(0, nextBooking.startTime - h.endTime) : Infinity;
  const maxExtendHours = nextBooking ? Math.floor(maxGapMs / 36e5) : 4;
  const isTotallyBlocked = nextBooking && maxExtendHours < 1;

  let chosenExt = isTotallyBlocked ? 0 : 1;

  const o = document.createElement('div');
  o.className = 'ov';

  let conflictHtml = '';
  if (isTotallyBlocked) {
    conflictHtml = `
      <div class="ext-conflict-card">
        <div class="ext-conflict-icon">🚫</div>
        <div>
          <b>Extension Blocked: Slot Reserved</b>
          <p>Slot <b>${h.slot}</b> is already reserved by <b>${esc(nextBooking.userName)}</b> (${esc(nextBooking.plate)}) starting at <b>${timeF(nextBooking.startTime)}</b> (${dateF(nextBooking.startTime)}). A user can only extend if there is no subsequent booking on the same slot.</p>
        </div>
      </div>
    `;
  } else if (nextBooking) {
    conflictHtml = `
      <div class="ext-conflict-card" style="background:#fffbeb; border-color:#fef3c7; color:#92400e;">
        <div class="ext-conflict-icon">⚠️</div>
        <div>
          <b>Limited Extension Window</b>
          <p>Slot <b>${h.slot}</b> is reserved by <b>${esc(nextBooking.userName)}</b> starting at <b>${timeF(nextBooking.startTime)}</b>. Maximum allowed extension is <b>+${maxExtendHours} hour(s)</b>.</p>
        </div>
      </div>
    `;
  }

  const updateCost = () => {
    if (isTotallyBlocked || chosenExt === 0) {
      o.querySelector('#ext-cost-val').textContent = inr(0);
      const payBtn = o.querySelector('#ext-pay-btn');
      payBtn.disabled = true;
      payBtn.textContent = 'Extension Blocked (Slot Reserved)';
      return;
    }
    const tot = bill(chosenExt, h.fl).total;
    o.querySelector('#ext-cost-val').textContent = inr(tot);
    o.querySelector('#ext-pay-btn').textContent = `Pay ${inr(tot)} & Extend +${chosenExt} hr`;
    o.querySelector('#ext-pay-btn').disabled = false;
  };

  const extButtons = [1, 2, 3, 4].map(hours => {
    const isAvail = hours <= maxExtendHours;
    const isSel = hours === chosenExt && isAvail;
    const cost = bill(hours, h.fl).total;
    return `
      <button class="extend-opt ${isSel ? 'sel' : ''} ${!isAvail ? 'disabled' : ''}" 
              data-h="${hours}" 
              ${!isAvail ? 'disabled title="Slot is already reserved during this time"' : ''}>
        <b>+${hours} Hour${hours > 1 ? 's' : ''}</b>
        <span>${isAvail ? inr(cost) : 'Reserved'}</span>
      </button>
    `;
  }).join('');

  o.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Extend Parking Session">
      <div class="row" style="margin-bottom:4px;">
        <h2 style="margin:0">Extend Parking Time</h2>
        <span class="pill ${isTotallyBlocked ? '' : 'on'}">${isTotallyBlocked ? 'Slot Reserved' : 'Extension Available'}</span>
      </div>
      <p class="mute" style="margin:0">Slot <b>${h.slot}</b> (${FL[h.fl]?.n || 'Basement'}) · Current end time: <b>${timeF(h.endTime)}</b></p>
      
      ${conflictHtml}

      <div class="extend-opts">
        ${extButtons}
      </div>

      <div class="r" style="border-top:1px solid var(--line); padding-top:12px;">
        <span>Additional Total:</span>
        <b style="font-size:18px;" id="ext-cost-val">${inr(chosenExt ? bill(chosenExt, h.fl).total : 0)}</b>
      </div>
      <button class="btn full" id="ext-pay-btn" ${isTotallyBlocked ? 'disabled' : ''}>
        ${isTotallyBlocked ? 'Extension Blocked (Slot Reserved)' : `Pay & Extend`}
      </button>
      <button class="ghost" id="ext-cancel">Close</button>
    </div>
  `;

  document.body.appendChild(o);

  o.onclick = e => {
    if (e.target === o || e.target.id === 'ext-cancel') {
      o.remove();
      return;
    }
    const opt = e.target.closest('.extend-opt:not(.disabled)');
    if (opt) {
      o.querySelectorAll('.extend-opt').forEach(el => el.classList.remove('sel'));
      opt.classList.add('sel');
      chosenExt = Number(opt.dataset.h);
      updateCost();
    }
  };

  o.querySelector('#ext-pay-btn').onclick = () => {
    if (isTotallyBlocked || chosenExt === 0) return;
    const tot = bill(chosenExt, h.fl).total;
    o.remove();
    sheet(tot, `Extend Slot ${h.slot} by +${chosenExt} hr`, () => {
      h.hours += chosenExt;
      h.endTime += chosenExt * 36e5;
      h.amount += tot;
      saveBookings();
      showToast(`Slot ${h.slot} extended by +${chosenExt} hour(s) till ${timeF(h.endTime)}!`, 'success');
      render(1);
    });
  };

  updateCost();
}

// Router and View Renderer
function render(keep) {
  const [, r, a] = location.hash.split('/');
  const route = V[r] ? r : 'splash';
  $('#app').innerHTML = V[route](a);
  const nav = $('#nav');
  nav.hidden = route === 'splash';

  const act = getActiveBooking();
  const cur = ({ floor: 'home', book: 'home', paid: 'home', member: 'profile', mpaid: 'profile', pass: 'pass', find: 'find' })[route] || route;

  nav.innerHTML = [
    ['home', 'Home', 'home'],
    ['pass', 'Pass & Gate', 'pass'],
    ['find', 'Find Car', 'compass'],
    ['history', 'History', 'hist'],
    ['profile', 'Profile', 'user']
  ].map(([k, l, icon]) => {
    const hasDot = (k === 'pass' || k === 'find') && act;
    return `
      <a href="#/${k}" class="${cur === k ? 'on' : ''}"${cur === k ? ' aria-current="page"' : ''}>
        ${ic(icon)}
        ${hasDot ? '<span class="nav-dot"></span>' : ''}
        <span>${l}</span>
      </a>`;
  }).join('');

  if (!keep) scrollTo(0, 0);
}

// Global 1-second ticker for real-time counters
setInterval(() => {
  const act = getActiveBooking();
  const timerEl = document.getElementById('live-timer-val');
  if (timerEl && act) {
    const info = getTimeInfo(act);
    timerEl.textContent = info.leftStr;
  }
}, 1000);

// Action Handler Dispatcher
const A = {
  tab: el => {
    T.tab = +el.dataset.i;
    render(1);
  },
  pick: el => {
    T.slot = T.slot === el.dataset.i ? null : el.dataset.i;
    render(1);
  },
  pickDate: el => {
    const isLocked = el.dataset.locked === '1';
    if (isLocked) {
      showToast('🔒 Membership Required: Normal users can pre-book only up to 1 day before. Upgrade to Membership to book up to 7 days ahead!', 'warn');
      return;
    }
    const offset = Number(el.dataset.offset);
    T.dateOffset = offset;
    T.dateStr = getTodayDateStr(offset);
    T.slot = null;
    render(1);
  },
  hrs: el => {
    T.hrs = Math.min(12, Math.max(1, T.hrs + +el.dataset.d));
    T.slot = null; // Re-evaluate busy slots for new duration
    render(1);
  },
  openUserSwitcher: () => {
    openUserSwitcher();
  },
  payBook: () => {
    const b = bill(), f = FL[T.fl];
    sheet(b.total, `Slot ${T.slot}, ${T.hrs} hr`, () => {
      const reqStart = getTimestampForDateAndHour(T.dateStr, T.startHour);
      const reqEnd = reqStart + T.hrs * 36e5;
      const h = {
        id: 'PK' + Date.now().toString(36).toUpperCase().slice(-6),
        userId: currentUser.id,
        userName: currentUser.name,
        plate: currentUser.plate,
        slot: T.slot,
        fl: T.fl,
        loc: S.loc,
        vehicle: f.v,
        dateStr: T.dateStr,
        startHour: T.startHour,
        hours: T.hrs,
        startTime: reqStart,
        endTime: reqEnd,
        amount: b.total,
        at: reqStart,
        landmark: 'Near Elevator',
        notes: '',
        exited: false
      };
      GLOBAL_BOOKINGS.unshift(h);
      saveBookings();
      T.last = h;
      T.slot = null;
      T.hrs = 1;
      showToast(`Slot ${h.slot} booked successfully for ${currentUser.name}!`, 'success');
      location.hash = '#/paid';
    });
  },
  payMem: () => {
    sheet(MEMBERSHIP_PRICE, 'ParkEase Membership', () => {
      currentUser.isMember = true;
      saveUsers();
      showToast(`Welcome to ParkEase Membership, ${currentUser.name}!`, 'success');
      location.hash = '#/mpaid';
    });
  },
  openExt: el => {
    openExtendSheet(el.dataset.id);
  },
  simGate: el => {
    const type = el.dataset.type;
    const arm = document.getElementById('gate-arm');
    const lightRed = document.getElementById('light-red');
    const lightGreen = document.getElementById('light-green');
    const msg = document.getElementById('gate-msg');

    snd.playGate();
    if (arm) arm.classList.add('open');
    if (lightRed) lightRed.classList.remove('active');
    if (lightGreen) lightGreen.classList.add('active');
    if (msg) {
      msg.className = 'gate-message-banner gate-msg-open';
      msg.textContent = type === 'entry' ? 'ACCESS GRANTED • DRIVE IN TO SLOT' : 'ACCESS GRANTED • SAFE TRAVELS';
    }
    showToast(type === 'entry' ? 'Entry boom barrier opened!' : 'Exit boom barrier opened!', 'success');

    setTimeout(() => {
      if (arm) arm.classList.remove('open');
      if (lightGreen) lightGreen.classList.remove('active');
      if (lightRed) lightRed.classList.add('active');
      if (msg) {
        msg.className = 'gate-message-banner gate-msg-closed';
        msg.textContent = 'Barrier Down • Scan Pass or Tap Below';
      }
    }, 4000);
  },
  honkCar: el => {
    const icon = document.getElementById('honk-car-icon');
    if (icon) icon.classList.add('honking');
    snd.playHonk();
    showToast(`Car hazard lights flashing in Bay ${el.dataset.slot || 'B-14'}!`, 'warn');
    setTimeout(() => {
      if (icon) icon.classList.remove('honking');
    }, 1200);
  },
  tagLandmark: el => {
    const h = getBookingById(el.dataset.id);
    if (h) {
      h.landmark = el.dataset.tag;
      saveBookings();
      showToast(`Spot landmark set to "${el.dataset.tag}"`, 'info');
      render(1);
    }
  },
  saveNote: el => {
    const h = getBookingById(el.dataset.id);
    const inp = document.getElementById('spot-note');
    if (h && inp) {
      h.notes = inp.value.trim();
      saveBookings();
      showToast('Spot note saved successfully!', 'success');
      render(1);
    }
  },
  exitParking: el => {
    const h = getBookingById(el.dataset.id);
    if (h && confirm('Confirm you have driven out and wish to complete this parking session?')) {
      h.exited = true;
      saveBookings();
      showToast('Parking session ended. Thank you for choosing ParkEase!', 'info');
      location.hash = '#/history';
    }
  },
  saveP: () => {
    if ($('#nm')) currentUser.name = $('#nm').value.trim();
    if ($('#ph')) currentUser.phone = $('#ph').value.trim();
    if ($('#pl')) currentUser.plate = $('#pl').value.trim().toUpperCase();
    saveUsers();
    showToast('Profile and vehicle details saved!', 'success');
    render(1);
  },
  clear: () => {
    if (confirm('Reset and reload demo test data for User 1 and User 2?')) {
      localStorage.removeItem('pk_users');
      localStorage.removeItem('pk_cur_uid');
      localStorage.removeItem('pk_global_bookings');
      localStorage.removeItem('pk_s');
      location.reload();
    }
  }
};

// Global click event listener
document.addEventListener('click', e => {
  const el = e.target.closest('[data-go],[data-act]');
  if (!el) return;
  if (el.dataset.go) {
    location.hash = el.dataset.go;
  } else if (el.dataset.act && A[el.dataset.act]) {
    A[el.dataset.act](el);
  }
});

// Change event listeners for selects
document.addEventListener('change', e => {
  if (e.target.id === 'loc') {
    S.loc = e.target.value;
    saveS();
    showToast(`Location set to ${S.loc}`, 'info');
    render(1);
  } else if (e.target.id === 'sel-start-hour') {
    T.startHour = Number(e.target.value);
    T.slot = null;
    render(1);
  }
});

addEventListener('hashchange', () => render());
render();
