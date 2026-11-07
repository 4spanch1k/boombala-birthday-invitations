const form = document.querySelector("#invite-form");
const photoInput = document.querySelector("#child-photo");
const photoStatus = document.querySelector("#photo-status");
const clearPhotoButton = document.querySelector("#clear-photo");
const previewPhoto = document.querySelector("#preview-photo");
const photoEmpty = document.querySelector("#photo-empty");

let photoUrl = "";

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

  document.querySelector("#preview-name").textContent = name || "Имя именинника";
  document.querySelector("#preview-age").textContent = age
    ? `УРОВЕНЬ ${age} ОТКРЫТ`
    : "ГОТОВ К НОВОМУ УРОВНЮ";
  document.querySelector("#preview-date").textContent = displayDate(form.elements.eventDate.value);
  document.querySelector("#preview-time").textContent = time || "Время праздника";
  document.querySelector("#preview-place").textContent = place || "Комната BoomBala";
  document.querySelector("#preview-address").textContent = address ? `Ориентир: ${address}` : "";
  document.querySelector("#preview-address").hidden = !address;
  document.querySelector("#preview-message").textContent = message || "Ждём тебя на празднике!";
}

function removePhoto() {
  if (photoUrl) URL.revokeObjectURL(photoUrl);

  photoUrl = "";
  photoInput.value = "";
  previewPhoto.removeAttribute("src");
  previewPhoto.hidden = true;
  photoEmpty.hidden = false;
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
