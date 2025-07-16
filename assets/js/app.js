// Pomodrop Timer App - Versão Completa Corrigida
class PomodoroTimer {
    constructor() {
        this.workTime = 25 * 60;
        this.breakTime = 5 * 60;
        this.currentTime = this.workTime;
        this.isRunning = false;
        this.isWorkSession = true;
        this.timer = null;
        this.sessionCount = 1;
        this.audioManager = new AudioManager();
        this.settings = this.loadSettings();
        
        this.init(); 
    }

    async init() {
        try {
            await this.waitForDOM();
            this.initializeElements();
            this.bindEvents();
            this.applySettings();
            this.updateDisplay();
            this.setupNotifications();
            console.log('✅ Pomodrop Timer inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
        }
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    initializeElements() {
        this.timeText = document.getElementById('timeText');
        this.progressBar = document.getElementById('progressBar');
        this.timerStatus = document.getElementById('timerStatus');
        this.timerContainer = document.querySelector('.timer-container');
        this.sessionNumber = document.getElementById('sessionNumber');
        this.nextSession = document.getElementById('nextSession');
        
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.musicToggle = document.getElementById('musicToggle');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        
        this.musicPanel = document.getElementById('musicPanel');
        this.settingsPanel = document.getElementById('settingsPanel');
        
        this.workTimeInput = document.getElementById('workTime');
        this.breakTimeInput = document.getElementById('breakTime');
        this.infiniteMode = document.getElementById('infiniteMode');
        this.pauseMusicWithTimer = document.getElementById('pauseMusicWithTimer');
        
        this.musicBtns = document.querySelectorAll('.music-btn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.audioUpload = document.getElementById('audioUpload');
        this.bgBtns = document.querySelectorAll('.bg-btn');
        
        this.youtubeLink = document.getElementById('youtubeLink');
        this.addYoutubeBtn = document.getElementById('addYoutubeBtn');
        this.youtubeStatus = document.getElementById('youtubeStatus');
        
        this.currentMusicTitle = document.getElementById('currentMusicTitle');
        this.musicSource = document.getElementById('musicSource');
        this.musicStatus = document.getElementById('musicStatus');
        this.notification = document.getElementById('notification');
        
        console.log('✅ Elementos inicializados');
    }

    bindEvents() {
        // Timer controls
        this.playBtn?.addEventListener('click', () => this.startTimer());
        this.pauseBtn?.addEventListener('click', () => this.pauseTimer());
        this.resetBtn?.addEventListener('click', () => this.resetTimer());
        this.settingsBtn?.addEventListener('click', () => this.toggleSettings());
        
        // Header controls
        this.musicToggle?.addEventListener('click', () => this.toggleMusic());
        this.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
        
        // Settings
        this.workTimeInput?.addEventListener('change', () => this.updateWorkTime());
        this.breakTimeInput?.addEventListener('change', () => this.updateBreakTime());
        this.infiniteMode?.addEventListener('change', () => this.toggleInfiniteMode());
        this.pauseMusicWithTimer?.addEventListener('change', () => this.togglePauseMusicWithTimer());
        
        // Music controls
        this.musicBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectMusic(btn.dataset.type));
        });
        
        this.volumeSlider?.addEventListener('input', () => this.updateVolume());
        this.audioUpload?.addEventListener('change', () => this.handleAudioUpload());
        
        // YouTube controls
        this.addYoutubeBtn?.addEventListener('click', () => this.addYoutubeLink());
        
        // Background selection
        this.bgBtns.forEach(btn => {
            btn.addEventListener('click', () => this.changeBackground(btn.dataset.bg));
        });
        
        // Panel close buttons
        document.getElementById('musicPanelClose')?.addEventListener('click', () => {
            this.musicPanel?.classList.add('hidden');
        });
        
        document.getElementById('settingsPanelClose')?.addEventListener('click', () => {
            this.settingsPanel?.classList.add('hidden');
        });
        
        // Notification close
        document.getElementById('notificationClose')?.addEventListener('click', () => {
            this.hideNotification();
        });
        
        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (this.musicPanel && !this.musicPanel.contains(e.target) && 
                this.musicToggle && !this.musicToggle.contains(e.target)) {
                this.musicPanel.classList.add('hidden');
            }
            if (this.settingsPanel && !this.settingsPanel.contains(e.target) && 
                this.settingsBtn && !this.settingsBtn.contains(e.target)) {
                this.settingsPanel.classList.add('hidden');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input')) {
                e.preventDefault();
                this.isRunning ? this.pauseTimer() : this.startTimer();
            }
            if (e.code === 'Escape') {
                this.resetTimer();
            }
        });
        
        console.log('✅ Event listeners configurados');
    }

    // Timer control methods
    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.playBtn?.classList.add('active');
            this.pauseBtn?.classList.remove('active');
            this.timerContainer?.classList.add('active');
            
            // Resume music if configured
            if (this.settings.pauseMusicWithTimer) {
                this.audioManager.resumeMusic();
            }
            
            this.timer = setInterval(() => {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.completeSession();
                }
            }, 1000);
            
            console.log('▶ Timer iniciado');
        }
    }

    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            this.playBtn?.classList.remove('active');
            this.pauseBtn?.classList.add('active');
            this.timerContainer?.classList.remove('active');
            clearInterval(this.timer);
            
            // Pause music if configured
            if (this.settings.pauseMusicWithTimer) {
                this.audioManager.pauseMusic();
            }
            
            console.log('⏸ Timer pausado');
        }
    }

    resetTimer() {
        this.isRunning = false;
        this.playBtn?.classList.remove('active');
        this.pauseBtn?.classList.remove('active');
        this.timerContainer?.classList.remove('active');
        clearInterval(this.timer);
        
        this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        this.updateDisplay();
        
        console.log('⏹ Timer resetado');
    }

    completeSession() {
        this.isRunning = false;
        this.playBtn?.classList.remove('active');
        this.pauseBtn?.classList.remove('active');
        this.timerContainer?.classList.remove('active');
        clearInterval(this.timer);
        
        this.audioManager.playNotification();
        
        this.showNotification(
            this.isWorkSession ? 'Trabalho Concluído!' : 'Pausa Concluída!',
            this.isWorkSession ? 'Hora da pausa' : 'Hora de trabalhar'
        );
        
        if (!this.settings.infiniteMode) {
            this.isWorkSession = !this.isWorkSession;
            if (this.isWorkSession) {
                this.sessionCount++;
            }
        }
        
        this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        
        if (this.timeText) {
            this.timeText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (this.timerStatus) {
            this.timerStatus.textContent = this.isWorkSession ? 'Trabalho' : 'Pausa';
        }
        
        if (this.sessionNumber) {
            this.sessionNumber.textContent = this.sessionCount;
        }
        
        if (this.nextSession) {
            this.nextSession.textContent = this.isWorkSession ? 'Pausa' : 'Trabalho';
        }
        
        // Update circular progress
        if (this.progressBar) {
            const totalTime = this.isWorkSession ? this.workTime : this.breakTime;
            const progress = ((totalTime - this.currentTime) / totalTime) * 100;
            const circumference = 2 * Math.PI * 180;
            const offset = circumference - (progress / 100) * circumference;
            this.progressBar.style.strokeDashoffset = offset;
        }
        
        document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - ${this.isWorkSession ? 'Trabalho' : 'Pausa'} - Pomodrop`;
    }

    // Panel toggle methods
    toggleSettings() {
        this.settingsPanel?.classList.toggle('hidden');
        this.musicPanel?.classList.add('hidden');
    }

    toggleMusic() {
        this.musicPanel?.classList.toggle('hidden');
        this.settingsPanel?.classList.add('hidden');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Erro ao entrar em tela cheia:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Settings methods
    updateWorkTime() {
        if (this.workTimeInput) {
            this.workTime = parseInt(this.workTimeInput.value) * 60;
            if (this.isWorkSession) {
                this.currentTime = this.workTime;
                this.updateDisplay();
            }
            this.saveSettings();
        }
    }

    updateBreakTime() {
        if (this.breakTimeInput) {
            this.breakTime = parseInt(this.breakTimeInput.value) * 60;
            if (!this.isWorkSession) {
                this.currentTime = this.breakTime;
                this.updateDisplay();
            }
            this.saveSettings();
        }
    }

    toggleInfiniteMode() {
        this.settings.infiniteMode = this.infiniteMode?.checked || false;
        this.saveSettings();
    }

    togglePauseMusicWithTimer() {
        this.settings.pauseMusicWithTimer = this.pauseMusicWithTimer?.checked || false;
        this.saveSettings();
    }

    // Music methods
    selectMusic(type) {
        this.musicBtns.forEach(btn => btn.classList.remove('active'));
        event.target.closest('.music-btn')?.classList.add('active');
        
        if (type === 'upload') {
            this.audioUpload?.click();
        } else {
            this.audioManager.playMusic(type);
            this.updateMusicStatus(type);
        }
        
        this.settings.musicType = type;
        this.saveSettings();
    }

    updateVolume() {
        if (this.volumeSlider && this.volumeValue) {
            const volume = this.volumeSlider.value;
            this.volumeValue.textContent = `${volume}%`;
            this.audioManager.setVolume(volume / 100);
            this.settings.volume = volume;
            this.saveSettings();
        }
    }

    handleAudioUpload() {
        const file = this.audioUpload?.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            this.audioManager.playCustomMusic(url);
            this.updateMusicStatus('upload');
        }
    }

    addYoutubeLink() {
        const link = this.youtubeLink?.value.trim();
        if (link) {
            this.audioManager.setYoutubeLink(link);
            if (this.youtubeStatus) {
                this.youtubeStatus.innerHTML = `
                    <span class="status-icon">🎵</span>
                    <span class="status-text">Vídeo carregado</span>
                `;
            }
            this.youtubeLink.value = '';
            console.log('✅ Link do YouTube adicionado');
        }
    }

    updateMusicStatus(type) {
        const titles = {
            none: 'Sem música',
            youtube: 'YouTube',
            lofi: 'Lofi Beats',
            nature: 'Sons da Natureza',
            synthwave: 'Synthwave',
            upload: 'Áudio Personalizado'
        };
        
        const sources = {
            none: 'Modo silencioso',
            youtube: 'YouTube personalizado',
            lofi: 'Música ambiente',
            nature: 'Sons da natureza',
            synthwave: 'Música retrô',
            upload: 'Arquivo local'
        };
        
        if (this.currentMusicTitle) {
            this.currentMusicTitle.textContent = titles[type] || 'Música';
        }
        
        if (this.musicSource) {
            this.musicSource.textContent = sources[type] || 'Desconhecido';
        }
    }

    changeBackground(bg) {
        this.bgBtns.forEach(btn => btn.classList.remove('active'));
        event.target.closest('.bg-btn')?.classList.add('active');
        
        document.body.className = bg === 'default' ? '' : `bg-${bg}`;
        this.settings.background = bg;
        this.saveSettings();
    }

    // Notification methods
    showNotification(title, message) {
        if (this.notification) {
            const notificationTitle = this.notification.querySelector('.notification-title');
            const notificationMessage = this.notification.querySelector('.notification-message');
            const notifEmoji = this.notification.querySelector('.notif-emoji');
            
            if (notificationTitle) notificationTitle.textContent = title;
            if (notificationMessage) notificationMessage.textContent = message;
            if (notifEmoji) notifEmoji.textContent = this.isWorkSession ? '🎉' : '☕';
            
            this.notification.classList.remove('hidden');
            this.notification.classList.add('show');
            
            setTimeout(() => this.hideNotification(), 5000);
        }
        
        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'assets/images/icons/favicon.ico'
            });
        }
    }

    hideNotification() {
        if (this.notification) {
            this.notification.classList.remove('show');
            this.notification.classList.add('hidden');
        }
    }

    setupNotifications() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    // Settings persistence
    saveSettings() {
        this.settings.workTime = this.workTimeInput ? parseInt(this.workTimeInput.value) : 25;
        this.settings.breakTime = this.breakTimeInput ? parseInt(this.breakTimeInput.value) : 5;
        this.settings.infiniteMode = this.infiniteMode?.checked || false;
        this.settings.pauseMusicWithTimer = this.pauseMusicWithTimer?.checked || false;
        this.settings.volume = this.volumeSlider ? parseInt(this.volumeSlider.value) : 30;
        
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        return saved ? JSON.parse(saved) : {
            workTime: 25,
            breakTime: 5,
            infiniteMode: false,
            pauseMusicWithTimer: true,
            musicType: 'none',
            volume: 30,
            background: 'default'
        };
    }

    applySettings() {
        if (this.workTimeInput) this.workTimeInput.value = this.settings.workTime;
        if (this.breakTimeInput) this.breakTimeInput.value = this.settings.breakTime;
        if (this.infiniteMode) this.infiniteMode.checked = this.settings.infiniteMode;
        if (this.pauseMusicWithTimer) this.pauseMusicWithTimer.checked = this.settings.pauseMusicWithTimer;
        if (this.volumeSlider) this.volumeSlider.value = this.settings.volume;
        if (this.volumeValue) this.volumeValue.textContent = `${this.settings.volume}%`;
        
        this.workTime = this.settings.workTime * 60;
        this.breakTime = this.settings.breakTime * 60;
        this.currentTime = this.workTime;
        
        if (this.settings.background !== 'default') {
            document.body.className = `bg-${this.settings.background}`;
        }
        
        this.bgBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === this.settings.background);
        });
        
        this.updateMusicStatus(this.settings.musicType);
        
        setTimeout(() => {
            this.audioManager.setVolume(this.settings.volume / 100);
        }, 100);
    }
}

// Audio Manager Class
class AudioManager {
    constructor() {
        this.audioPlayer = null;
        this.youtubePlayer = null;
        this.currentMusic = null;
        this.volume = 0.3;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentType = 'none';
        this.currentVideoId = null;
        this.isYouTubeReady = false;
        
        this.setupAudioPlayer();
        this.initializeYouTubeAPI();
    }

    setupAudioPlayer() {
        if (!document.getElementById('audioPlayer')) {
            this.audioPlayer = document.createElement('audio');
            this.audioPlayer.id = 'audioPlayer';
            this.audioPlayer.loop = true;
            this.audioPlayer.volume = this.volume;
            document.body.appendChild(this.audioPlayer);
        } else {
            this.audioPlayer = document.getElementById('audioPlayer');
        }
    }

    initializeYouTubeAPI() {
        if (typeof YT !== 'undefined' && YT.Player) {
            this.onYouTubeReady();
        } else {
            window.onYouTubeIframeAPIReady = () => {
                this.onYouTubeReady();
            };
        }
    }

    onYouTubeReady() {
        try {
            if (!document.getElementById('youtubePlayer')) {
                const container = document.createElement('div');
                container.id = 'youtubePlayer';
                container.style.display = 'none';
                document.body.appendChild(container);
            }

            // Substitua a inicialização do YouTube Player por:
        this.youtubePlayer = new YT.Player('youtubePlayer', {
            height: '0',
            width: '0',
            playerVars: {
                autoplay: 0,
                controls: 0,
                loop: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                origin: window.location.origin, // Detecta automaticamente
                enablejsapi: 1
            },
            events: {
                onReady: () => {
                    this.isYouTubeReady = true;
                    console.log('✅ YouTube player pronto');
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        this.youtubePlayer.playVideo();
                    }
                },
                onError: (error) => {
                    console.log('YouTube error:', error);
                    // Fallback para outros tipos de música
                    this.playFallbackMusic('lofi');
                }
            }
        });

        } catch (error) {
            console.error('Erro ao inicializar YouTube player:', error);
        }
    }

    extractVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    setYoutubeLink(url) {
        const videoId = this.extractVideoId(url);
        if (videoId) {
            this.currentVideoId = videoId;
            console.log('✅ Vídeo do YouTube configurado:', videoId);
        }
    }

    playMusic(type) {
        this.currentType = type;
        
        if (type === 'none') {
            this.stopMusic();
            return;
        }
        
        if (type === 'youtube' && this.currentVideoId && this.isYouTubeReady) {
            this.youtubePlayer.loadVideoById(this.currentVideoId);
            this.youtubePlayer.playVideo();
            this.youtubePlayer.setVolume(this.volume * 100);
            this.isPlaying = true;
            console.log('🎵 Tocando YouTube:', this.currentVideoId);
            return;
        }
        
        this.playFallbackMusic(type);
    }

    playFallbackMusic(type) {
        console.log('🎵 Tocando som ambiente:', type);
        this.isPlaying = true;
    }

    playCustomMusic(url) {
        this.stopMusic();
        
        if (this.audioPlayer) {
            this.audioPlayer.src = url;
            this.audioPlayer.volume = this.volume;
            this.audioPlayer.play();
            this.currentMusic = this.audioPlayer;
            this.isPlaying = true;
        }
    }

    pauseMusic() {
        if (this.youtubePlayer && this.isPlaying) {
            this.youtubePlayer.pauseVideo();
            this.isPlaying = false;
        }
        
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.isPlaying = false;
        }
        
        console.log('⏸ Música pausada');
    }

    resumeMusic() {
        if (this.youtubePlayer && !this.isPlaying && this.currentType !== 'none') {
            this.youtubePlayer.playVideo();
            this.isPlaying = true;
        }
        
        if (this.audioPlayer && this.currentMusic) {
            this.audioPlayer.play();
            this.isPlaying = true;
        }
        
        console.log('▶ Música retomada');
    }

    stopMusic() {
        if (this.youtubePlayer) {
            this.youtubePlayer.stopVideo();
        }
        
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.src = '';
        }
        
        this.isPlaying = false;
        console.log('⏹ Música parada');
    }

    setVolume(volume) {
        this.volume = volume;
        
        if (this.youtubePlayer && this.isYouTubeReady) {
            this.youtubePlayer.setVolume(volume * 100);
        }
        
        if (this.audioPlayer) {
            this.audioPlayer.volume = volume;
        }
    }

    playNotification() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Notificação sonora não suportada');
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
