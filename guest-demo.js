(() => {
  const params = new URLSearchParams(location.search);
  const id = params.get("demo");
  const isPreview = !id && ["roblox", "ice", "magic", "rapunzel"].includes(params.get("preview"));
  if (!id && !isPreview) return;
  const events = JSON.parse(sessionStorage.getItem("boombala-demo-events") || "[]");
  const event = isPreview ? { responses: [], phone: "" } : events.find((item) => item.id === id);
  const studio = document.querySelector(".studio");
  if (!event) {
    studio.replaceChildren();
    const message = document.createElement("p");
    message.textContent = "Это демо-приглашение доступно только в той вкладке, где его создали.";
    message.style.cssText = "padding:40px;font:18px system-ui";
    studio.append(message);
    return;
  }
  const end = new Date(`${event.date}T${event.time}:00+05:00`).getTime() + event.days * 86400000;
  if (!isPreview && Date.now() >= end) {
    events.splice(events.indexOf(event), 1);
    sessionStorage.setItem("boombala-demo-events", JSON.stringify(events));
    studio.replaceChildren();
    const message = document.createElement("p"); message.textContent = "Праздник завершён. Демо-приглашение больше недоступно."; message.style.cssText = "padding:40px;font:18px system-ui"; studio.append(message);
    return;
  }
  const nextDay = new Date(`${event.date}T00:00:00+05:00`).getTime() + 86400000;
  if (!isPreview && Date.now() >= nextDay) {
    studio.replaceChildren();
    const page = document.createElement("main");
    page.style.cssText = "max-width:600px;margin:40px auto;padding:24px;font:18px system-ui;text-align:center";
    const title = document.createElement("h1"); title.textContent = "Спасибо, что были с нами!"; page.append(title);
    const message = document.createElement("p"); message.textContent = `Праздник ${event.name} закончился. До новых встреч в Boom Bala!`; page.append(message);
    if (event.photo) { const photo = document.createElement("img"); photo.src = event.photo; photo.alt = "Фото именинника"; photo.style.cssText = "max-width:100%;max-height:360px;border-radius:20px"; page.append(photo); }
    if (event.promo) { const promo = document.createElement("p"); promo.textContent = `Промокод: ${event.promo}`; page.append(promo); }
    studio.append(page);
    return;
  }
  const form = document.querySelector("#invite-form");
  if (!isPreview) {
    form.elements.childName.value = event.name;
    form.elements.childAge.value = event.age;
    form.elements.eventDate.value = event.date;
    form.elements.eventTime.value = event.time;
    form.elements.organizerPhone.value = event.phone;
    const room = { "Roblox Room": "roblox", "Ice Room": "ice", "Magic Room": "magic", "Rapunzel Room": "rapunzel" }[event.room] || "roblox";
    document.querySelector(`.room-card[data-room="${room}"]`).click();
    document.querySelector(".workspace-nav").style.display = "none";
    document.querySelector(".editor-panel").hidden = true;
    document.querySelector("#guest-back").hidden = true;
    if (event.photo) document.querySelector("#preview-photo").src = event.photo;
    else { document.querySelector("#preview-photo").hidden = true; document.querySelector("#photo-empty").hidden = false; document.querySelector("#photo-empty small").hidden = true; }
  }
  if (event.voice) {
    const audio = document.createElement("audio"); audio.controls = true; audio.src = event.voice; audio.setAttribute("aria-label", "Голосовое приглашение");
    document.querySelector(".message-section div").append(audio);
  } else if (isPreview) {
    const hint = document.createElement("p");
    hint.className = "voice-preview-note";
    hint.textContent = "Голосовое появится после загрузки записи.";
    document.querySelector(".message-section div").append(hint);
  }
  const section = document.querySelector(".rsvp-section");
  const original = document.createElement("div");
  original.hidden = true;
  while (section.firstChild) original.append(section.firstChild);
  section.setAttribute("aria-labelledby", "demo-rsvp-title");
  section.innerHTML = `<h3 id="demo-rsvp-title">Ты придёшь?</h3><p id="demo-guest-question"></p><div class="demo-rsvp-actions"><button type="button" data-status="yes">Приду ✓</button><button type="button" data-status="no">Не смогу прийти</button></div><p class="demo-rsvp-result" role="status"></p><dialog class="demo-rsvp-dialog" aria-labelledby="demo-dialog-title"><form id="demo-rsvp" class="demo-rsvp"><h3 id="demo-dialog-title">Кто придёт?</h3><div id="demo-counts"><label>Количество детей<input name="kids" type="number" min="0" max="20" value="1" required></label><label>Количество взрослых<input name="adults" type="number" min="0" max="20" value="1" required></label></div><div class="demo-rsvp-actions"><button type="submit">Отправить ответ</button><button type="button" id="demo-rsvp-cancel">Отмена</button></div></form></dialog><p class="demo-disclaimer">Демо: ответ сохраняется только в этой вкладке и никому не отправляется.</p>`;
  section.append(original);
  if (isPreview) section.querySelector(".demo-disclaimer").textContent = "Демо: ответ никуда не отправляется.";
  const rsvp = section.querySelector("form");
  const dialog = section.querySelector("dialog");
  const counts = section.querySelector("#demo-counts");
  let guestName = isPreview ? "Гость" : "";
  let status = "";
  if (isPreview) document.querySelector("#demo-guest-question").textContent = "Гость, получится прийти на праздник?";
  const gateForm = document.querySelector("#guest-gate-form");
  gateForm.addEventListener("submit", () => {
    guestName = document.querySelector("#guest-name").value.trim();
    document.querySelector("#demo-guest-question").textContent = `${guestName}, получится прийти на праздник?`;
  });
  section.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
    status = button.dataset.status;
    counts.hidden = status === "no";
    document.querySelector("#demo-dialog-title").textContent = status === "yes" ? "Сколько вас придёт?" : "Не получится прийти?";
    dialog.showModal();
  }));
  document.querySelector("#demo-rsvp-cancel").addEventListener("click", () => dialog.close());
  rsvp.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const result = section.querySelector(".demo-rsvp-result");
    const response = { status, child: guestName, kids: status === "yes" ? Number(rsvp.elements.kids.value) : 0, adults: status === "yes" ? Number(rsvp.elements.adults.value) : 0 };
    if (!isPreview) {
      event.responses.push(response);
      try { sessionStorage.setItem("boombala-demo-events", JSON.stringify(events)); } catch { event.responses.pop(); result.textContent = "Не удалось сохранить демо-ответ в этой вкладке."; return; }
    }
    dialog.close();
    result.textContent = isPreview ? "Спасибо! Это пример ответа, он никуда не отправлен." : "Демо-ответ записан. Его можно посмотреть в панели организатора.";
    const organizer = event.phone.replace(/\D/g, "");
    if (organizer.length >= 10 && organizer.length <= 15) { const link = document.createElement("a"); link.href = `https://wa.me/${organizer}?text=${encodeURIComponent(`${response.child}: ${response.status === "yes" ? "придёт" : "не сможет прийти"} на праздник.`)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Написать организатору в WhatsApp ↗"; result.append(document.createElement("br"), link); }
  });
})();
