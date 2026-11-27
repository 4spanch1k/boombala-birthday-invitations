const form = document.querySelector("#invite-form");
const photoInput = document.querySelector("#child-photo");
const photoStatus = document.querySelector("#photo-status");
const clearPhotoButton = document.querySelector("#clear-photo");
const previewPhoto = document.querySelector("#preview-photo");
const photoEmpty = document.querySelector("#photo-empty");

let photoUrl = "";
let guestName = "";

function displayDate(value) {
  if (!value) return "Дата праздника";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function updatePreview() {
  const name = form.elements.childName.value.trim();
  const age = form.elements.childAge.value.trim();
  const time = form.elements.eventTime.value;
  const place = form.elements.eventPlace.value.trim();
  const address = form.elements.eventAddress.value.trim();
  const message = form.elements.eventMessage.value.trim();
  const ageForm = new Intl.PluralRules("ru-RU").select(Number(age));
  const ageWords = { one: "год", few: "года", many: "лет", other: "лет" };

  const previewName = document.querySelector("#preview-name");
  previewName.textContent = name || "Имя именинника";
  previewName.classList.toggle("is-long", previewName.textContent.length > 12);
  document.querySelector("#age-label").hidden = !age;
  document.querySelector("#preview-age").textContent = age
    ? `${age} ${ageWords[ageForm]}`
    : "Скоро день рождения";
  document.querySelector("#preview-age").classList.toggle("age-unknown", !age);
  const date = displayDate(form.elements.eventDate.value);
  document.querySelector("#preview-date").textContent = date;
  document.querySelector("#preview-time").textContent = time || "Время праздника";
  document.querySelector("#hero-date").textContent = date;
  document.querySelector("#hero-time").textContent = time || "Время праздника";
  document.querySelector("#preview-place").textContent = place || "Комната BoomBala";
  const locationMap = document.querySelector("#location-map");
  const defaultAddress = form.elements.eventAddress.defaultValue;
  locationMap.href = !address || address === defaultAddress
    ? "https://go.2gis.com/6zqEx"
    : `https://2gis.kz/almaty/search/${encodeURIComponent(address)}`;
  document.querySelector("#preview-message").textContent = message || "Ждём тебя на празднике!";

  const selectedActivities = [...form.querySelectorAll('input[name="activity"]:checked')].map((input) => input.value);
  document.querySelectorAll(".program-item").forEach((item) => {
    item.hidden = !selectedActivities.includes(item.dataset.activity);
    if (item.hidden) item.open = false;
  });
  document.querySelector(".party-program").hidden = selectedActivities.length === 0;

  const phone = form.elements.organizerPhone.value.replace(/\D/g, "");
  const rsvpLink = document.querySelector("#rsvp-link");
  const hasPhone = phone.length >= 8 && phone.length <= 15;
  rsvpLink.hidden = !hasPhone;
  const declineLink = document.querySelector("#rsvp-decline");
  declineLink.hidden = !hasPhone;
  document.querySelector("#rsvp-question").textContent = guestName ? `${guestName}, получится прийти на праздник?` : "Сообщи организатору, получится ли прийти.";
  document.querySelector("#rsvp-hint").hidden = hasPhone;
  if (hasPhone) {
    const reply = `Здравствуйте! ${guestName || "Гость"} придёт на праздник ${name || "именинника"}.`;
    const decline = `Здравствуйте! ${guestName || "Гость"} не сможет прийти на праздник ${name || "именинника"}.`;
    declineLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(decline)}`;
    rsvpLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(reply)}`;
  } else {
    rsvpLink.removeAttribute("href");
    declineLink.removeAttribute("href");
  }

  document.querySelector("#calendar-button").disabled = !form.elements.eventDate.value || !time;
  updateCountdown();
}

function updateCountdown() {
  const date = form.elements.eventDate.value;
  const time = form.elements.eventTime.value;
  const countdown = document.querySelector("#countdown");
  countdown.hidden = !date || !time;
  if (countdown.hidden) return;

  const remaining = new Date(`${date}T${time}:00+05:00`).getTime() - Date.now();
  const value = document.querySelector("#countdown-value");
  if (remaining <= 0) {
    value.textContent = "Праздник начался!";
    return;
  }
  const minutes = Math.floor(remaining / 60000);
  value.textContent = `${Math.floor(minutes / 1440)} д · ${Math.floor(minutes % 1440 / 60)} ч · ${minutes % 60} мин`;
}

document.querySelector("#calendar-button").addEventListener("click", () => {
  const date = form.elements.eventDate.value;
  const time = form.elements.eventTime.value;
  if (!date || !time) return;
  const start = new Date(`${date}T${time}:00+05:00`);
  if (Number.isNaN(start.getTime())) return;
  const escapeCalendar = (value) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const title = escapeCalendar(`День рождения: ${form.elements.childName.value.trim() || "праздник"}`);
  const location = escapeCalendar([form.elements.eventPlace.value.trim(), form.elements.eventAddress.value.trim()].filter(Boolean).join(", "));
  const stamp = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const created = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BoomBala//Birthday//RU",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@boombala`,
    `DTSTAMP:${created}`,
    `DTSTART:${stamp}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "boombala-birthday.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function removePhoto() {
  if (photoUrl) URL.revokeObjectURL(photoUrl);

  photoUrl = "";
  photoInput.value = "";
  previewPhoto.src = "assets/demo-hero.jpg";
  previewPhoto.alt = "Пример фото именинника";
  previewPhoto.hidden = false;
  photoEmpty.hidden = true;
  clearPhotoButton.disabled = true;
  photoStatus.textContent = "Фото показывается только в этом предпросмотре и не отправляется на сервер.";
}

form.addEventListener("input", updatePreview);
form.addEventListener("change", updatePreview);

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    removePhoto();
    photoStatus.textContent = "Выбери файл изображения.";
    return;
  }

  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = URL.createObjectURL(file);
  previewPhoto.src = photoUrl;
  previewPhoto.alt = "Фото именинника";
  previewPhoto.hidden = false;
  photoEmpty.hidden = true;
  clearPhotoButton.disabled = false;
  photoStatus.textContent = `${file.name} добавлено только в предпросмотр.`;
});

clearPhotoButton.addEventListener("click", removePhoto);
window.addEventListener("beforeunload", () => {
  if (photoUrl) URL.revokeObjectURL(photoUrl);
});

updatePreview();
setInterval(updateCountdown, 60000);

const programItems = document.querySelectorAll(".program-item");
let scrollRefreshFrame = 0;

function refreshScroll() {
  if (!window.ScrollTrigger) return;
  cancelAnimationFrame(scrollRefreshFrame);
  scrollRefreshFrame = requestAnimationFrame(() => window.ScrollTrigger.refresh());
}

function setProgramOpen(item, open) {
  const panel = item.querySelector(".program-panel");
  const content = item.querySelector(".program-detail");
  const animate = window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (window.gsap) window.gsap.killTweensOf([panel, content]);

  if (!animate) {
    delete item.dataset.closing;
    item.open = open;
    if (window.gsap) window.gsap.set([panel, content], { clearProps: "height,opacity,transform" });
    refreshScroll();
    return;
  }

  if (open) {
    const wasClosed = !item.open;
    delete item.dataset.closing;
    item.open = true;
    if (wasClosed) {
      window.gsap.set(panel, { height: 0 });
      window.gsap.set(content, { opacity: 0, y: 8 });
    }
    window.gsap.to(panel, {
      height: "auto",
      duration: 0.5,
      ease: "power2.inOut",
      clearProps: "height",
      onComplete: refreshScroll,
    });
    window.gsap.to(content, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", clearProps: "opacity,transform" });
    return;
  }

  item.dataset.closing = "true";
  window.gsap.to(panel, {
    height: 0,
    duration: 0.5,
    ease: "power2.inOut",
    onComplete: () => {
      item.open = false;
      delete item.dataset.closing;
      window.gsap.set([panel, content], { clearProps: "height,opacity,transform" });
      refreshScroll();
    },
  });
  window.gsap.to(content, { opacity: 0, duration: 0.3, ease: "power1.out" });
}

programItems.forEach((item) => {
  item.removeAttribute("name");
  item.querySelector("summary").addEventListener("click", (event) => {
    event.preventDefault();
    const open = !item.open || item.dataset.closing === "true";
    if (open) {
      programItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.open) setProgramOpen(otherItem, false);
      });
    }
    setProgramOpen(item, open);
  });
});

function startPreviewAnimations() {
  if (window.BalloonsJS && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.BalloonsJS.balloons();
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(".hero-copy > *", {
      y: 18,
      opacity: 0,
      duration: 0.55,
      stagger: 0.07,
      ease: "power2.out",
    });
    gsap.from(".photo-frame", { y: 18, opacity: 0, duration: 0.6, delay: 0.15, ease: "power2.out" });
    gsap.from(".player-info > *", { y: 12, opacity: 0, duration: 0.45, delay: 0.25, stagger: 0.08, ease: "power2.out" });
    gsap.from(".hero-sticker", { scale: 0.85, opacity: 0, duration: 0.5, delay: 0.35, ease: "back.out(1.4)" });

    document.querySelectorAll(".event-when, .event-address, .program-heading, .guest-info > div:first-child, .message-section blockquote, .invite-footer").forEach((element) => {
      gsap.from(element, {
        y: 24,
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
        scrollTrigger: { trigger: element, start: "top 92%", once: true },
      });
    });
  });
}

const roomSelection = document.querySelector("#room-selection");
const workspace = document.querySelector("#workspace");
const editorPanel = document.querySelector(".editor-panel");
const backToRooms = document.querySelector("#back-to-rooms");
const guestGate = document.querySelector("#guest-gate");
const guestInput = document.querySelector("#guest-name");
document.querySelector("#guest-back").addEventListener("click", () => {
  guestGate.hidden = true;
  workspace.inert = false;
  workspace.hidden = true;
  roomSelection.hidden = false;
  document.querySelector("#room-selection-title").focus({ preventScroll: true });
});
document.querySelector("#guest-gate-form").addEventListener("submit", (event) => {
  event.preventDefault();
  guestName = guestInput.value.trim();
  if (!guestName) { guestInput.focus(); return; }
  guestGate.hidden = true;
  workspace.inert = false;
  updatePreview();
  backToRooms.focus({ preventScroll: true });
});
let previewStarted = false;

const rooms = {
  roblox: { name: "Roblox", overline: "ТЫ ПОЛУЧИЛ ПРИГЛАШЕНИЕ", intro: "", programLabel: "ВПЕРЁД К ПРИКЛЮЧЕНИЯМ", programTitle: "Что будет<br>на празднике?", guestTitle: "Собираемся<br>на праздник!", guestLabel: "ПЕРЕД ВСТРЕЧЕЙ", title: "НОВЫЙ<br>УРОВЕНЬ!", art: "assets/roblox-quest-world.webp", artAlt: "Праздничный игровой мир", sticker: "LET’S<br>PLAY!", photoLabel: "PLAYER", map: "assets/game-map.webp" },
  ice: { name: "Ice", overline: "ПРИГЛАШЕНИЕ НА ДЕНЬ РОЖДЕНИЯ", intro: "Собирайся на праздник в снежном королевстве!", programLabel: "ЗИМНЯЯ ИСТОРИЯ", programTitle: "Что ждёт<br>на празднике?", guestTitle: "Собираемся<br>на встречу!", guestLabel: "ГОТОВИМСЯ К ПРАЗДНИКУ", title: "Снежный<br>праздник", art: "assets/ice-hero.webp", artAlt: "Зимний сказочный мир", sticker: "УРА!<br>ПРАЗДНИК!", photoLabel: "ИМЕНИННИК", map: "assets/ice-map.webp" },
  magic: { name: "Magic", overline: "ЭЙ, ПРИВЕТ! ТЕБЯ ПРИГЛАСИЛИ", intro: "Будем играть, смеяться и отмечать вместе!", programLabel: "ЗАГЛЯНЕМ ВНУТРЬ", programTitle: "Что будет<br>на празднике?", guestTitle: "Собираемся<br>на праздник!", guestLabel: "СОБИРАЙСЯ С НАМИ", title: "Праздник<br>монстриков!", art: "assets/magic-hero.webp", artAlt: "Волшебный город дружелюбных монстриков", sticker: "БУДЕТ<br>ВЕСЕЛО!", photoLabel: "ИМЕНИННИК", map: "assets/magic-map.webp" },
  rapunzel: { name: "Rapunzel", overline: "ОСОБЕННОЕ ПРИГЛАШЕНИЕ ДЛЯ ТЕБЯ", intro: "Тебя ждут на дне рождения в сказочном мире.", programLabel: "НАШ ПРАЗДНИК", programTitle: "Праздничная<br>история", guestTitle: "Что взять<br>с собой", guestLabel: "ДО ВСТРЕЧИ В СКАЗКЕ", title: "Однажды<br>в сказке...", art: "assets/rapunzel-hero.webp", artAlt: "Цветочный сказочный дворец с фонариками", sticker: "ЖДУ<br>ТЕБЯ!", photoLabel: "ИМЕНИННИК", map: "assets/rapunzel-map.webp" },
};

document.querySelectorAll(".room-card").forEach((button) => {
  button.addEventListener("click", () => {
    const params = new URLSearchParams(location.search);
    if (!params.has("demo") && params.get("preview") !== button.dataset.room) {
      location.href = `demo.html?room=${encodeURIComponent(button.dataset.room)}`;
      return;
    }
    const room = rooms[button.dataset.room];
    const isRoblox = button.dataset.room === "roblox";
    const roomName = `${room.name} Room`;
    const heroArt = document.querySelector(".hero-art");
    const roomImage = document.querySelector(".room-picture img");

    workspace.dataset.room = button.dataset.room;
    document.querySelector("#workspace-room").textContent = `${roomName.toUpperCase()} · ПРЕДПРОСМОТР`;
    document.querySelector(".editor-heading .eyebrow").textContent = `${roomName.toUpperCase()} · ДЕМО`;
    document.querySelector("#invite-title").innerHTML = room.title;
    document.querySelector(".hero-overline").textContent = room.overline;
    const heroIntro = document.querySelector(".hero-intro");
    heroIntro.textContent = room.intro;
    heroIntro.hidden = !room.intro;
    document.querySelector(".program-heading .section-label").textContent = room.programLabel;
    document.querySelector("#program-title").innerHTML = room.programTitle;
    document.querySelector("#guest-title").innerHTML = room.guestTitle;
    document.querySelector(".guest-info .section-label").textContent = room.guestLabel;
    heroArt.src = room.art;
    heroArt.alt = room.artAlt;
    document.querySelector(".hero-sticker").innerHTML = room.sticker;
    document.querySelector(".photo-frame figcaption").textContent = room.photoLabel;
    document.querySelector(".location-map img").src = room.map;
    roomImage.src = `assets/${button.dataset.room}-room.webp`;
    roomImage.alt = `Изображение ${roomName} с сайта BoomBala`;
    document.querySelector(".room-picture > span").textContent = roomName.toUpperCase();
    document.querySelector(".roblox-program").hidden = !isRoblox;
    document.querySelector(".room-program").hidden = isRoblox;
    document.querySelector(".program-note").hidden = isRoblox;
    document.querySelector(".editor-note").textContent = isRoblox
      ? "Пример MAGIC PARTY. Фото и данные можно заменить. Ссылка пока не создаётся."
      : "Демо приглашения. Уточните программу у организатора. Ссылка пока не создаётся.";
    form.elements.eventPlace.value = roomName;
    updatePreview();

    roomSelection.hidden = true;
    workspace.hidden = false;
    window.scrollTo(0, 0);
    if (!previewStarted) {
      startPreviewAnimations();
      previewStarted = true;
    } else {
      refreshScroll();
    }
    editorPanel.open = false;
    guestName = "";
    guestInput.value = "";
    guestGate.hidden = false;
    workspace.inert = true;
    guestInput.focus();
  });
});

backToRooms.addEventListener("click", () => {
  editorPanel.open = false;
  workspace.hidden = true;
  roomSelection.hidden = false;
  window.scrollTo(0, 0);
  document.querySelector("#room-selection-title").focus({ preventScroll: true });
});

editorPanel.addEventListener("toggle", (event) => {
  document.querySelector(".preview-panel").inert = event.target.open;
  document.querySelector(".workspace-nav").inert = event.target.open;
  document.body.style.overflow = event.target.open ? "hidden" : "";
  if (window.gsap && event.target.open && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.fromTo(".editor-content", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out", clearProps: "transform,opacity" });
  }
});

document.querySelector(".editor-done").addEventListener("click", () => {
  editorPanel.open = false;
  editorPanel.querySelector("summary").focus({ preventScroll: true });
});

const previewRoom = new URLSearchParams(location.search).get("preview");
if (Object.hasOwn(rooms, previewRoom)) {
  document.querySelector(`.room-card[data-room="${previewRoom}"]`).click();
  guestGate.hidden = true;
  workspace.inert = false;
  document.querySelector(".workspace-nav").style.display = "none";
  document.querySelector("#rsvp-hint").hidden = true;
  editorPanel.hidden = true;
}
