const textBox = document.querySelector("#script");
const counts = document.querySelector("#counts");
const estimate = document.querySelector("#estimate");
const language = document.querySelector("#language");
const playButton = document.querySelector("#play-button");
const downloadButton = document.querySelector("#download-button");
const statusLine = document.querySelector(".status-line");
const statusText = document.querySelector("#status");
const audioPlayer = document.querySelector("#audio-player");
let slow = false;
let audioBlob = null;
let audioUrl = null;
let requestId = 0;

function updateCounts() {
  const text = textBox.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const seconds = words ? Math.round(words / (145 / 60)) : 0;
  counts.innerHTML = `${words} ${words === 1 ? "word" : "words"} <i>·</i> ${text.length.toLocaleString()} / 5,000 characters`;
  estimate.textContent = seconds >= 60
    ? `About ${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, "0")} sec`
    : `About ${seconds} sec`;
}

function invalidateAudio() {
  requestId += 1;
  playButton.disabled = false;
  playButton.querySelector("span").textContent = "Generate speech";
  audioBlob = null;
  downloadButton.disabled = true;
  audioPlayer.pause();
  audioPlayer.hidden = true;
  audioPlayer.removeAttribute("src");
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = null;
  setStatus("Ready when you are");
}

function setStatus(message, type = "") {
  statusLine.classList.remove("loading", "success", "error");
  if (type) statusLine.classList.add(type);
  statusText.textContent = message;
}

textBox.addEventListener("input", () => {
  updateCounts();
  invalidateAudio();
});

document.querySelector("#clear-button").addEventListener("click", () => {
  textBox.value = "";
  updateCounts();
  invalidateAudio();
  textBox.focus();
});

document.querySelector("#file-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const content = await file.text();
    textBox.value = content.slice(0, 5000);
    updateCounts();
    invalidateAudio();
    if (content.length > 5000) setStatus("Imported first 5,000 characters");
  } catch {
    setStatus("Could not read that text file", "error");
  }
  event.target.value = "";
});

language.addEventListener("change", invalidateAudio);
document.querySelectorAll(".pace-option").forEach((button) => {
  button.addEventListener("click", () => {
    slow = button.dataset.slow === "true";
    document.querySelectorAll(".pace-option").forEach((option) => {
      const selected = option === button;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    invalidateAudio();
  });
});

playButton.addEventListener("click", async () => {
  const text = textBox.value.trim();
  if (!text) {
    textBox.focus();
    setStatus("Type or import some text first", "error");
    return;
  }

  const thisRequest = ++requestId;
  playButton.disabled = true;
  playButton.querySelector("span").textContent = "Creating your audio…";
  downloadButton.disabled = true;
  setStatus("Connecting to text-to-speech…", "loading");

  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: language.value, slow }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Speech generation failed. Please try again.");
    }
    const blob = await response.blob();
    if (thisRequest !== requestId) return;
    audioBlob = blob;
    audioUrl = URL.createObjectURL(blob);
    audioPlayer.src = audioUrl;
    audioPlayer.hidden = false;
    downloadButton.disabled = false;
    setStatus("Your audio is ready", "success");
    await audioPlayer.play();
  } catch (error) {
    if (thisRequest === requestId) setStatus(error.message, "error");
  } finally {
    if (thisRequest === requestId) {
      playButton.disabled = false;
      playButton.querySelector("span").textContent = "Generate speech";
    }
  }
});

downloadButton.addEventListener("click", () => {
  if (!audioBlob) return;
  const link = document.createElement("a");
  link.href = audioUrl;
  link.download = "vox-speech.mp3";
  document.body.append(link);
  link.click();
  link.remove();
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    playButton.click();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    document.querySelector("#clear-button").click();
  }
});

updateCounts();
