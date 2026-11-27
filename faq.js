/* FAQ-помощник Roblox Room. Изменяйте вопросы и ответы в массиве FAQ ниже. */
(() => {
  const FAQ = [
    {
      id: "time",
      question: "Во сколько начинается праздник и сколько он длится?",
      answer: (data) => `${data.date && data.time ? `Дата праздника — ${data.date}, начало в ${data.time}.` : "Дату и время уточни у организатора."} Продолжительность тоже можно уточнить у организатора.`,
      action: "contact",
    },
    {
      id: "place",
      question: "Где всё проходит? Как добраться и где припарковаться?",
      answer: (data) => `Праздник пройдёт в ${data.place || "Roblox Room"}${data.address ? `, ${data.address}` : ""}. Маршрут откроется в 2ГИС, а про парковку лучше уточнить у организатора.`,
      action: "map",
    },
    { id: "socks", question: "Что нужно взять с собой?", answer: () => "Возьми чистые носочки: они нужны и детям, и взрослым в игровой зоне. 🧦" },
    { id: "adult", question: "Можно ли прийти без взрослого?", answer: () => "Ребёнка должен сопровождать совершеннолетний взрослый, который остаётся в центре и присматривает за ним." },
    { id: "food", question: "Можно ли принести свою еду и напитки?", answer: () => "Свою еду и напитки приносить в центр нельзя. Питание для младенца или по медицинским показаниям нужно согласовать с администратором." },
    { id: "allergy", question: "Есть ли аллергены и как предупредить организатора?", answer: () => "Обязательно заранее сообщи организатору об аллергии. Состав блюд и наличие аллергенов уточни у персонала кафе.", action: "contact" },
    { id: "rsvp", question: "Как подтвердить, что мы придём?", answer: (data) => document.querySelector("#demo-rsvp") ? "Заполни форму «Ты придёшь?» в приглашении и выбери ответ." : data.contact ? "Напиши организатору в WhatsApp, чтобы подтвердить участие." : "Свяжись с организатором праздника, чтобы подтвердить участие.", action: "contact" },
    { id: "program", question: "Что будет на празднике?", answer: (data) => data.activities.length ? `В программе указано: ${data.activities.join(", ")}. Подробности можно уточнить у организатора.` : "Программу праздника можно уточнить у организатора.", action: "contact" },
  ];

  const FIRST_THOUGHT_DELAY = 4000;
  const THOUGHT_DURATION = 5000;
  const THOUGHT_REPEAT_MIN = 20000;
  const THOUGHT_REPEAT_MAX = 30000;
  const thoughts = ["Тут есть ответы на ваши вопросы 👋", "Есть вопросы о празднике?", "Что взять с собой? Спроси меня!", "Тут есть ответы на ваши вопросы"];
  const helper = document.querySelector("#faq-helper");
  const launcher = document.querySelector("#faq-launcher");
  const thought = document.querySelector("#faq-thought");
  const dialog = document.querySelector("#faq-dialog");
  const closeButton = document.querySelector("#faq-close");
  const resetButton = document.querySelector("#faq-reset");
  const moreButton = document.querySelector("#faq-more");
  const body = document.querySelector("#faq-body");
  const messages = document.querySelector("#faq-messages");
  const questions = document.querySelector("#faq-questions");
  const workspace = document.querySelector("#workspace");
  const editor = document.querySelector(".editor-panel");
  const guestGate = document.querySelector("#guest-gate");
  const form = document.querySelector("#invite-form");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const answered = new Set();
  let thoughtTimer;
  let thoughtHideTimer;
  let thoughtFinishTimer;
  let closeTimer;
  let thoughtIndex = 0;
  let hasOpened = false;
  let greeted = false;
  let busy = false;
  let active = false;

  function context() {
    const contact = document.querySelector("#rsvp-link");
    const activityNames = { greeting: "поздравление", animation: "анимационная программа", quest: "квест Roblox", show: "шоу", workshop: "мастер-класс" };
    const activities = [...form.querySelectorAll('input[name="activity"]:checked')].map((input) => activityNames[input.value]).filter(Boolean);
    return {
      date: form.elements.eventDate.value ? document.querySelector("#preview-date").textContent : "",
      time: form.elements.eventTime.value,
      place: form.elements.eventPlace.value.trim(),
      address: form.elements.eventAddress.value.trim(),
      activities,
      contact: !contact.hidden && contact.hasAttribute("href") ? contact.href : "",
      map: document.querySelector("#location-map").href,
    };
  }

  function scrollDown() {
    body.scrollTo({ top: body.scrollHeight, behavior: motion.matches ? "auto" : "smooth" });
  }

  function hideThought() {
    clearTimeout(thoughtHideTimer);
    clearTimeout(thoughtFinishTimer);
    thought.classList.remove("is-visible");
    thoughtFinishTimer = setTimeout(() => { thought.hidden = true; }, motion.matches ? 150 : 250);
  }

  function showThought() {
    if (!active || hasOpened || document.hidden) return;
    thought.textContent = thoughts[thoughtIndex % thoughts.length];
    thoughtIndex += 1;
    thought.hidden = false;
    requestAnimationFrame(() => {
      if (!thought.hidden && active && !hasOpened) thought.classList.add("is-visible");
    });
    thoughtHideTimer = setTimeout(() => {
      hideThought();
      const interval = THOUGHT_REPEAT_MIN + Math.random() * (THOUGHT_REPEAT_MAX - THOUGHT_REPEAT_MIN);
      thoughtTimer = setTimeout(showThought, interval);
    }, THOUGHT_DURATION);
  }

  function renderQuestions() {
    const ordered = [...FAQ].sort((a, b) => Number(answered.has(a.id)) - Number(answered.has(b.id)));
    questions.replaceChildren();
    ordered.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "faq-chip";
      button.style.setProperty("--index", index);
      button.textContent = `${answered.has(item.id) ? "✓ " : ""}${item.question}`;
      button.addEventListener("click", () => answerQuestion(item));
      questions.append(button);
    });
  }

  function appendMessage(text, user = false, action) {
    const message = document.createElement("div");
    message.className = `faq-message${user ? " is-user" : ""}`;
    const textNode = document.createElement("div");
    textNode.textContent = text;
    message.append(textNode);
    if (action) {
      const link = document.createElement("a");
      link.href = action.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = action.label;
      message.append(link);
    }
    messages.append(message);
    scrollDown();
    return message;
  }

  function showAnswer(message) {
    const top = body.scrollTop + message.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
    body.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }

  function startReply(text, action, onComplete) {
    busy = true;
    moreButton.hidden = true;
    resetButton.disabled = true;
    questions.classList.add("is-busy");
    questions.querySelectorAll("button").forEach((button) => { button.disabled = true; });
    setTimeout(() => {
      if (busy) {
        questions.hidden = true;
        scrollDown();
      }
    }, motion.matches ? 0 : 250);
    const typing = document.createElement("div");
    typing.className = "faq-typing";
    typing.setAttribute("aria-label", "Помощник печатает");
    for (let i = 0; i < 3; i += 1) typing.append(document.createElement("span"));
    if (!motion.matches) messages.append(typing);
    scrollDown();
    const delay = motion.matches ? 0 : Math.min(1100, 650 + text.length * 2);
    setTimeout(() => {
      typing.remove();
      const reply = appendMessage(text, false, action);
      if (onComplete) onComplete();
      setTimeout(() => {
        renderQuestions();
        questions.hidden = Boolean(onComplete);
        questions.classList.remove("is-busy");
        moreButton.hidden = !onComplete;
        resetButton.disabled = false;
        busy = false;
        if (onComplete) showAnswer(reply);
        else body.scrollTo({ top: 0, behavior: "auto" });
      }, motion.matches ? 0 : 400);
    }, delay);
  }

  function answerQuestion(item) {
    if (busy) return;
    const data = context();
    questions.hidden = true;
    appendMessage(item.question, true);
    let action;
    if (item.action === "map" && data.map) action = { href: data.map, label: "Открыть в 2ГИС ↗" };
    if (item.action === "contact" && data.contact) {
      const link = new URL(data.contact);
      link.searchParams.set("text", `Здравствуйте! ${item.question}`);
      action = { href: link.href, label: "Написать организатору ↗" };
    }
    startReply(item.answer(data), action, () => answered.add(item.id));
  }

  function openDialog() {
    if (!active) return;
    hasOpened = true;
    clearTimeout(thoughtTimer);
    hideThought();
    clearTimeout(closeTimer);
    dialog.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => dialog.classList.add("is-open"));
    closeButton.focus();
    if (!greeted) {
      greeted = true;
      startReply("Привет! Я помогу узнать о празднике. Выбери вопрос ниже. 👋");
    } else {
      scrollDown();
    }
  }

  function closeDialog(restoreFocus = true) {
    launcher.setAttribute("aria-expanded", "false");
    dialog.classList.remove("is-open");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => { dialog.hidden = true; }, motion.matches ? 150 : 300);
    if (restoreFocus && active) launcher.focus();
  }

  launcher.addEventListener("click", () => {
    if (launcher.getAttribute("aria-expanded") === "true") closeDialog();
    else openDialog();
  });
  thought.addEventListener("click", openDialog);
  closeButton.addEventListener("click", () => closeDialog());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && launcher.getAttribute("aria-expanded") === "true") closeDialog();
  });
  resetButton.addEventListener("click", () => {
    if (busy) return;
    answered.clear();
    messages.replaceChildren();
    questions.hidden = true;
    startReply("Привет! Я помогу узнать о празднике. Выбери вопрос ниже. 👋");
  });
  moreButton.addEventListener("click", () => {
    moreButton.hidden = true;
    questions.hidden = false;
    scrollDown();
  });

  function syncVisibility() {
    const visible = !workspace.hidden && workspace.dataset.room === "roblox" && !editor.open && guestGate.hidden;
    if (visible === active) return;
    active = visible;
    helper.hidden = !visible;
    if (!visible) {
      clearTimeout(thoughtTimer);
      hideThought();
      closeDialog(false);
    } else if (!hasOpened) {
      clearTimeout(thoughtFinishTimer);
      thought.hidden = true;
      thoughtTimer = setTimeout(showThought, FIRST_THOUGHT_DELAY);
    }
  }

  new MutationObserver(syncVisibility).observe(workspace, { attributes: true, attributeFilter: ["hidden", "data-room"] });
  new MutationObserver(syncVisibility).observe(editor, { attributes: true, attributeFilter: ["open"] });
  new MutationObserver(syncVisibility).observe(guestGate, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(thoughtTimer);
      hideThought();
    } else if (active && !hasOpened) {
      thoughtTimer = setTimeout(showThought, FIRST_THOUGHT_DELAY);
    }
  });
  syncVisibility();
})();
