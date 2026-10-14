/* ============================================================
   Банный комплекс «Карелия» — данные и анимации
   Все цены, телефоны и ссылки меняются здесь, в объекте DATA.
   ============================================================ */

const DATA = {
  phoneMain: { label: '+7 (962) 588-35-35', tel: '+79625883535' },
  phoneCity: { label: '+7 (8362) 35-35-35', tel: '+78362353535' },
  vk: 'https://vk.ru/kareliya12',
  vkMessage: 'https://vk.me/kareliya12',
  // Если появятся мессенджеры — впишите ссылки, кнопки появятся сами:
  whatsapp: '',   // например 'https://wa.me/79625883535'
  telegram: '',   // например 'https://t.me/kareliya12'
  max: '',        // ссылка на MAX, если есть

  // Тарифы: [08–13, 13–17, 17–08] в ₽ за час
  slots: [
    { from: 8, to: 13, label: '08:00–13:00', short: 'Утро' },
    { from: 13, to: 17, label: '13:00–17:00', short: 'День' },
    { from: 17, to: 8, label: '17:00–08:00', short: 'Вечер и ночь' },
  ],
  dayGroups: [
    { key: 'monThu', label: 'ПН–ЧТ', sub: 'будни', days: [1, 2, 3, 4] },
    { key: 'friSat', label: 'ПТ–СБ', sub: 'выходные', days: [5, 6] },
    { key: 'sun', label: 'ВС', sub: 'воскресенье', days: [0] },
  ],
  houses: {
    big: {
      name: 'Большой дом', guests: 'до 8–10 гостей',
      prices: { monThu: [1000, 1800, 2000], friSat: [1400, 2000, 2200], sun: [1200, 2000, 2200] },
      daily: { weekday: 18000, weekend: 22000 },
    },
    small: {
      name: 'Малый дом', guests: 'до 4–6 гостей',
      prices: { monThu: [1000, 1600, 1800], friSat: [1400, 1800, 2000], sun: [1200, 1800, 2000] },
      daily: { weekday: 16000, weekend: 20000 },
    },
  },
  chan: 2000,
  birthdayDiscount: 0.10,

  reviews: [
    {
      name: 'Яндекс Карты', short: 'Я', color: '#fc3f1d', rating: 4.7, count: 196,
      read: 'https://yandex.ru/maps/org/kareliya/151728409402/reviews/',
      write: 'https://yandex.ru/maps/org/kareliya/151728409402/reviews/?add-review=true',
    },
    {
      name: '2ГИС', short: '2', color: '#19aa1e', rating: 4.8, count: 72,
      read: 'https://2gis.ru/yoshkarola/firm/9852153466234630/tab/reviews',
      write: 'https://2gis.ru/yoshkarola/firm/9852153466234630/tab/reviews',
    },
    {
      name: 'Google Карты', short: 'G', color: '#4285f4', rating: 4.7, count: 45,
      read: 'https://www.google.com/maps/place/?q=place_id:ChIJQ0Nsq9fqWUERnSmSar2m9FA',
      write: 'https://search.google.com/local/writereview?placeid=ChIJQ0Nsq9fqWUERnSmSar2m9FA',
    },
  ],

  photos: [
    { src: 'images/territory.jpg', caption: 'Территория и беседки' },
    { src: 'images/steam-room.jpg', caption: 'Парная' },
    { src: 'images/lounge.jpg', caption: 'Зона отдыха с камином' },
    { src: 'images/venik.jpg', caption: 'Парение с веником' },
    { src: 'images/stove.jpg', caption: 'Печь на дровах' },
    { src: 'images/terrace.jpg', caption: 'Терраса' },
    { src: 'images/steam-room-2.jpg', caption: 'Полки в парной' },
    { src: 'images/cold-tub.jpg', caption: 'Купель с холодной водой' },
    { src: 'images/bedrooms.jpg', caption: 'Спальни' },
    { src: 'images/door.jpg', caption: 'Вход в парную' },
  ],
};

/* ---------- Утилиты ---------- */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
const hasGsap = typeof window.gsap !== 'undefined';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DAY_NAMES = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ---------- Логика тарифов ----------
   Ночной интервал 17:00–08:00 относится к дню, в который он начался:
   ночь с пятницы на субботу считается по тарифу ПТ–СБ, с воскресенья на понедельник — по ВС. */
function tariffAt(weekday, hour) {
  let day = weekday;
  let slot;
  if (hour >= 8 && hour < 13) slot = 0;
  else if (hour >= 13 && hour < 17) slot = 1;
  else { slot = 2; if (hour < 8) day = (weekday + 6) % 7; }
  const group = DATA.dayGroups.find((g) => g.days.includes(day));
  return { group, slot, day };
}
const priceOf = (houseKey, t) => DATA.houses[houseKey].prices[t.group.key][t.slot];

/* ---------- Прайс-лист ---------- */
let currentHouse = 'big';

function renderPriceTable() {
  const table = $('#priceTable');
  const house = DATA.houses[currentHouse];
  const now = new Date();
  const nowT = tariffAt(now.getDay(), now.getHours());

  let html = '<div class="pt-row pt-row--head"><div class="pt-cell">Дни</div>';
  DATA.slots.forEach((s) => { html += `<div class="pt-cell">${s.short}<small>${s.label}</small></div>`; });
  html += '</div>';

  DATA.dayGroups.forEach((g) => {
    html += `<div class="pt-row"><div class="pt-cell pt-day">${g.label}<small>${g.sub}</small></div>`;
    house.prices[g.key].forEach((p, i) => {
      const isNow = g.key === nowT.group.key && i === nowT.slot;
      html += `<div class="pt-cell${isNow ? ' is-now' : ''}" data-label="${DATA.slots[i].label}"><span class="pt-price" data-price="${p}">${fmt(p)}<span>₽/ч</span></span></div>`;
    });
    html += '</div>';
  });
  table.innerHTML = html;

  $('#nowText').innerHTML = `Сейчас ${DAY_NAMES[now.getDay()]}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} — ${house.name.toLowerCase()}: <b>${fmt(priceOf(currentHouse, nowT))} ₽/час</b>`;

  $('#priceExtras').innerHTML = `
    <div class="extra" data-reveal><span>Сутки · ПН–ЧТ</span><b>${fmt(house.daily.weekday)} ₽</b></div>
    <div class="extra" data-reveal><span>Сутки · ПТ–ВС</span><b>${fmt(house.daily.weekend)} ₽</b></div>
    <div class="extra" data-reveal><span>Подогреваемый чан</span><b>${fmt(DATA.chan)} ₽</b></div>
    <div class="extra extra--accent" data-reveal><span>Именинникам ±3 дня от ДР</span><b>−${DATA.birthdayDiscount * 100}%</b></div>`;
}

function animatePriceSwap() {
  if (!hasGsap || reduceMotion) return;
  gsap.fromTo('#priceTable .pt-price', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .03, ease: 'power3.out' });
  gsap.fromTo('#priceExtras .extra', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .05, ease: 'power3.out' });
}

function moveSegPill() {
  const active = $('.seg__btn.is-active');
  const pill = $('.seg__pill');
  if (!active || !pill) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft - 5}px)`;
}

function setHouse(key, animate = true) {
  if (key === currentHouse && animate) return;
  currentHouse = key;
  $$('.seg__btn').forEach((b) => {
    const on = b.dataset.house === key;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on);
  });
  moveSegPill();
  renderPriceTable();
  if (animate) animatePriceSwap();
}

function initPrices() {
  renderPriceTable();
  $$('.seg__btn').forEach((b) => b.addEventListener('click', () => setHouse(b.dataset.house)));
  $$('[data-select-house]').forEach((a) => a.addEventListener('click', () => setHouse(a.dataset.selectHouse, false)));
  $$('[data-house-min]').forEach((el) => {
    const all = Object.values(DATA.houses[el.dataset.houseMin].prices).flat();
    el.textContent = fmt(Math.min(...all));
  });
  requestAnimationFrame(moveSegPill);
  window.addEventListener('resize', moveSegPill);
  if (document.fonts) document.fonts.ready.then(moveSegPill);
  setInterval(renderPriceTable, 60000);
}

/* ---------- Калькулятор ---------- */
let shownTotal = 0;

function initCalc() {
  const form = $('#calcForm');
  const start = $('#calcStart');
  for (let h = 0; h < 24; h++) {
    const o = document.createElement('option');
    o.value = h; o.textContent = `${String(h).padStart(2, '0')}:00`;
    start.appendChild(o);
  }
  const now = new Date();
  start.value = Math.min(23, Math.max(now.getHours() + 1, 10)) % 24;
  const today = form.querySelector(`input[name="day"][value="${now.getDay()}"]`);
  if (today) today.checked = true;

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  calculate();
}

function calculate() {
  const form = $('#calcForm');
  const house = form.house.value;
  const day = Number(form.day.value);
  const start = Number(form.start.value);
  const hours = Number(form.hours.value);
  const chan = form.chan.checked;
  const bday = form.bday.checked;

  const range = $('#calcHours');
  range.style.setProperty('--p', ((hours - 1) / 23) * 100 + '%');
  $('#hoursOut').textContent = hours;

  // Почасовой расчёт с учётом смены тарифов
  const parts = [];
  let hourly = 0;
  for (let i = 0; i < hours; i++) {
    const abs = start + i;
    const weekday = (day + Math.floor(abs / 24)) % 7;
    const t = tariffAt(weekday, abs % 24);
    const p = priceOf(house, t);
    hourly += p;
    const last = parts[parts.length - 1];
    if (last && last.price === p && last.key === t.group.key + t.slot) { last.count++; last.end = abs + 1; }
    else parts.push({ key: t.group.key + t.slot, price: p, count: 1, start: abs, end: abs + 1, group: t.group.label });
  }

  // Посуточная аренда: ПН–ЧТ или ПТ–ВС по дню начала
  const daily = [5, 6, 0].includes(day) ? DATA.houses[house].daily.weekend : DATA.houses[house].daily.weekday;
  const useDaily = hours >= 10 && daily < hourly;
  let rent = useDaily ? daily : hourly;
  if (bday) rent *= 1 - DATA.birthdayDiscount;
  const total = rent + (chan ? DATA.chan : 0);

  const hh = (h) => `${String(h % 24).padStart(2, '0')}:00`;
  const list = $('#calcBreakdown');
  if (useDaily) {
    list.innerHTML = `<li><span>Посуточная аренда (${[5, 6, 0].includes(day) ? 'ПТ–ВС' : 'ПН–ЧТ'})</span><b>${fmt(daily)} ₽</b></li>`;
  } else {
    list.innerHTML = parts.map((p) => `<li><span>${hh(p.start)}–${hh(p.end)} · ${p.group} · ${p.count} ч × ${fmt(p.price)} ₽</span><b>${fmt(p.count * p.price)} ₽</b></li>`).join('');
  }
  if (bday) list.innerHTML += `<li><span>Скидка имениннику −10%</span><b>−${fmt((useDaily ? daily : hourly) * DATA.birthdayDiscount)} ₽</b></li>`;
  if (chan) list.innerHTML += `<li><span>Подогреваемый чан</span><b>${fmt(DATA.chan)} ₽</b></li>`;

  const hint = $('#calcHint');
  if (useDaily) hint.textContent = `Выгоднее сутки: экономия ${fmt(hourly - daily)} ₽`;
  else if (hours >= 8 && daily - hourly < 3000) hint.textContent = `Сутки целиком — ${fmt(daily)} ₽`;
  else hint.textContent = `${DAY_SHORT[day]}, ${hh(start)} · ${hours} ч`;

  const out = $('#calcTotal');
  if (hasGsap && !reduceMotion) {
    const obj = { v: shownTotal };
    gsap.to(obj, { v: total, duration: .6, ease: 'power3.out', overwrite: true, onUpdate: () => { out.textContent = fmt(obj.v); } });
  } else out.textContent = fmt(total);
  shownTotal = total;
}

/* ---------- Отзывы ---------- */
function initReviews() {
  $('#reviewsGrid').innerHTML = DATA.reviews.map((r) => `
    <article class="review" style="--brand:${r.color}" data-reveal>
      <div class="review__top">
        <span class="review__logo">${r.short}</span>
        <span class="review__name">${r.name}<small>отзывы гостей</small></span>
      </div>
      <div>
        <div class="review__score"><b data-count="${r.rating}" data-decimals="1">0</b><span class="stars"><i data-stars="${r.rating}"></i></span></div>
        <div class="review__count">${r.count} ${plural(r.count, ['оценка', 'оценки', 'оценок'])}</div>
      </div>
      <div class="review__actions">
        <a class="primary" href="${r.read}" target="_blank" rel="noopener">Читать отзывы</a>
        <a class="secondary" href="${r.write}" target="_blank" rel="noopener">Оставить отзыв</a>
      </div>
    </article>`).join('');
}
function plural(n, forms) {
  const a = n % 100, b = n % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b > 1 && b < 5) return forms[1];
  return forms[2];
}

/* ---------- Мессенджеры ---------- */
function initMessengers() {
  const icons = {
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>',
    vk: '<svg viewBox="0 0 24 24"><path d="M12.8 17.5C6.9 17.5 3.5 13.4 3.4 6.6h3c.1 5 2.3 7.1 4 7.5V6.6h2.8v4.3c1.7-.2 3.5-2.2 4.1-4.3h2.8c-.5 2.7-2.4 4.6-3.8 5.4 1.4.7 3.6 2.4 4.4 5.5h-3.1c-.6-2.1-2.3-3.7-4.4-3.9v3.9z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7a11.7 11.7 0 0 1-4.6-4.1c-.4-.5-1-1.6-1-2.9s.7-2 1-2.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6a8.6 8.6 0 0 0 4.2 3.6c.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.2.5.2.5.4s0 1-.1 1.6z"/></svg>',
    tg: '<svg viewBox="0 0 24 24"><path d="M21.5 4.3L18.4 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.6 13 2 11.6c-1-.3-1-1 .2-1.5L20.2 3.2c.8-.3 1.6.2 1.3 1.1z"/></svg>',
  };
  const items = [
    { cls: 'phone', label: 'Позвонить', href: `tel:${DATA.phoneMain.tel}`, icon: icons.phone },
    { cls: 'vk', label: 'Написать ВКонтакте', href: DATA.vkMessage, icon: icons.vk },
  ];
  if (DATA.whatsapp) items.push({ cls: 'wa', label: 'WhatsApp', href: DATA.whatsapp, icon: icons.wa });
  if (DATA.telegram) items.push({ cls: 'tg', label: 'Telegram', href: DATA.telegram, icon: icons.tg });
  if (DATA.max) items.push({ cls: 'max', label: 'MAX', href: DATA.max, icon: '' });
  $('#messengers').innerHTML = items.map((m) => `<a class="msg msg--${m.cls}" href="${m.href}"${m.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${m.icon}${m.label}</a>`).join('');
}

/* ---------- Часы ---------- */
function initClock() {
  const tick = () => {
    const d = new Date();
    const h = d.getHours() % 12, m = d.getMinutes();
    $('#clockH').style.transform = `rotate(${h * 30 + m * .5}deg)`;
    $('#clockM').style.transform = `rotate(${m * 6}deg)`;
    $('#clockNow').textContent = `сейчас ${String(d.getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 20000);
}

/* ---------- Галерея + лайтбокс ---------- */
function initGallery() {
  const track = $('#galleryTrack');
  track.innerHTML = DATA.photos.map((p, i) => `
    <figure class="shot" data-index="${i}"><img src="${p.src}" alt="${p.caption}" loading="lazy"><figcaption>${p.caption}</figcaption></figure>`).join('');
  $('#galleryTotal').textContent = String(DATA.photos.length).padStart(2, '0');

  const box = $('#lightbox');
  const img = $('img', box);
  const cap = $('.lightbox__caption', box);
  let idx = 0;
  const show = (i) => {
    idx = (i + DATA.photos.length) % DATA.photos.length;
    img.src = DATA.photos[idx].src;
    img.alt = DATA.photos[idx].caption;
    cap.textContent = `${DATA.photos[idx].caption} · ${idx + 1} / ${DATA.photos.length}`;
  };
  const open = (i) => { show(i); box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); };
  const close = () => { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
  track.addEventListener('click', (e) => {
    if (dragMoved) return;
    const s = e.target.closest('.shot');
    if (s) open(Number(s.dataset.index));
  });
  $('.lightbox__close', box).addEventListener('click', close);
  $('.lightbox__nav--prev', box).addEventListener('click', () => show(idx - 1));
  $('.lightbox__nav--next', box).addEventListener('click', () => show(idx + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let touchX = null;
  box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  initGallerySlider(track);
}

/* Слайдер: стрелки, перетаскивание мышью, свайп, полоса прокрутки, клавиатура */
let dragMoved = false;

function initGallerySlider(track) {
  const shots = $$('.shot', track);
  const prev = $('#galleryPrev');
  const next = $('#galleryNext');
  const bar = $('#galleryProgress');
  const thumb = $('#galleryThumb');
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const step = () => (shots[1] ? shots[1].offsetLeft - shots[0].offsetLeft : track.clientWidth * .8);

  // Индекс фото, которое сейчас первое в ряду
  const currentIndex = () => {
    const start = track.scrollLeft;
    let best = 0, bestD = Infinity;
    shots.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft - shots[0].offsetLeft - start);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };
  let tween = null, targetIdx = 0;
  const base = () => (tween ? targetIdx : currentIndex());
  const goTo = (i) => {
    const target = Math.max(0, Math.min(shots.length - 1, i));
    targetIdx = target;
    const left = Math.min(maxScroll(), shots[target].offsetLeft - shots[0].offsetLeft);
    if (!hasGsap || reduceMotion) { track.scrollLeft = left; return; }
    if (tween) tween.kill();
    track.style.scrollSnapType = 'none';
    tween = gsap.to(track, {
      scrollLeft: left, duration: .8, ease: 'power3.out',
      onComplete: () => { track.style.scrollSnapType = ''; tween = null; },
    });
  };

  const update = () => {
    const max = maxScroll();
    const p = max > 0 ? track.scrollLeft / max : 0;
    const barW = bar.clientWidth;
    const thumbW = Math.max(40, barW * (track.clientWidth / track.scrollWidth));
    thumb.style.width = thumbW + 'px';
    thumb.style.transform = `translateX(${p * (barW - thumbW)}px)`;
    bar.setAttribute('aria-valuenow', Math.round(p * 100));
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
    const n = track.scrollLeft >= max - 2 ? shots.length : currentIndex() + 1;
    $('#galleryNum').textContent = String(n).padStart(2, '0');
  };

  prev.addEventListener('click', () => goTo(base() - 1));
  next.addEventListener('click', () => goTo(base() + 1));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  shots.forEach((s) => $('img', s).addEventListener('load', update));
  update();

  // Горизонтальный жест тачпада и Shift+колесо листают ленту, а не страницу
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.stopPropagation(); return; }
    if (e.shiftKey && e.deltaY) {
      e.preventDefault(); e.stopPropagation();
      track.style.scrollSnapType = 'none'; track.style.scrollBehavior = 'auto';
      track.scrollLeft += e.deltaY;
      clearTimeout(track._snapT);
      track._snapT = setTimeout(() => { track.style.scrollSnapType = ''; track.style.scrollBehavior = ''; goTo(Math.round(track.scrollLeft / step())); }, 160);
    }
  }, { passive: false });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(base() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(base() - 1); }
  });

  // Перетаскивание ленты мышью (на тач-экранах работает родной свайп)
  let startX = 0, startScroll = 0, dragging = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (tween) { tween.kill(); tween = null; track.style.scrollSnapType = ''; }
    dragging = true; dragMoved = false;
    startX = e.clientX; startScroll = track.scrollLeft;
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (e.buttons === 0) { dragging = false; return; }
    const dx = e.clientX - startX;
    if (!dragMoved && Math.abs(dx) > 5) { dragMoved = true; track.classList.add('is-dragging'); track.setPointerCapture(e.pointerId); }
    if (dragMoved) track.scrollLeft = startScroll - dx;
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
    if (dragMoved) {
      const dx = e.clientX - startX;
      track.classList.remove('is-dragging');
      // Докручиваем к фото по направлению жеста
      const pos = track.scrollLeft / step();
      goTo(Math.abs(dx) < 40 ? Math.round(pos) : dx < 0 ? Math.ceil(pos) : Math.floor(pos));
      setTimeout(() => { dragMoved = false; }, 50);
    }
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // Полоса прокрутки: клик — перейти, перетаскивание — листать
  let barDrag = false, grabOffset = 0;
  const seek = (clientX) => {
    const r = bar.getBoundingClientRect();
    const thumbW = thumb.offsetWidth;
    const p = Math.max(0, Math.min(1, (clientX - r.left - grabOffset) / (r.width - thumbW)));
    track.scrollLeft = p * maxScroll();
  };
  bar.addEventListener('pointerdown', (e) => {
    barDrag = true;
    bar.setPointerCapture(e.pointerId);
    bar.classList.add('is-dragging');
    track.classList.add('is-dragging');
    const tr = thumb.getBoundingClientRect();
    grabOffset = e.target === thumb ? e.clientX - tr.left : thumb.offsetWidth / 2;
    seek(e.clientX);
  });
  bar.addEventListener('pointermove', (e) => { if (barDrag) seek(e.clientX); });
  const endBar = () => {
    if (!barDrag) return;
    barDrag = false;
    bar.classList.remove('is-dragging');
    track.classList.remove('is-dragging');
    goTo(currentIndex());
  };
  bar.addEventListener('pointerup', endBar);
  bar.addEventListener('pointercancel', endBar);
  bar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(base() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(base() - 1); }
  });
}

/* ---------- Пар и искры в hero ---------- */
function initSteam() {
  const canvas = $('#steam');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, puffs = [], sparks = [], running = true, raf;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const newPuff = (initial) => ({
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + 100,
    r: 80 + Math.random() * 160,
    vy: .25 + Math.random() * .45,
    vx: (Math.random() - .5) * .2,
    a: 0, max: .05 + Math.random() * .07,
    phase: Math.random() * Math.PI * 2,
  });
  const newSpark = () => ({
    x: w * (.25 + Math.random() * .75), y: h + 10,
    vy: .6 + Math.random() * 1.4, vx: (Math.random() - .5) * .6,
    r: .6 + Math.random() * 1.6, life: 0, ttl: 200 + Math.random() * 260,
    phase: Math.random() * 10,
  });

  resize();
  const count = w < 700 ? 12 : 22;
  for (let i = 0; i < count; i++) puffs.push(newPuff(true));

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of puffs) {
      p.y -= p.vy; p.phase += .006;
      p.x += p.vx + Math.sin(p.phase) * .35;
      const fadeTop = Math.min(1, p.y / (h * .5));
      p.a = Math.min(p.max, p.a + .0015) * Math.max(0, fadeTop) + (1 - Math.max(0, fadeTop)) * 0;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(255,236,214,${p.a})`);
      g.addColorStop(1, 'rgba(255,236,214,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      if (p.y + p.r < 0) Object.assign(p, newPuff(false));
    }
    if (sparks.length < (w < 700 ? 18 : 40) && Math.random() < .35) sparks.push(newSpark());
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life++; s.y -= s.vy; s.phase += .08;
      s.x += s.vx + Math.sin(s.phase) * .4;
      const k = 1 - s.life / s.ttl;
      if (k <= 0) { sparks.splice(i, 1); continue; }
      const flicker = .6 + Math.sin(s.phase * 3) * .4;
      ctx.fillStyle = `rgba(255,${150 + Math.floor(70 * k)},70,${k * flicker})`;
      ctx.shadowColor = 'rgba(255,140,50,.9)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (running) raf = requestAnimationFrame(draw);
  };
  draw();

  window.addEventListener('resize', resize);
  new IntersectionObserver(([e]) => {
    const vis = e.isIntersecting;
    if (vis && !running) { running = true; draw(); }
    if (!vis) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
}

/* ---------- Шапка, меню, якоря ---------- */
let lenis = null;

function initHeader() {
  const header = $('#header');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    $('.fab').classList.toggle('is-visible', y > window.innerHeight * .7);
    const menuOpen = $('#mobileMenu').classList.contains('is-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 500 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger');
  const menu = $('#mobileMenu');
  const toggle = (open) => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle(!menu.classList.contains('is-open')));

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    toggle(false);
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  }));

  // Подсветка активного пункта меню
  const links = $$('.nav a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'houses', 'prices', 'gallery', 'reviews', 'contacts'].forEach((id) => { const s = $('#' + id); if (s) io.observe(s); });
}

/* ---------- Анимации (GSAP) ---------- */
function splitHeadings() {
  $$('[data-split]').forEach((el) => {
    const html = el.innerHTML.replace(/&nbsp;/g, ' ');
    const words = html.split(/(\s+)/);
    el.innerHTML = words.map((w) => (/^\s+$/.test(w) ? ' ' : `<span class="w"><span>${w}</span></span>`)).join('');
  });
}

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const dec = Number(el.dataset.decimals || 0);
  const write = (v) => { el.textContent = dec ? v.toFixed(dec).replace('.', ',') : fmt(v); };
  if (!hasGsap || reduceMotion) return write(target);
  const o = { v: 0 };
  gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => write(o.v) });
}

function initAnimations() {
  // Без GSAP — показываем всё сразу
  if (!hasGsap || !window.ScrollTrigger || reduceMotion) {
    $$('[data-count]').forEach(countUp);
    $$('[data-stars]').forEach((s) => { s.style.width = (parseFloat(s.dataset.stars) / 5) * 100 + '%'; });
    return;
  }

  // Плавный скролл
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Заголовки по словам
  splitHeadings();
  $$('[data-split]').forEach((el) => {
    gsap.from($$('.w > span', el), {
      yPercent: 110, rotate: 4, duration: 1.1, ease: 'power4.out', stagger: .06,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Появление блоков
  gsap.set('[data-reveal]', { opacity: 0, y: 50 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .1, overwrite: true }),
  });

  // Счётчики и звёзды
  $$('[data-count]').forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));
  $$('[data-stars]').forEach((s) => ScrollTrigger.create({
    trigger: s, start: 'top 90%', once: true,
    onEnter: () => { s.style.width = (parseFloat(s.dataset.stars) / 5) * 100 + '%'; },
  }));

  // Название в подвале: буквы поднимаются по очереди
  gsap.from('.footer__word span', {
    yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .06,
    scrollTrigger: { trigger: '.footer', start: 'top 85%' },
  });

  // Параллакс фото
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Hero: параллакс фона и уход контента
  gsap.to('.hero__bg img', { yPercent: 14, scale: 1.16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__inner', { yPercent: 18, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Hero: буквы реагируют на мышь
  const letters = $$('.hero__word span');
  if (window.matchMedia('(pointer: fine)').matches) {
    $('.hero').addEventListener('mousemove', (e) => {
      const cx = e.clientX / window.innerWidth - .5;
      const cy = e.clientY / window.innerHeight - .5;
      letters.forEach((l, i) => {
        const k = (i - (letters.length - 1) / 2) / letters.length;
        gsap.to(l, { x: cx * 30 * (1 + k), y: cy * 18 * (1 - Math.abs(k)), duration: 1.2, ease: 'power3.out' });
      });
      gsap.to('.hero__bg', { x: cx * -24, y: cy * -14, duration: 1.6, ease: 'power3.out' });
    });
  }


  // Картинки догрузились — пересчитать размеры
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* ---------- Вступление hero ---------- */
function heroIntro() {
  const pre = $('#preloader');
  if (!hasGsap || reduceMotion) { pre.style.display = 'none'; return; }
  const tl = gsap.timeline({ delay: .35 });
  tl.to('.preloader__word', { letterSpacing: '.6em', opacity: 0, duration: .7, ease: 'power3.in' })
    .to(pre, { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '-=.2')
    .set(pre, { display: 'none' })
    .from('.hero__bg img', { scale: 1.3, duration: 2.2, ease: 'power3.out' }, '-=.9')
    .from('.hero__word span', { yPercent: 105, opacity: 0, duration: 1.3, ease: 'power4.out', stagger: .07 }, '-=1.8')
    .from('[data-hero]', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1 }, '-=1.1')
    .from('.header', { y: -30, opacity: 0, duration: .8, ease: 'power3.out' }, '-=1');
}

/* ---------- Магнитные кнопки ---------- */
function initMagnetic() {
  if (!hasGsap || !window.matchMedia('(pointer: fine)').matches) return;
  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)' }));
  });
}

/* ---------- Старт ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  initPrices();
  initCalc();
  initReviews();
  initMessengers();
  initClock();
  initGallery();
  initHeader();
  initAnimations();
  initSteam();
  initMagnetic();
  heroIntro();
});
