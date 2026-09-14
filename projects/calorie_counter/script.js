const STORAGE_KEY = "calorieTrackerEntries";
const todayKey = getDateKey(new Date());

const foodForm = document.querySelector("#foodForm");
const foodNameInput = document.querySelector("#foodName");
const caloriesInput = document.querySelector("#calories");
const foodList = document.querySelector("#foodList");
const emptyState = document.querySelector("#emptyState");
const totalCalories = document.querySelector("#totalCalories");
const itemCount = document.querySelector("#itemCount");
const formTitle = document.querySelector("#formTitle");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const formStatus = document.querySelector("#formStatus");
const personalMessage = document.querySelector("#personalMessage");
const quoteText = document.querySelector("#quoteText");

let entries = readEntries();
let editingId = null;

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric"
}).format(new Date());

const quotes = [
  "Small, consistent choices add up.",
  "A little progress is still progress.",
  "Take care of yourself, one choice at a time.",
  "Awareness is the first step toward balance."
];
quoteText.textContent = quotes[new Date().getDate() % quotes.length];

foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = foodNameInput.value.trim();
  const calories = Number(caloriesInput.value);

  clearErrors();
  let valid = true;
  if (!name) {
    showError("foodNameError", "Please enter a food name.");
    valid = false;
  }
  if (!Number.isInteger(calories) || calories < 1 || calories > 99999) {
    showError("caloriesError", "Enter a whole number from 1 to 99,999.");
    valid = false;
  }
  if (!valid) return;

  if (editingId) {
    entries = entries.map((entry) => entry.id === editingId ? { ...entry, name, calories } : entry);
    showStatus("Food item updated.");
  } else {
    entries.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, calories, date: todayKey, createdAt: new Date().toISOString() });
    showStatus("Food item added.");
  }
  saveEntries();
  resetForm();
  render();
});

cancelEditButton.addEventListener("click", resetForm);

document.querySelector("#resetButton").addEventListener("click", () => {
  const todayEntries = entries.filter((entry) => entry.date === todayKey);
  if (!todayEntries.length) {
    showStatus("There are no entries to reset.");
    return;
  }
  if (window.confirm("Remove all food entries for today?")) {
    entries = entries.filter((entry) => entry.date !== todayKey);
    saveEntries();
    resetForm();
    render();
    showStatus("Today's log has been reset.");
  }
});

function render() {
  const todayEntries = entries.filter((entry) => entry.date === todayKey);
  const total = todayEntries.reduce((sum, entry) => sum + entry.calories, 0);
  totalCalories.textContent = total.toLocaleString();
  itemCount.textContent = todayEntries.length;
  emptyState.classList.toggle("hidden", todayEntries.length > 0);
  foodList.innerHTML = "";

  todayEntries.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");
    item.className = "food-item";
    item.innerHTML = `
      <div>
        <p class="food-name"></p>
        <span class="food-time">${formatTime(entry.createdAt)}</span>
      </div>
      <div class="food-meta">
        <span class="food-calories">${entry.calories.toLocaleString()} kcal</span>
        <button class="icon-button" type="button" aria-label="Edit ${escapeAttribute(entry.name)}" data-action="edit" data-id="${entry.id}">✎</button>
        <button class="icon-button" type="button" aria-label="Remove ${escapeAttribute(entry.name)}" data-action="delete" data-id="${entry.id}">×</button>
      </div>
    `;
    item.querySelector(".food-name").textContent = entry.name;
    foodList.appendChild(item);
  });

  if (total === 0) {
    personalMessage.textContent = "Ready when you are. Every entry is a useful snapshot.";
  } else if (todayEntries.length === 1) {
    personalMessage.textContent = "Great start. Keep building your record at your own pace.";
  } else {
    personalMessage.textContent = `You have recorded ${todayEntries.length} items today. Nice work staying aware.`;
  }
}

foodList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const id = button.dataset.id;
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  if (button.dataset.action === "delete") {
    entries = entries.filter((item) => item.id !== id);
    saveEntries();
    if (editingId === id) resetForm();
    render();
    showStatus("Food item removed.");
  } else {
    editingId = id;
    foodNameInput.value = entry.name;
    caloriesInput.value = entry.calories;
    formTitle.textContent = "Edit food item";
    submitButton.textContent = "Save changes";
    cancelEditButton.classList.remove("hidden");
    foodNameInput.focus();
  }
});

function readEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((entry) => entry && entry.date && entry.name && Number.isFinite(entry.calories)) : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function resetForm() {
  editingId = null;
  foodForm.reset();
  formTitle.textContent = "Log a food item";
  submitButton.textContent = "Add food";
  cancelEditButton.classList.add("hidden");
  clearErrors();
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function showError(id, message) {
  document.querySelector(`#${id}`).textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
}

function showStatus(message) {
  formStatus.textContent = message;
  window.setTimeout(() => { formStatus.textContent = ""; }, 3000);
}

function escapeAttribute(value) {
  return value.replace(/"/g, "&quot;");
}

render();