const CONFIG = {
  streamUrl: "https://myradio24.org/25968",
  defaultVolume: 0.7,
  radioId: "25968",
};

const AppState = {
  isPlaying: false,
  audio: null,
  volume: CONFIG.defaultVolume,
  currentTrack: "",
  currentPlaylist: "",
  trackUpdateInterval: null,
};

const Elements = {
  recordButton: document.getElementById("recordButton"),
  statusText: document.getElementById("statusText"),
  statusIcon: document.getElementById("statusIcon"),
  volumeSlider: document.getElementById("volumeSlider"),
  skullIcon: document.getElementById("skullIcon"),
  skullGlow: document.getElementById("skullGlow"),
  body: document.body,
  marqueeContainer: document.getElementById("marqueeContainer"),
  marqueeTrack: document.getElementById("marqueeTrack"),
  currentTrackText: document.getElementById("currentTrackText"),
  playlistName: document.getElementById("playlist-name"),
  canvas: document.querySelector(".my_visualizer"),
};

let audioCtx, analyser, source, dataArray, bufferLength;
let bassCooldown = 0,
  lastBass = 0;

async function initApp() {
  Elements.volumeSlider.value = AppState.volume * 100;

  setupEventListeners();
  await getCurrentTrackAndPlaylist();
  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);
}

async function getCurrentTrackAndPlaylist() {
  try {
    const apiUrl = `https://myradio24.com/users/${CONFIG.radioId}/status.json`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data?.song) {
      AppState.currentTrack = data.song.trim();
      Elements.currentTrackText.textContent = AppState.currentTrack;

      AppState.currentPlaylist = data.playlist
        ? data.playlist.trim()
        : "Rock / Metal / Alternative";
      updatePlaylistNameUI();
    } else {
      Elements.currentTrackText.textContent = "Информация о треке недоступна";
      AppState.currentPlaylist = "Rock / Metal / Alternative";
      updatePlaylistNameUI();
    }
  } catch (err) {
    console.error(err);
    Elements.currentTrackText.textContent = "Ошибка загрузки";
    AppState.currentPlaylist = "Rock / Metal / Alternative";
    updatePlaylistNameUI();
  }
}

function updatePlaylistNameUI() {
  if (!Elements.playlistName) return;
  const formattedName = AppState.currentPlaylist.replace(/_/g, " ");
  Elements.playlistName.textContent = formattedName;
}

function startTrackAndPlaylistUpdates() {
  getCurrentTrackAndPlaylist();
  if (AppState.trackUpdateInterval) clearInterval(AppState.trackUpdateInterval);
  AppState.trackUpdateInterval = setInterval(getCurrentTrackAndPlaylist, 30000);
}
function stopTrackAndPlaylistUpdates() {
  if (AppState.trackUpdateInterval) clearInterval(AppState.trackUpdateInterval);
  AppState.trackUpdateInterval = null;
}

function setupEventListeners() {
  Elements.recordButton.addEventListener("click", togglePlayback);
  Elements.volumeSlider.addEventListener("input", handleVolumeChange);
  document.addEventListener("keydown", handleKeyboard);
  setupHoverEffects();
  document.addEventListener("touchstart", initMobileAudioContext, {
    once: true,
  });
}

function initMobileAudioContext() {
  if (!audioCtx && AppState.audio) {
    initVisualizer(AppState.audio);
  }
}

async function togglePlayback() {
  if (AppState.isPlaying) await stopPlayback();
  else await startPlayback();
  updateUI();
}

async function startPlayback() {
  if (AppState.isPlaying) return;
  if (!AppState.audio) {
    AppState.audio = new Audio(CONFIG.streamUrl);
    AppState.audio.volume = AppState.volume;
    AppState.audio.preload = "auto";
    AppState.audio.crossOrigin = "anonymous";
    AppState.audio.addEventListener("playing", () =>
      console.log("✅ Радио играет"),
    );
    AppState.audio.addEventListener("error", onAudioError);
    AppState.audio.addEventListener("ended", onAudioEnded);
  }

  try {
    await AppState.audio.play();
    AppState.isPlaying = true;
    if (!audioCtx) initVisualizer(AppState.audio);

    startTrackAndPlaylistUpdates();
  } catch (err) {
    console.error(err);
    AppState.isPlaying = false;
    showError("Не удалось подключиться к радио");
  }
}

async function stopPlayback() {
  if (AppState.audio) {
    AppState.audio.pause();
    AppState.audio.currentTime = 0;
    AppState.audio = null;
  }
  AppState.isPlaying = false;
  stopTrackAndPlaylistUpdates();
}

// ====== Анимация черепа ======
function startSkullAnimation() {
  Elements.skullIcon.classList.add("skull-icon-playing");
  Elements.skullGlow.classList.add("skull-glow-playing");
}
function stopSkullAnimation() {
  Elements.skullIcon.classList.remove("skull-icon-playing");
  Elements.skullGlow.classList.remove("skull-glow-playing");
}

function onAudioError() {
  AppState.isPlaying = false;
  showError("Ошибка подключения");
  stopSkullAnimation();
  stopTrackAndPlaylistUpdates();
}
function onAudioEnded() {
  AppState.isPlaying = false;
  stopSkullAnimation();
  stopTrackAndPlaylistUpdates();
}
function showError(msg) {
  Elements.statusText.style.display = "block";
  Elements.marqueeContainer.style.display = "none";
  Elements.statusText.textContent = `❌ ${msg}`;
  Elements.statusText.style.color = "#ff4444";
}

// ====== Громкость ======
function handleVolumeChange(e) {
  AppState.volume = e.target.value / 100;
  if (AppState.audio) AppState.audio.volume = AppState.volume;
}

// ====== Клавиатура ======
function handleKeyboard(e) {
  switch (e.code) {
    case "Space":
      e.preventDefault();
      togglePlayback();
      break;
    case "ArrowUp":
      e.preventDefault();
      changeVolume(0.1);
      break;
    case "ArrowDown":
      e.preventDefault();
      changeVolume(-0.1);
      break;
    case "KeyM":
      e.preventDefault();
      toggleMute();
      break;
    case "KeyR":
      e.preventDefault();
      getCurrentTrackAndPlaylist();
      break;
  }
}
function changeVolume(delta) {
  let vol = Math.min(1, Math.max(0, AppState.volume + delta));
  AppState.volume = vol;
  Elements.volumeSlider.value = vol * 100;
  if (AppState.audio) AppState.audio.volume = vol;
}
function toggleMute() {
  if (AppState.audio) {
    AppState.audio.muted = !AppState.audio.muted;
    Elements.volumeSlider.disabled = AppState.audio.muted;
  }
}

// ====== Hover эффекты ======
function setupHoverEffects() {
  const rb = Elements.recordButton;
  rb.addEventListener("mouseenter", () => {
    rb.style.transform = "scale(1.02)";
  });
  rb.addEventListener("mouseleave", () => {
    rb.style.transform = "scale(1)";
  });
}

// ====== UI ======
function updateUI() {
  if (AppState.isPlaying) {
    Elements.recordButton.classList.add("record-playing");
    Elements.statusIcon.className = "fas fa-play";
    Elements.body.classList.add("playing");
    Elements.statusText.style.display = "none";
    Elements.marqueeContainer.style.display = "block";
  } else {
    Elements.recordButton.classList.remove("record-playing");
    Elements.statusIcon.className = "fas fa-pause";
    Elements.body.classList.remove("playing");
    Elements.statusText.style.display = "block";
    Elements.marqueeContainer.style.display = "none";
    Elements.statusText.textContent = "Радио выключено. Нажмите на пластинку";
  }
}

// ====== VISUALIZER и BASSES ======
function initVisualizer(audioElement) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 128;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  window.bassAnalyser = audioCtx.createAnalyser();
  window.bassAnalyser.fftSize = 256;
  const bassFilter = audioCtx.createBiquadFilter();
  bassFilter.type = "lowpass";
  bassFilter.frequency.value = 150;

  source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  source.connect(bassFilter);
  bassFilter.connect(window.bassAnalyser);
  window.bassAnalyser.connect(audioCtx.destination);

  resizeCanvas();
  drawVisualizer();
}

function resizeCanvas() {
  Elements.canvas.width = Elements.canvas.clientWidth;
  Elements.canvas.height = Elements.canvas.clientHeight;
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);
  const ctx = Elements.canvas.getContext("2d");
  ctx.clearRect(0, 0, Elements.canvas.width, Elements.canvas.height);
  const barWidth = Elements.canvas.width / bufferLength;
  let x = 0;
  dataArray.forEach((val) => {
    const h = val * 0.8;
    ctx.fillStyle = `rgb(${val},${255 - val},100)`;
    ctx.fillRect(x, Elements.canvas.height - h, barWidth - 1, h);
    x += barWidth;
  });
  detectBassHit();
}

function detectBassHit() {
  if (!window.bassAnalyser) return;
  const data = new Uint8Array(window.bassAnalyser.frequencyBinCount);
  window.bassAnalyser.getByteFrequencyData(data);
  const bassEnergy = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  const hit =
    bassEnergy > 160 && bassEnergy > lastBass * 1.4 && bassCooldown <= 0;
  lastBass = bassEnergy;
  bassCooldown--;
  if (hit) {
    bassCooldown = 8;
    onBassHit(bassEnergy);
  }
}

// Реакция черепа на бас
function onBassHit(power) {
  const skull = Elements.skullIcon;
  const glow = Elements.skullGlow;
  if (!skull || !glow) return;

  // Масштабирование по вертикали сильнее, по горизонтали чуть меньше
  const scaleY = 1 + Math.min(power / 400, 0.15); // максимум +15% вертикально
  const scaleX = 1 + Math.min(power / 1000, 0.05); // максимум +5% горизонтально

  skull.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`;
  glow.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`;

  glow.style.opacity = 0.6;

  // Сброс через короткое время
  setTimeout(() => {
    skull.style.transform = `translate(-50%, -50%) scaleX(1) scaleY(1)`;
    glow.style.transform = `translate(-50%, -50%) scaleX(1) scaleY(1)`;
    glow.style.opacity = 0.0;
  }, 120);
}

// ====== Старт ======
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
