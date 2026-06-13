const chatEl = document.getElementById("chat");
const welcomeEl = document.getElementById("welcome");
const form = document.getElementById("chatForm");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const voiceToggle = document.getElementById("voiceToggle");
const voiceIcon = document.getElementById("voiceIcon");
const voiceLabel = document.getElementById("voiceLabel");

const history = [];
let voiceOn = true;
let isLoading = false;

// Auto-resize textarea
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
});

// Enter to send, Shift+Enter for newline
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// Voice toggle
voiceToggle.addEventListener("click", () => {
  voiceOn = !voiceOn;
  voiceToggle.setAttribute("aria-pressed", String(voiceOn));
  voiceIcon.textContent = voiceOn ? "🔊" : "🔇";
  voiceLabel.textContent = voiceOn ? "Voice on" : "Voice off";
  if (!voiceOn && "speechSynthesis" in window) speechSynthesis.cancel();
});

// Suggestion chips
document.querySelectorAll(".chip").forEach((c) =>
  c.addEventListener("click", () => {
    input.value = c.textContent;
    form.requestSubmit();
  })
);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || isLoading) return;

  hideWelcome();
  addMessage("user", text);
  history.push({ role: "user", content: text });
  input.value = "";
  input.style.height = "auto";

  isLoading = true;
  sendBtn.disabled = true;
  const typingEl = addTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    typingEl.remove();

    if (!res.ok || data.error) {
      addError(data.error || "Something went wrong.");
    } else {
      const reply = data.reply || "";
      addMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });
      if (voiceOn) speak(reply);
    }
  } catch (err) {
    typingEl.remove();
    addError("Network error: " + err.message);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
});

function hideWelcome() {
  if (welcomeEl && welcomeEl.parentNode) welcomeEl.remove();
}

function addMessage(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + role;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  chatEl.appendChild(wrap);
  scrollToBottom();
}

function addTyping() {
  const wrap = document.createElement("div");
  wrap.className = "msg assistant";
  wrap.innerHTML = '<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  chatEl.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

function addError(msg) {
  const el = document.createElement("div");
  el.className = "error";
  el.textContent = "⚠️ " + msg;
  chatEl.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /female|zira|samantha|google.*english/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utter.voice = preferred;
  speechSynthesis.speak(utter);
}
