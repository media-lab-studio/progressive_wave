// Конфигурация плеера
const CONFIG = {
  streamUrl: "https://myradio24.org/25968",
  defaultVolume: 0.7,
  radioId: "25968",
};

// Состояние приложения
const AppState = {
  isPlaying: false,
  audio: null,
  volume: CONFIG.defaultVolume,
  currentTrack: "",
  trackUpdateInterval: null,
  lastUpdateTime: null,
};

// DOM элементы
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
};

// Инициализация приложения
function initApp() {
  console.log("💀 EternalRock Radio - Skull Edition 💀");

  // Установка начального состояния
  updateUI();

  // Настройка элементов управления
  setupEventListeners();

  // Установка начальной громкости
  Elements.volumeSlider.value = AppState.volume * 100;

  // Проверка наличия иконки
  checkSkullIcon();
}

// Проверка наличия иконки черепа
function checkSkullIcon() {
  const skullImg = Elements.skullIcon;

  skullImg.onerror = function () {
    console.warn("⚠️ Иконка черепа не найдена, создаем fallback");
    createFallbackSkull();
  };

  skullImg.onload = function () {
    console.log("✅ Иконка черепа успешно загружена");
  };
}

// Функция для получения текущего трека
async function getCurrentTrack() {
  try {
    const apiUrl = `https://myradio24.com/users/${CONFIG.radioId}/status.json`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data && data.song) {
      let trackInfo = data.song.trim();

      // Сохраняем трек в состоянии
      AppState.currentTrack = trackInfo;
      AppState.lastUpdateTime = new Date();

      // Устанавливаем текст трека
      Elements.currentTrackText.textContent = trackInfo;

      // Настраиваем скорость анимации в зависимости от длины трека
      const trackLength = trackInfo.length;
      let animationClass = "";

      if (trackLength > 60) animationClass = "long";
      if (trackLength > 80) animationClass = "very-long";

      // Устанавливаем класс для анимации
      Elements.marqueeTrack.className = "marquee-track " + animationClass;

      // Добавляем эффект появления
      Elements.currentTrackText.classList.add("track-appear");
      setTimeout(() => {
        Elements.currentTrackText.classList.remove("track-appear");
      }, 500);

      console.log("🎵 Трек обновлен:", trackInfo);
      return trackInfo;
    } else {
      Elements.currentTrackText.textContent = "Информация о треке недоступна";
      return null;
    }
  } catch (error) {
    console.error("❌ Ошибка при получении трека:", error);
    Elements.currentTrackText.textContent = "Ошибка загрузки трека";
    return null;
  }
}

// Функция для обновления трека с интервалом
function startTrackUpdates() {
  // Получаем трек сразу при включении
  getCurrentTrack();

  // Очищаем старый интервал, если есть
  if (AppState.trackUpdateInterval) {
    clearInterval(AppState.trackUpdateInterval);
  }

  // Устанавливаем интервал обновления (каждые 30 секунд)
  AppState.trackUpdateInterval = setInterval(getCurrentTrack, 30000);

  console.log("🔄 Запущено обновление треков каждые 30 секунд");
}

// Функция для остановки обновления треков
function stopTrackUpdates() {
  if (AppState.trackUpdateInterval) {
    clearInterval(AppState.trackUpdateInterval);
    AppState.trackUpdateInterval = null;
    console.log("⏹️ Обновление треков остановлено");
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Клик по пластинке
  Elements.recordButton.addEventListener("click", togglePlayback);

  // Изменение громкости
  Elements.volumeSlider.addEventListener("input", handleVolumeChange);

  // Управление клавиатурой
  document.addEventListener("keydown", handleKeyboard);

  // Эффекты при наведении на пластинку
  setupHoverEffects();
}

// Переключение воспроизведения
function togglePlayback() {
  if (AppState.isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }

  updateUI();
}

// Запуск воспроизведения
function startPlayback() {
  try {
    AppState.audio = new Audio(CONFIG.streamUrl);
    AppState.audio.volume = AppState.volume;
    AppState.audio.preload = "auto";

    // Обработчики событий аудио
    AppState.audio.addEventListener("playing", onAudioPlaying);
    AppState.audio.addEventListener("error", onAudioError);
    AppState.audio.addEventListener("ended", onAudioEnded);

    // Запуск воспроизведения
    AppState.audio
      .play()
      .then(() => {
        AppState.isPlaying = true;

        // Запускаем обновление треков
        startTrackUpdates();

        updateUI();
        startSkullAnimation();
      })
      .catch((error) => {
        console.error("❌ Ошибка воспроизведения:", error);
        showError("Не удалось подключиться к радио");
        AppState.isPlaying = false;
        updateUI();
      });
  } catch (error) {
    console.error("❌ Ошибка создания аудио:", error);
    showError("Ошибка инициализации плеера");
    AppState.isPlaying = false;
    updateUI();
  }
}

// Остановка воспроизведения
function stopPlayback() {
  if (AppState.audio) {
    AppState.audio.pause();
    AppState.audio.currentTime = 0;

    // Удаляем обработчики
    AppState.audio.removeEventListener("playing", onAudioPlaying);
    AppState.audio.removeEventListener("error", onAudioError);
    AppState.audio.removeEventListener("ended", onAudioEnded);

    AppState.audio = null;
  }

  AppState.isPlaying = false;

  // Останавливаем обновление треков
  stopTrackUpdates();

  updateUI();
  stopSkullAnimation();
}

// Запуск анимации черепа
function startSkullAnimation() {
  Elements.skullIcon.classList.add("skull-icon-playing");
  Elements.skullGlow.classList.add("skull-glow-playing");

  // Плавное появление свечения
  Elements.skullGlow.style.opacity = "0";
  setTimeout(() => {
    Elements.skullGlow.style.opacity = "0.6";
  }, 100);
}

// Остановка анимации черепа
function stopSkullAnimation() {
  Elements.skullIcon.classList.remove("skull-icon-playing");
  Elements.skullGlow.classList.remove("skull-glow-playing");

  // Плавное исчезновение свечения
  Elements.skullGlow.style.opacity = "0";
}

// Обработчики событий аудио
function onAudioPlaying() {
  console.log("✅ Радио запущено успешно");
}

function onAudioError(event) {
  console.error("❌ Ошибка аудио:", event);
  showError("Ошибка подключения к радиостанции");
  AppState.isPlaying = false;
  updateUI();
  stopSkullAnimation();
  stopTrackUpdates();
}

function onAudioEnded() {
  console.log("⏹️ Воспроизведение завершено");
  AppState.isPlaying = false;
  updateUI();
  stopSkullAnimation();
  stopTrackUpdates();
}

// Управление громкостью
function handleVolumeChange(event) {
  const volume = event.target.value / 100;
  AppState.volume = volume;

  if (AppState.audio) {
    AppState.audio.volume = volume;
  }
}

// Управление клавиатурой
function handleKeyboard(event) {
  switch (event.code) {
    case "Space":
      event.preventDefault();
      togglePlayback();
      break;

    case "ArrowUp":
      event.preventDefault();
      increaseVolume();
      break;

    case "ArrowDown":
      event.preventDefault();
      decreaseVolume();
      break;

    case "KeyM":
      event.preventDefault();
      toggleMute();
      break;

    case "KeyR":
      event.preventDefault();
      if (AppState.isPlaying) {
        getCurrentTrack();
      }
      break;
  }
}

// Увеличение громкости
function increaseVolume() {
  let newVolume = AppState.volume + 0.1;
  if (newVolume > 1) newVolume = 1;

  AppState.volume = newVolume;
  Elements.volumeSlider.value = newVolume * 100;

  if (AppState.audio) {
    AppState.audio.volume = newVolume;
  }
}

// Уменьшение громкости
function decreaseVolume() {
  let newVolume = AppState.volume - 0.1;
  if (newVolume < 0) newVolume = 0;

  AppState.volume = newVolume;
  Elements.volumeSlider.value = newVolume * 100;

  if (AppState.audio) {
    AppState.audio.volume = newVolume;
  }
}

// Включение/выключение звука
function toggleMute() {
  if (AppState.audio) {
    AppState.audio.muted = !AppState.audio.muted;
    Elements.volumeSlider.disabled = AppState.audio.muted;
  }
}

// Эффекты при наведении
function setupHoverEffects() {
  Elements.recordButton.addEventListener("mousedown", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.style.transform = "scale(0.97)";
      Elements.skullIcon.style.filter =
        "drop-shadow(0 0 12px rgba(255, 94, 0, 0.9))";
    }
  });

  Elements.recordButton.addEventListener("mouseup", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.style.transform = "scale(1.02)";
      Elements.skullIcon.style.filter =
        "drop-shadow(0 0 10px rgba(255, 94, 0, 0.7))";
    }
  });

  Elements.recordButton.addEventListener("mouseenter", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.style.transform = "scale(1.02)";
      Elements.skullIcon.style.filter =
        "drop-shadow(0 0 10px rgba(255, 94, 0, 0.7))";
      Elements.skullGlow.style.opacity = "0.3";
    }
  });

  Elements.recordButton.addEventListener("mouseleave", () => {
    if (!AppState.isPlaying) {
      Elements.recordButton.style.transform = "scale(1)";
      Elements.skullIcon.style.filter =
        "drop-shadow(0 0 8px rgba(255, 94, 0, 0.7))";
      Elements.skullGlow.style.opacity = "0";
    }
  });
}

// Обновление интерфейса
function updateUI() {
  if (AppState.isPlaying) {
    // Воспроизведение активно - показываем бегущую строку с треком
    Elements.recordButton.classList.add("record-playing");
    Elements.statusIcon.className = "fas fa-play";
    Elements.body.classList.add("playing");

    // Показываем бегущую строку, скрываем обычный текст
    Elements.statusText.style.display = "none";
    Elements.marqueeContainer.style.display = "block";

    // Если трек еще не загружен, показываем загрузку
    if (!AppState.currentTrack) {
      Elements.currentTrackText.textContent = "Загрузка информации о треке...";
    }

    // Сохранение трансформации при воспроизведении
    Elements.recordButton.style.transform = "scale(1)";
  } else {
    // Воспроизведение остановлено - показываем обычный текст
    Elements.recordButton.classList.remove("record-playing");
    Elements.statusIcon.className = "fas fa-pause";
    Elements.body.classList.remove("playing");

    // Скрываем бегущую строку, показываем обычный текст
    Elements.statusText.style.display = "block";
    Elements.marqueeContainer.style.display = "none";
    Elements.statusText.textContent = "Радио выключено. Нажмите на пластинку";

    // Сброс эффектов черепа
    Elements.skullIcon.style.filter =
      "drop-shadow(0 0 8px rgba(255, 94, 0, 0.7))";
    Elements.skullGlow.style.opacity = "0";
  }
}

// Показать ошибку
function showError(message) {
  const originalText = Elements.statusText.textContent;
  const originalColor = Elements.statusText.style.color;

  // Временно показываем ошибку
  Elements.statusText.style.display = "block";
  Elements.marqueeContainer.style.display = "none";
  Elements.statusText.textContent = `❌ ${message}`;
  Elements.statusText.style.color = "#ff4444";

  setTimeout(() => {
    if (AppState.isPlaying) {
      // Возвращаем бегущую строку
      Elements.statusText.style.display = "none";
      Elements.marqueeContainer.style.display = "block";
    } else {
      // Возвращаем обычный текст
      Elements.statusText.textContent = originalText;
      Elements.statusText.style.color = originalColor;
    }
  }, 3000);
}

// Запуск при загрузке страницы
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Информация для консоли
console.log(
  "%c💀 EternalRock Radio - Skull Edition 💀",
  "color: #ff5e00; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px #ff5e00;"
);
console.log("%cУправление:", "color: #ff9d5c; font-weight: bold;");
console.log("• Нажмите на пластинку или пробел для воспроизведения/паузы");
console.log("• Стрелки Вверх/Вниз для регулировки громкости");
console.log("• M для отключения звука");
console.log("• R для обновления информации о текущем треке");
console.log("%cПоток: " + CONFIG.streamUrl, "color: #00ff88;");
