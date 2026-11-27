const storageKey = "boombala-demo-events";
const views = Object.fromEntries(["list", "new", "ready", "dashboard"].map((name) => [name, document.querySelector(`#${name}-view`)]));
const form = document.querySelector("#event-form");
const steps = [...document.querySelectorAll(".step")];
const previewTemplate = document.querySelector("#preview-template");
document.querySelectorAll(".preview-slot").forEach((slot) => slot.append(previewTemplate.content.cloneNode(true)));
let events = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
let current;
let step = 0;
let previewPhoto = "";
let selectedRoom = "Roblox Room";
const labels = ["Выберите комнату", "Именинник", "Когда праздник?", "Гости и связь"];
const roomNames = { roblox: "Roblox Room", ice: "Ice Room", magic: "Magic Room", rapunzel: "Rapunzel Room" };

function show(view) {
  Object.entries(views).forEach(([name, node]) => { node.hidden = name !== view; });
  window.scrollTo(0, 0);
}
function make(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function pageUrl(event) {
  const url = new URL("index.html", location.href);
  url.searchParams.set("demo", event.id);
  return url.href;
}
function dateValue(value) {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return "";
  return `${year}-${month}-${day}`;
}
function readableDate(value) {
  if (!value) return "Дата праздника";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}
function updatePreview() {
  const name = form.elements.name.value.trim() || "Имя ребёнка";
  const age = form.elements.age.value;
  const date = dateValue(form.elements.date.value);
  const time = form.elements.time.value.trim();
  document.querySelectorAll(".preview-name").forEach((node) => { node.textContent = name; });
  const ageWord = { one: "год", few: "года", many: "лет", other: "лет" }[new Intl.PluralRules("ru-RU").select(Number(age))];
  document.querySelectorAll(".preview-age").forEach((node) => { node.textContent = age ? `Исполняется ${age} ${ageWord}` : "Возраст"; });
  document.querySelectorAll(".preview-date strong").forEach((node) => { node.textContent = date ? `${readableDate(date)}${time ? ` · ${time}` : ""}` : "Укажите дату"; });
  document.querySelectorAll(".preview-room").forEach((node) => { node.textContent = selectedRoom.toUpperCase(); });
  document.querySelectorAll(".preview-avatar, #upload-avatar").forEach((node) => {
    node.replaceChildren();
    if (previewPhoto) { const img = document.createElement("img"); img.src = previewPhoto; img.alt = ""; node.append(img); }
    else { const img = document.createElement("img"); img.src = "assets/flaticon/profile.png"; img.alt = ""; img.className = "default-avatar"; node.append(img); }
  });
}
function selectRoom(room) {
  selectedRoom = room;
  document.querySelectorAll(".room-option").forEach((button) => {
    const selected = button.dataset.room === room;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector(".room-check")?.remove();
    if (selected) button.append(make("span", "✓", "room-check"));
  });
  updatePreview();
}
function setStep(value) {
  step = value;
  steps.forEach((node, index) => { node.hidden = index !== step; });
  document.querySelector("#step-label").textContent = labels[step];
  document.querySelector("#step-number").textContent = `${step + 1} / 4`;
  document.querySelector("#progress-fill").style.width = `${(step + 1) * 25}%`;
  document.querySelector("#previous-step").hidden = step === 0;
  document.querySelector("#next-step").hidden = step === 3;
  document.querySelector("#submit-event").hidden = step !== 3;
  window.scrollTo(0, 0);
}
function error(name, message) {
  document.querySelector(`#${name}-error`).textContent = message;
  if (form.elements[name]) form.elements[name].setAttribute("aria-invalid", String(Boolean(message)));
  return Boolean(message);
}
function validateStep(index) {
  let invalid = false;
  if (index === 1) {
    invalid = error("name", form.elements.name.value.trim() ? "" : "Введите имя именинника.") || invalid;
    const age = Number(form.elements.age.value);
    invalid = error("age", Number.isInteger(age) && age >= 1 && age <= 18 ? "" : "Укажите возраст от 1 до 18 лет.") || invalid;
    invalid = error("photo", form.elements.photo.files[0]?.size > 1048576 ? "Выберите изображение до 1 МБ." : "") || invalid;
  }
  if (index === 2) {
    invalid = error("date", dateValue(form.elements.date.value) ? "" : "Введите дату в формате ДД.ММ.ГГГГ.") || invalid;
    invalid = error("time", /^([01]\d|2[0-3]):[0-5]\d$/.test(form.elements.time.value.trim()) ? "" : "Введите время в формате ЧЧ:ММ.") || invalid;
  }
  if (index === 3) {
    const phone = form.elements.phone.value.trim();
    invalid = error("phone", !phone || /^\+?[\d ()-]{8,20}$/.test(phone) ? "" : "Проверьте номер WhatsApp.") || invalid;
    const capacity = form.elements.capacity.value;
    invalid = error("capacity", !capacity || (Number.isInteger(Number(capacity)) && Number(capacity) >= 1 && Number(capacity) <= 500) ? "" : "Укажите число от 1 до 500.") || invalid;
    const days = Number(form.elements.days.value);
    invalid = error("days", Number.isInteger(days) && days >= 1 && days <= 365 ? "" : "Укажите число от 1 до 365.") || invalid;
    invalid = error("voice", form.elements.voice.files[0]?.size > 1048576 ? "Выберите аудио до 1 МБ." : "") || invalid;
    if (invalid && (document.querySelector("#capacity-error").textContent || document.querySelector("#days-error").textContent || document.querySelector("#voice-error").textContent)) document.querySelector(".extra").open = true;
  }
  return !invalid;
}
function fileData(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.size) { resolve(""); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}
function summary(event) {
  const yes = event.responses.filter((response) => response.status === "yes");
  const no = event.responses.filter((response) => response.status === "no");
  const answered = new Set(event.responses.map((response) => response.child.toLocaleLowerCase("ru")));
  const waiting = event.guests.filter((name) => !answered.has(name.toLocaleLowerCase("ru")));
  return { yes, no, waiting };
}
function renderList() {
  const list = document.querySelector("#event-list");
  list.replaceChildren();
  if (!events.length) {
    const box = make("div", "", "empty");
    box.append(make("div", "✦", "empty-icon"), make("h2", "Создайте первый демо-праздник."), make("p", "Здесь появятся ваши приглашения."));
    list.append(box);
  }
  events.forEach((event) => {
    const card = make("article", "", "event-card");
    const top = make("div", "", "event-top");
    const avatar = make("div", event.name.slice(0, 1), "event-avatar");
    if (event.photo) { const img = document.createElement("img"); img.src = event.photo; img.alt = ""; avatar.replaceChildren(img); }
    const identity = make("div", "");
    identity.append(make("strong", event.name), make("small", `${readableDate(event.date)} · ${event.time}`));
    top.append(avatar, identity, make("span", event.room || "Roblox Room", "event-pill"));
    const footer = make("div", "", "event-footer");
    const open = make("button", "Открыть ответы →"); open.type = "button"; open.onclick = () => openDashboard(event);
    footer.append(make("span", `Ответов: ${event.responses.length}`), open);
    card.append(top, footer); list.append(card);
  });
  show("list");
}
function openDashboard(event) {
  current = event;
  document.querySelector("#event-title").textContent = event.name;
  document.querySelector("#event-meta").textContent = `${event.room || "Roblox Room"} · ${readableDate(event.date)} · ${event.time}`;
  document.querySelector("#open-invitation").href = pageUrl(event);
  document.querySelector("#link-note").textContent = "Демо-ссылка работает только в этой вкладке.";
  const { yes, no, waiting } = summary(event);
  const stats = document.querySelector("#stats"); stats.replaceChildren();
  [["Придут", yes.length], ["Не придут", no.length], ["Не ответили", waiting.length], ["Детей", yes.reduce((sum, r) => sum + r.kids, 0)], ["Взрослых", yes.reduce((sum, r) => sum + r.adults, 0)]].forEach(([label, value]) => { const box = make("div", "", "stat"); box.append(make("strong", String(value)), make("span", label)); stats.append(box); });
  const responses = document.querySelector("#responses"); responses.replaceChildren();
  if (!event.responses.length) responses.append(make("p", "Пока нет ответов.", "hint"));
  event.responses.forEach((response) => {
    const row = make("div", "", "response"); const info = make("div", "");
    info.append(make("strong", response.child), make("small", `Детей: ${response.kids} · Взрослых: ${response.adults}`));
    row.append(info, make("span", response.status === "yes" ? "Придёт" : "Не придёт", response.status === "yes" ? "status" : "status no")); responses.append(row);
  });
  document.querySelector("#unanswered").textContent = waiting.join(", ") || "Нет гостей без ответа.";
  show("dashboard");
}
function openReady(event) {
  current = event;
  document.querySelector("#ready-subtitle").textContent = `Праздник ${event.name} · ${event.room || "Roblox Room"}`;
  document.querySelector("#ready-link").textContent = pageUrl(event);
  document.querySelector("#ready-open").href = pageUrl(event);
  document.querySelector("#ready-note").textContent = "Демо-ссылка работает только в этой вкладке.";
  show("ready");
}
async function copyLink(note) {
  try { await navigator.clipboard.writeText(pageUrl(current)); note.textContent = "Демо-ссылка скопирована. Действует только в этой вкладке."; }
  catch { note.textContent = pageUrl(current); }
}
document.querySelector("#new-event").addEventListener("click", () => {
  form.reset();
  form.querySelectorAll(".error").forEach((node) => { node.textContent = ""; });
  form.querySelectorAll('[aria-invalid]').forEach((node) => node.removeAttribute("aria-invalid"));
  document.querySelector(".extra").open = false;
  document.querySelector("#voice-name").textContent = "Аудио до 1 МБ";
  previewPhoto = "";
  document.querySelector("#remove-photo").hidden = true;
  selectRoom("Roblox Room"); setStep(0); show("new");
});
document.querySelectorAll(".room-option").forEach((button) => button.addEventListener("click", () => selectRoom(button.dataset.room)));
document.querySelectorAll('[data-view="list"]').forEach((button) => button.addEventListener("click", renderList));
document.querySelector("#previous-step").addEventListener("click", () => setStep(step - 1));
document.querySelector("#next-step").addEventListener("click", () => { if (validateStep(step)) setStep(step + 1); });
document.querySelector("#age-minus").addEventListener("click", () => { form.elements.age.value = Math.max(1, Number(form.elements.age.value || 2) - 1); updatePreview(); });
document.querySelector("#age-plus").addEventListener("click", () => { form.elements.age.value = Math.min(18, Number(form.elements.age.value || 0) + 1); updatePreview(); });
form.addEventListener("input", updatePreview);
form.elements.photo.addEventListener("change", async () => {
  const file = form.elements.photo.files[0];
  if (!file) return;
  if (file.size > 1048576 || !file.type.startsWith("image/")) { error("photo", "Выберите изображение до 1 МБ."); form.elements.photo.value = ""; return; }
  error("photo", ""); previewPhoto = await fileData(file); document.querySelector("#remove-photo").hidden = false; updatePreview();
});
document.querySelector("#remove-photo").addEventListener("click", () => { form.elements.photo.value = ""; previewPhoto = ""; document.querySelector("#remove-photo").hidden = true; updatePreview(); });
form.elements.voice.addEventListener("change", () => { const file = form.elements.voice.files[0]; error("voice", file?.size > 1048576 ? "Выберите аудио до 1 МБ." : ""); document.querySelector("#voice-name").textContent = file ? file.name : "Аудио до 1 МБ"; });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateStep(3)) return;
  const submit = document.querySelector("#submit-event"); submit.disabled = true; submit.textContent = "Создаём…";
  try {
    const item = { id: crypto.randomUUID(), room: selectedRoom, name: form.elements.name.value.trim(), age: form.elements.age.value, date: dateValue(form.elements.date.value), time: form.elements.time.value.trim(), phone: form.elements.phone.value.trim(), capacity: form.elements.capacity.value, days: Number(form.elements.days.value), promo: form.elements.promo.value.trim(), guests: form.elements.guests.value.split(",").map((value) => value.trim()).filter(Boolean), photo: await fileData(form.elements.photo.files[0]), voice: await fileData(form.elements.voice.files[0]), responses: [] };
    events.push(item);
    try { sessionStorage.setItem(storageKey, JSON.stringify(events)); }
    catch { events.pop(); throw new Error("Не удалось сохранить демо. Попробуйте файлы меньшего размера."); }
    openReady(item);
  } catch (failure) { document.querySelector("#form-error").textContent = failure.message; }
  finally { submit.disabled = false; submit.textContent = "Создать приглашение →"; }
});
document.querySelector("#ready-dashboard").addEventListener("click", () => openDashboard(current));
document.querySelector("#ready-copy").addEventListener("click", () => copyLink(document.querySelector("#ready-note")));
document.querySelector("#copy-link").addEventListener("click", () => copyLink(document.querySelector("#link-note")));
document.querySelector("#export").addEventListener("click", () => {
  const rows = [["Статус", "Ребёнок", "Дети", "Взрослые"], ...current.responses.map((r) => [r.status === "yes" ? "Придёт" : "Не придёт", r.child, r.kids, r.adults])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "boombala-demo.csv"; link.click(); URL.revokeObjectURL(url);
});
const selected = events.find((event) => event.id === new URLSearchParams(location.search).get("demo"));
const chosenRoom = roomNames[new URLSearchParams(location.search).get("room")];
if (selected) openDashboard(selected);
else if (chosenRoom) { selectRoom(chosenRoom); setStep(1); show("new"); }
else renderList();
