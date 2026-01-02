// Конфигурация плеера
const CONFIG = {
    streamUrl: 'https://myradio24.org/25968',
    defaultVolume: 0.7
};

// Состояние приложения
const AppState = {
    isPlaying: false,
    audio: null,
    volume: CONFIG.defaultVolume
};

// DOM элементы
const Elements = {
    recordButton: document.getElementById('recordButton'),
    statusText: document.getElementById('statusText'),
    statusIcon: document.getElementById('statusIcon'),
    volumeSlider: document.getElementById('volumeSlider'),
    skullIcon: document.getElementById('skullIcon'),
    skullGlow: document.getElementById('skullGlow'),
    body: document.body
};

// Инициализация приложения
function initApp() {
    console.log('💀 The Progressive Wave Radio - Skull Edition 💀');
    
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
    
    skullImg.onerror = function() {
        console.warn('⚠️ Иконка черепа не найдена, создаем fallback');
        createFallbackSkull();
    };
    
    skullImg.onload = function() {
        console.log('✅ Иконка черепа успешно загружена');
    };
}

// Создание fallback иконки если файл не найден
function createFallbackSkull() {
    const skullContainer = Elements.skullIcon.parentElement;
    const fallbackHTML = `
        <div class="fallback-skull">
            <div class="skull-eye left"></div>
            <div class="skull-eye right"></div>
            <div class="skull-nose"></div>
            <div class="skull-teeth"></div>
        </div>
    `;
    
    skullContainer.innerHTML += fallbackHTML;
    
    // Добавляем стили для fallback
    const style = document.createElement('style');
    style.textContent = `
        .fallback-skull {
            position: absolute;
            width: 70%;
            height: 70%;
            background: #fff;
            border-radius: 50%;
            clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%);
            z-index: 11;
        }
        .skull-eye {
            position: absolute;
            width: 20%;
            height: 20%;
            background: #000;
            border-radius: 50%;
            top: 30%;
        }
        .skull-eye.left { left: 25%; }
        .skull-eye.right { right: 25%; }
        .skull-nose {
            position: absolute;
            width: 15%;
            height: 20%;
            background: #000;
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            top: 50%;
            left: 42.5%;
        }
        .skull-teeth {
            position: absolute;
            width: 60%;
            height: 20%;
            background: #fff;
            border: 3px solid #000;
            bottom: 15%;
            left: 20%;
            display: flex;
            justify-content: space-around;
        }
        .skull-teeth::before,
        .skull-teeth::after {
            content: '';
            width: 15%;
            height: 100%;
            background: #000;
        }
    `;
    document.head.appendChild(style);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Клик по пластинке
    Elements.recordButton.addEventListener('click', togglePlayback);
    
    // Изменение громкости
    Elements.volumeSlider.addEventListener('input', handleVolumeChange);
    
    // Управление клавиатурой
    document.addEventListener('keydown', handleKeyboard);
    
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
        AppState.audio.preload = 'auto';
        
        // Обработчики событий аудио
        AppState.audio.addEventListener('playing', onAudioPlaying);
        AppState.audio.addEventListener('error', onAudioError);
        AppState.audio.addEventListener('ended', onAudioEnded);
        
        // Запуск воспроизведения
        AppState.audio.play()
            .then(() => {
                AppState.isPlaying = true;
                updateUI();
                startSkullAnimation();
            })
            .catch(error => {
                console.error('Ошибка воспроизведения:', error);
                showError('Не удалось подключиться к радио');
                AppState.isPlaying = false;
                updateUI();
            });
            
    } catch (error) {
        console.error('Ошибка создания аудио:', error);
        showError('Ошибка инициализации плеера');
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
        AppState.audio.removeEventListener('playing', onAudioPlaying);
        AppState.audio.removeEventListener('error', onAudioError);
        AppState.audio.removeEventListener('ended', onAudioEnded);
        
        AppState.audio = null;
    }
    
    AppState.isPlaying = false;
    updateUI();
    stopSkullAnimation();
}

// Запуск анимации черепа
function startSkullAnimation() {
    Elements.skullIcon.classList.add('skull-icon-playing');
    Elements.skullGlow.classList.add('skull-glow-playing');
    
    // Плавное появление свечения
    Elements.skullGlow.style.opacity = '0';
    setTimeout(() => {
        Elements.skullGlow.style.opacity = '0.6';
    }, 100);
}

// Остановка анимации черепа
function stopSkullAnimation() {
    Elements.skullIcon.classList.remove('skull-icon-playing');
    Elements.skullGlow.classList.remove('skull-glow-playing');
    
    // Плавное исчезновение свечения
    Elements.skullGlow.style.opacity = '0';
}

// Обработчики событий аудио
function onAudioPlaying() {
    console.log('✅ Радио запущено успешно');
    showStatus('Сейчас в эфире: 100 Hits - Rock', 'success');
}

function onAudioError(event) {
    console.error('❌ Ошибка аудио:', event);
    showError('Ошибка подключения к радиостанции');
    AppState.isPlaying = false;
    updateUI();
    stopSkullAnimation();
}

function onAudioEnded() {
    console.log('⏹️ Воспроизведение завершено');
    AppState.isPlaying = false;
    updateUI();
    stopSkullAnimation();
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
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            togglePlayback();
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            increaseVolume();
            break;
            
        case 'ArrowDown':
            event.preventDefault();
            decreaseVolume();
            break;
            
        case 'KeyM':
            event.preventDefault();
            toggleMute();
            break;
            
        case 'KeyS':
            event.preventDefault();
            toggleSkullEffect();
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

// Переключение эффекта черепа
function toggleSkullEffect() {
    if (AppState.isPlaying) {
        const isAnimating = Elements.skullIcon.classList.contains('skull-icon-playing');
        if (isAnimating) {
            Elements.skullIcon.classList.remove('skull-icon-playing');
            Elements.skullGlow.classList.remove('skull-glow-playing');
        } else {
            Elements.skullIcon.classList.add('skull-icon-playing');
            Elements.skullGlow.classList.add('skull-glow-playing');
        }
    }
}

// Эффекты при наведении
function setupHoverEffects() {
    Elements.recordButton.addEventListener('mousedown', () => {
        if (!AppState.isPlaying) {
            Elements.recordButton.style.transform = 'scale(0.97)';
            Elements.skullIcon.style.filter = 'drop-shadow(0 0 12px rgba(255, 94, 0, 0.9))';
        }
    });
    
    Elements.recordButton.addEventListener('mouseup', () => {
        if (!AppState.isPlaying) {
            Elements.recordButton.style.transform = 'scale(1.02)';
            Elements.skullIcon.style.filter = 'drop-shadow(0 0 10px rgba(255, 94, 0, 0.7))';
        }
    });
    
    Elements.recordButton.addEventListener('mouseenter', () => {
        if (!AppState.isPlaying) {
            Elements.recordButton.style.transform = 'scale(1.02)';
            Elements.skullIcon.style.filter = 'drop-shadow(0 0 10px rgba(255, 94, 0, 0.7))';
            Elements.skullGlow.style.opacity = '0.3';
        }
    });
    
    Elements.recordButton.addEventListener('mouseleave', () => {
        if (!AppState.isPlaying) {
            Elements.recordButton.style.transform = 'scale(1)';
            Elements.skullIcon.style.filter = 'drop-shadow(0 0 8px rgba(255, 94, 0, 0.7))';
            Elements.skullGlow.style.opacity = '0';
        }
    });
}

// Обновление интерфейса
function updateUI() {
    if (AppState.isPlaying) {
        // Воспроизведение активно
        Elements.recordButton.classList.add('record-playing');
        Elements.statusIcon.className = 'fas fa-play';
        Elements.statusText.textContent = 'Сейчас в эфире: The Progressive Wave';
        Elements.body.classList.add('playing');
        
        // Сохранение трансформации при воспроизведении
        Elements.recordButton.style.transform = 'scale(1)';
        
    } else {
        // Воспроизведение остановлено
        Elements.recordButton.classList.remove('record-playing');
        Elements.statusIcon.className = 'fas fa-pause';
        Elements.statusText.textContent = 'Радио выключено. Нажмите на пластинку';
        Elements.body.classList.remove('playing');
        
        // Сброс эффектов черепа
        Elements.skullIcon.style.filter = 'drop-shadow(0 0 8px rgba(255, 94, 0, 0.7))';
        Elements.skullGlow.style.opacity = '0';
    }
}

// Показать статус
function showStatus(message, type = 'info') {
    Elements.statusText.textContent = message;
    
    // Временное изменение цвета в зависимости от типа
    const originalColor = Elements.statusText.style.color;
    Elements.statusText.style.color = type === 'success' ? '#00ff88' : '#ff9d5c';
    
    setTimeout(() => {
        if (AppState.isPlaying) {
            Elements.statusText.textContent = 'Сейчас в эфире: The Progressive Wave';
        }
        Elements.statusText.style.color = originalColor;
    }, 2000);
}

// Показать ошибку
function showError(message) {
    const originalText = Elements.statusText.textContent;
    const originalColor = Elements.statusText.style.color;
    
    Elements.statusText.textContent = `❌ ${message}`;
    Elements.statusText.style.color = '#ff4444';
    
    setTimeout(() => {
        Elements.statusText.textContent = originalText;
        Elements.statusText.style.color = originalColor;
    }, 3000);
}

// Запуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Информация для консоли
console.log('%c💀 The Progressive Wave Radio - Skull Edition 💀', 
    'color: #ff5e00; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px #ff5e00;');
console.log('%cУправление:', 'color: #ff9d5c; font-weight: bold;');
console.log('• Нажмите на пластинку или пробел для воспроизведения/паузы');
console.log('• Стрелки Вверх/Вниз для регулировки громкости');
console.log('• M для отключения звука');
console.log('• S для переключения эффекта черепа');
console.log('%cПоток: ' + CONFIG.streamUrl, 'color: #00ff88;');
