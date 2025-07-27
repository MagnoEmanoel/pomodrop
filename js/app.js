class PomodoroTimer {
    constructor() {
        // Timer Properties
        this.workTime = 25 * 60;
        this.shortBreak = 5 * 60;
        this.longBreak = 15 * 60;
        this.sessionsUntilLong = 4;
        this.currentSession = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = this.workTime;
        this.mode = 'work';
        this.totalSessions = 0;
        this.timer = null;
        this.autoStart = false;
        this.notificationsEnabled = true;

        // Propriedade para rastrear se a música estava tocando antes da pausa
        this.wasPlayingBeforePause = false;
        // Nova propriedade para armazenar o tempo atual do vídeo
        this.currentVideoTime = 0;

        // DOM Elements - Timer
        this.progressCircle = document.querySelector('.progress-bar');
        this.timeDisplay = document.querySelector('.time-text');
        this.statusDisplay = document.querySelector('.status-text');
        this.sessionNumber = document.querySelector('.session-number');
        this.nextText = document.querySelector('.next-text');
        this.playBtn = document.querySelector('.play-btn');
        this.pauseBtn = document.querySelector('.pause-btn');
        this.resetBtn = document.querySelector('.reset-btn');

        // DOM Elements - Panels
        this.musicPanel = document.querySelector('.music-panel');
        this.settingsPanel = document.querySelector('.settings-panel');
        this.musicStatus = document.querySelector('.music-status');
        this.notification = document.querySelector('.notification');

        // Music System Properties
        this.youtubePlayer = null;
        this.isYouTubeReady = false;
        this.volume = 0.5;
        this.currentTheme = 'default';
        this.isPlaying = false;
        this.currentType = null;
        this.currentIndex = 0;
        this.currentPlaylist = [];
        this.currentVideoId = null;

        // Sistema de Inatividade e Auto-Interações
        this.panelInactivityTimer = null;
        this.fullscreenInactivityTimer = null;
        this.mouseMovementTimer = null;
        this.lastUserActivity = Date.now();
        this.isMouseVisible = true;

        // Playlists com os links fornecidos extraídos
        this.playlists = {
            synthwave: [
                'KQI-_q5SsoU',
                '8GW6sLrK40k',
                'R7NvGItVlA8'
            ],
            nature: [
                'xNN7iTA57jM',
                'SnUBb-FAlCY'
            ],
            lofi: [
                'CLeZyIID9Bo',
                '9kzE8isXlQY'
            ]
        };

        this.progressCircumference = 2 * Math.PI * 150;

        this.initializeElements();
        this.initializeEventListeners();
        this.initializeInactivitySystem();
        this.initializeVolumeControl();
        this.loadSettings();
        this.updateDisplay();
        this.updateProgress();
        this.initializeAudio();
    }

    initializeElements() {
        this.progressCircle.style.strokeDasharray = this.progressCircumference;
        this.progressCircle.style.strokeDashoffset = this.progressCircumference;
    }

    initializeEventListeners() {
        // Timer controls
        this.playBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Music controls
        const playMusicBtn = document.querySelector('.play-music-btn');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const stopBtn = document.querySelector('.stop-btn');

        if (playMusicBtn) playMusicBtn.addEventListener('click', () => this.togglePlayPause());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousTrack());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextTrack());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopMusic());

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                this.selectCategory(category, btn);
            });
        });

        // Panel toggles
        document.querySelector('.music-toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel('music');
        });

        document.querySelector('.settings-toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel('settings');
        });

        // Panel close buttons
        document.querySelector('.music-close').addEventListener('click', () => this.closePanel('music'));
        document.querySelector('.settings-close').addEventListener('click', () => this.closePanel('settings'));

        // Clique fora dos painéis para fechar
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Prevenir fechamento ao clicar dentro dos painéis
        this.musicPanel.addEventListener('click', (e) => e.stopPropagation());
        this.settingsPanel.addEventListener('click', (e) => e.stopPropagation());

        // Fullscreen
        document.querySelector('.fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
        const exitBtn = document.querySelector('.exit-fullscreen-btn');
        if (exitBtn) exitBtn.addEventListener('click', () => this.exitFullscreen());

        // Settings inputs
        document.getElementById('work-time').addEventListener('change', (e) => {
            this.workTime = parseInt(e.target.value) * 60;
            if (this.mode === 'work' && !this.isRunning) {
                this.currentTime = this.workTime;
                this.updateDisplay();
                this.updateProgress();
            }
        });

        document.getElementById('short-break').addEventListener('change', (e) => {
            this.shortBreak = parseInt(e.target.value) * 60;
        });

        document.getElementById('long-break').addEventListener('change', (e) => {
            this.longBreak = parseInt(e.target.value) * 60;
        });

        document.getElementById('sessions-until-long').addEventListener('change', (e) => {
            this.sessionsUntilLong = parseInt(e.target.value);
        });

        document.getElementById('auto-start').addEventListener('change', (e) => {
            this.autoStart = e.target.checked;
        });

        document.getElementById('notifications').addEventListener('change', (e) => {
            this.notificationsEnabled = e.target.checked;
        });

        // Theme selector
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.changeTheme(theme);
            });
        });

        // YouTube input
        document.querySelector('.youtube-add-btn').addEventListener('click', () => {
            const input = document.querySelector('.youtube-input');
            const url = input.value.trim();
            if (url) {
                this.setYoutubeLink(url);
                input.value = '';
            }
        });

        document.querySelector('.youtube-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = e.target.value.trim();
                if (url) {
                    this.setYoutubeLink(url);
                    e.target.value = '';
                }
            }
        });

        // Notification close
        document.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            this.resetUserActivity();

            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.isRunning ? this.pause() : this.start();
                    break;
                case 'r':
                    e.preventDefault();
                    this.reset();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    this.togglePanel('music');
                    break;
                case 's':
                    e.preventDefault();
                    this.togglePanel('settings');
                    break;
                case 'Escape':
                    this.closeAllPanels();
                    this.hideVolumeSlider();
                    break;
            }
        });

        // Fullscreen change listener
        document.addEventListener('fullscreenchange', () => {
            const exitBtn = document.querySelector('.exit-fullscreen-btn');
            if (document.fullscreenElement) {
                document.body.classList.add('fullscreen-mode');
                if (exitBtn) {
                    exitBtn.classList.add('show');
                    this.setupMouseMovementTracking();
                }
            } else {
                document.body.classList.remove('fullscreen-mode');
                if (exitBtn) exitBtn.classList.remove('show');
                this.cleanupMouseMovementTracking();
            }
        });
    }

    // Sistema de Volume YouTube
    initializeVolumeControl() {
        const volumeToggleBtn = document.querySelector('.volume-toggle-btn');
        const volumeSliderContainer = document.querySelector('.volume-slider-container');
        const volumeSliderYoutube = document.querySelector('.volume-slider-youtube');
        const volumePercentage = document.querySelector('.volume-percentage');

        if (!volumeToggleBtn || !volumeSliderContainer || !volumeSliderYoutube || !volumePercentage) {
            console.log('❌ Elementos de volume não encontrados');
            return;
        }

        console.log('✅ Controle de volume inicializado');

        // Toggle do volume container
        volumeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isVisible = !volumeSliderContainer.classList.contains('hidden');
            
            if (isVisible) {
                volumeSliderContainer.classList.add('hidden');
                volumeSliderContainer.classList.remove('show');
                volumeToggleBtn.classList.remove('active');
            } else {
                volumeSliderContainer.classList.remove('hidden');
                volumeSliderContainer.classList.add('show', 'animate-in');
                volumeToggleBtn.classList.add('active');

                setTimeout(() => {
                    if (volumeSliderContainer.classList.contains('show')) {
                        volumeSliderContainer.classList.add('hidden');
                        volumeSliderContainer.classList.remove('show');
                        volumeToggleBtn.classList.remove('active');
                    }
                }, 6000);
            }
        });

        // Controle do slider
        volumeSliderYoutube.addEventListener('input', (e) => {
            e.stopPropagation();
            const volume = parseInt(e.target.value);
            this.volume = volume / 100;

            // Atualizar display
            volumePercentage.textContent = `${volume}%`;

            // Atualizar ícone
            this.updateVolumeIcon(volume);

            // Atualizar YouTube player
            if (this.youtubePlayer && this.isYouTubeReady) {
                this.youtubePlayer.setVolume(volume);
            }

            console.log(`🔊 Volume ajustado: ${volume}%`);
        });

        // Prevenir fechamento ao clicar no container
        volumeSliderContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Inicializar valores
        volumeSliderYoutube.value = this.volume * 100;
        volumePercentage.textContent = `${Math.round(this.volume * 100)}%`;
        this.updateVolumeIcon(this.volume * 100);
    }

    updateVolumeIcon(volume) {
        const volumeToggleBtn = document.querySelector('.volume-toggle-btn');
        if (!volumeToggleBtn) return;

        const icon = volumeToggleBtn.querySelector('i');
        if (!icon) return;

        // Remover todas as classes de volume
        icon.className = 'fas';

        // Definir ícone baseado no nível
        if (volume === 0) {
            icon.classList.add('fa-volume-mute');
            volumeToggleBtn.setAttribute('data-volume', '0');
        } else if (volume < 50) {
            icon.classList.add('fa-volume-down');
            volumeToggleBtn.setAttribute('data-volume', 'low');
        } else {
            icon.classList.add('fa-volume-up');
            volumeToggleBtn.setAttribute('data-volume', 'high');
        }
    }

    hideVolumeSlider() {
        const volumeSliderContainer = document.querySelector('.volume-slider-container');
        const volumeToggleBtn = document.querySelector('.volume-toggle-btn');

        if (volumeSliderContainer && volumeToggleBtn) {
            volumeSliderContainer.classList.add('hidden');
            volumeSliderContainer.classList.remove('show');
            volumeToggleBtn.classList.remove('active');
        }
    }

    // Sistema de Inatividade e Auto-Interações
    initializeInactivitySystem() {
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => this.resetUserActivity(), true);
        });

        [this.musicPanel, this.settingsPanel].forEach(panel => {
            if (panel) {
                panel.addEventListener('scroll', () => this.resetPanelActivity());
                panel.addEventListener('click', () => this.resetPanelActivity());
            }
        });

        this.startInactivityTimers();
    }

    resetUserActivity() {
        this.lastUserActivity = Date.now();
        clearTimeout(this.fullscreenInactivityTimer);
        this.startFullscreenInactivityTimer();
    }

    resetPanelActivity() {
        clearTimeout(this.panelInactivityTimer);
        this.startPanelInactivityTimer();
    }

    startInactivityTimers() {
        this.startPanelInactivityTimer();
        this.startFullscreenInactivityTimer();
    }

    startPanelInactivityTimer() {
        clearTimeout(this.panelInactivityTimer);
        this.panelInactivityTimer = setTimeout(() => {
            this.closeAllPanels();
        }, 15000);
    }

    startFullscreenInactivityTimer() {
        clearTimeout(this.fullscreenInactivityTimer);
        this.fullscreenInactivityTimer = setTimeout(() => {
            if (this.isRunning && !document.fullscreenElement) {
                this.autoEnterFullscreen();
            }
        }, 60000);
    }

    autoEnterFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log('Erro ao entrar em fullscreen automático:', e);
            });
        }
    }

    setupMouseMovementTracking() {
        document.addEventListener('mousemove', this.handleMouseMovement.bind(this));
        this.hideCursor();
    }

    cleanupMouseMovementTracking() {
        document.removeEventListener('mousemove', this.handleMouseMovement.bind(this));
        this.showCursor();
    }

    handleMouseMovement() {
        this.showCursor();
        this.showExitButton();
        clearTimeout(this.mouseMovementTimer);

        this.mouseMovementTimer = setTimeout(() => {
            this.hideCursor();
            this.hideExitButton();
        }, 3000);
    }

    showCursor() {
        document.body.style.cursor = 'default';
        this.isMouseVisible = true;
    }

    hideCursor() {
        if (document.fullscreenElement) {
            document.body.style.cursor = 'none';
            this.isMouseVisible = false;
        }
    }

    showExitButton() {
        const exitBtn = document.querySelector('.exit-fullscreen-btn');
        if (exitBtn && document.fullscreenElement) {
            exitBtn.style.opacity = '1';
            exitBtn.style.visibility = 'visible';
        }
    }

    hideExitButton() {
        const exitBtn = document.querySelector('.exit-fullscreen-btn');
        if (exitBtn && document.fullscreenElement) {
            exitBtn.style.opacity = '0';
            exitBtn.style.visibility = 'hidden';
        }
    }

    handleOutsideClick(e) {
        const isClickInMusicPanel = this.musicPanel.contains(e.target);
        const isClickInSettingsPanel = this.settingsPanel.contains(e.target);
        const isClickOnToggleBtn = e.target.closest('.music-toggle-btn') || e.target.closest('.settings-toggle-btn');
        const isClickInVolumeControl = e.target.closest('.volume-control-youtube');

        if (!isClickInMusicPanel && !isClickInSettingsPanel && !isClickOnToggleBtn) {
            this.closeAllPanels();
        }

        if (!isClickInVolumeControl) {
            this.hideVolumeSlider();
        }
    }

    closeAllPanels() {
        this.musicPanel.classList.add('hidden');
        this.settingsPanel.classList.add('hidden');
        clearTimeout(this.panelInactivityTimer);
    }

    initializeAudio() {
        console.log('🎵 Sistema de áudio inicializado');
    }

    // SISTEMA DE MÚSICA
    selectCategory(category, button) {
        this.stopMusic();
        // Resetar o tempo do vídeo ao mudar de categoria
        this.currentVideoTime = 0;

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        button.classList.add('active');
        this.currentType = category;

        if (category === 'youtube') {
            this.currentPlaylist = this.currentVideoId ? [this.currentVideoId] : [];
        } else {
            this.currentPlaylist = this.playlists[category] || [];
        }

        this.currentIndex = 0;

        const categoryNames = {
            synthwave: '🌊 Synthwave',
            nature: '🌿 Sons da Natureza',
            lofi: '🎧 Lofi Hip Hop',
            youtube: '📺 YouTube'
        };

        this.updateCurrentMusicDisplay(
            categoryNames[category] || category,
            this.currentPlaylist.length > 0 ? `${this.currentPlaylist.length} faixas disponíveis` : 'Nenhuma faixa'
        );

        // Auto-play quando selecionar categoria
        if (this.currentPlaylist.length > 0) {
            setTimeout(() => {
                this.playMusic();
            }, 500);
        }

        console.log(`🎵 Categoria selecionada: ${category}`, this.currentPlaylist);
        this.saveSettings();
    }

    togglePlayPause() {
        if (this.currentPlaylist.length === 0) {
            this.showTemporaryMessage('Selecione uma categoria primeiro');
            return;
        }

        if (this.isPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }

    playMusic() {
        if (!this.isYouTubeReady || !this.youtubePlayer) {
            this.showTemporaryMessage('Player ainda não está pronto');
            console.log('🚫 YouTube player não está pronto');
            return;
        }

        if (this.currentPlaylist.length === 0) {
            this.showTemporaryMessage('Nenhuma faixa disponível');
            console.log('🚫 Nenhuma faixa disponível');
            return;
        }

        const videoId = this.currentPlaylist[this.currentIndex];

        try {
            console.log(`🎵 Tentando tocar vídeo: ${videoId} a partir de ${this.currentVideoTime}s`);
            this.youtubePlayer.loadVideoById({
                videoId: videoId,
                startSeconds: this.currentVideoTime // Iniciar no tempo salvo
            });
            this.youtubePlayer.playVideo();
            this.youtubePlayer.setVolume(this.volume * 100);
            this.isPlaying = true;
            this.wasPlayingBeforePause = true;
            this.updatePlayerControls();

            const typeNames = {
                synthwave: '🌊 Synthwave',
                nature: '🌿 Sons da Natureza',
                lofi: '🎧 Lofi Hip Hop',
                youtube: '📺 YouTube'
            };

            this.updateCurrentMusicDisplay(
                typeNames[this.currentType] || this.currentType,
                `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
            );

            this.showMusicStatus();
            console.log('🎵 Tocando:', videoId, `a partir de ${this.currentVideoTime}s`);

        } catch (error) {
            console.error('Erro ao reproduzir música:', error);
            this.showTemporaryMessage('Erro ao reproduzir música');
        }
    }

    pauseMusic() {
        if (this.youtubePlayer && this.isYouTubeReady) {
            // Salvar o tempo atual do vídeo antes de pausar
            this.currentVideoTime = this.youtubePlayer.getCurrentTime ? this.youtubePlayer.getCurrentTime() : 0;
            this.youtubePlayer.pauseVideo();
            this.isPlaying = false;
            this.updatePlayerControls();
            this.hideMusicStatus();
            console.log(`⏸️ Música pausada no tempo ${this.currentVideoTime}s`);
            this.saveSettings();
        }
    }

    stopMusic() {
        if (this.youtubePlayer && this.isYouTubeReady) {
            this.youtubePlayer.stopVideo();
            this.isPlaying = false;
            this.wasPlayingBeforePause = false;
            this.currentVideoTime = 0; // Resetar o tempo do vídeo
            this.updatePlayerControls();
            this.hideMusicStatus();
            console.log('⏹️ Música parada');
            this.saveSettings();
        }
    }

    nextTrack() {
        if (this.currentPlaylist.length > 0) {
            this.currentIndex = this.currentIndex < this.currentPlaylist.length - 1 ? this.currentIndex + 1 : 0;
            this.currentVideoTime = 0; // Resetar o tempo ao mudar de faixa
            
            if (this.isYouTubeReady && this.youtubePlayer) {
                const videoId = this.currentPlaylist[this.currentIndex];
                this.youtubePlayer.loadVideoById(videoId);
                
                if (this.isPlaying) {
                    this.youtubePlayer.playVideo();
                    this.youtubePlayer.setVolume(this.volume * 100);
                }

                const typeNames = {
                    lofi: '🎧 Lofi Hip Hop',
                    nature: '🌿 Sons da Natureza',
                    synthwave: '🌊 Synthwave',
                    youtube: '📺 YouTube'
                };

                this.updateCurrentMusicDisplay(
                    typeNames[this.currentType] || this.currentType,
                    `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
                );
            }

            console.log('🎵 Próxima faixa:', this.currentPlaylist[this.currentIndex]);
            this.saveSettings();
        }
    }

    previousTrack() {
        if (this.currentPlaylist.length > 0) {
            this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.currentPlaylist.length - 1;
            this.currentVideoTime = 0; // Resetar o tempo ao mudar de faixa
            
            if (this.isYouTubeReady && this.youtubePlayer) {
                const videoId = this.currentPlaylist[this.currentIndex];
                this.youtubePlayer.loadVideoById(videoId);
                
                if (this.isPlaying) {
                    this.youtubePlayer.playVideo();
                    this.youtubePlayer.setVolume(this.volume * 100);
                }

                const typeNames = {
                    lofi: '🎧 Lofi Hip Hop',
                    nature: '🌿 Sons da Natureza',
                    synthwave: '🌊 Synthwave',
                    youtube: '📺 YouTube'
                };

                this.updateCurrentMusicDisplay(
                    typeNames[this.currentType] || this.currentType,
                    `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
                );
            }

            console.log('🎵 Faixa anterior:', this.currentPlaylist[this.currentIndex]);
            this.saveSettings();
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
            this.currentVideoTime = 0; // Resetar o tempo ao adicionar novo vídeo
            const status = document.querySelector('.youtube-status');
            
            if (status) {
                status.classList.remove('hidden');
                status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando link...';
                
                setTimeout(() => {
                    status.innerHTML = '<i class="fas fa-check"></i> Link adicionado com sucesso!';
                    setTimeout(() => {
                        status.classList.add('hidden');
                    }, 2000);
                }, 1000);
            }

            console.log('✅ Vídeo do YouTube configurado:', videoId);
            this.saveSettings();
        } else {
            this.showTemporaryMessage('Link inválido do YouTube');
        }
    }

    updatePlayerControls() {
        const playBtn = document.querySelector('.play-music-btn');
        const artwork = document.querySelector('.track-artwork');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (playBtn) {
            const playIcon = playBtn.querySelector('i');
            if (playIcon) {
                if (this.isPlaying) {
                    playIcon.className = 'fas fa-pause';
                    playBtn.classList.add('active');
                } else {
                    playIcon.className = 'fas fa-play';
                    playBtn.classList.remove('active');
                }
            }
        }

        if (artwork) {
            if (this.isPlaying) {
                artwork.classList.add('playing');
            } else {
                artwork.classList.remove('playing');
            }
        }

        const hasPlaylist = this.currentPlaylist.length > 1;
        if (prevBtn) prevBtn.disabled = !hasPlaylist;
        if (nextBtn) nextBtn.disabled = !hasPlaylist;
    }

    updateCurrentMusicDisplay(title, info) {
        const trackTitle = document.querySelector('.track-title');
        const trackArtist = document.querySelector('.track-artist');
        const trackCounter = document.querySelector('.track-counter');

        if (trackTitle) trackTitle.textContent = title;
        if (trackArtist) trackArtist.textContent = info;
        if (trackCounter) {
            trackCounter.textContent = `${this.currentIndex + 1} / ${this.currentPlaylist.length || 0}`;
        }

        const statusTitle = document.querySelector('.music-status .music-title');
        const statusSource = document.querySelector('.music-status .music-source');
        if (statusTitle) statusTitle.textContent = title;
        if (statusSource) statusSource.textContent = info;
    }

    showMusicStatus() {
        if (this.musicStatus) {
            this.musicStatus.classList.remove('hidden');
            this.musicStatus.classList.add('playing');
            this.animateAudioBars();
        }
    }

    hideMusicStatus() {
        if (this.musicStatus) {
            this.musicStatus.classList.add('hidden');
            this.musicStatus.classList.remove('playing');
        }
    }

    animateAudioBars() {
        const bars = document.querySelectorAll('.audio-bars .bar');
        bars.forEach((bar, index) => {
            bar.style.animationDelay = `${index * 0.1}s`;
        });
    }

    showTemporaryMessage(message) {
        const trackTitle = document.querySelector('.track-title');
        const trackArtist = document.querySelector('.track-artist');

        if (trackTitle && trackArtist) {
            const originalTitle = trackTitle.textContent;
            const originalArtist = trackArtist.textContent;

            trackTitle.textContent = message;
            trackArtist.textContent = 'Tente novamente';

            setTimeout(() => {
                if (!this.currentType) {
                    trackTitle.textContent = 'Selecione uma playlist';
                    trackArtist.textContent = 'Escolha sua música ambiente';
                } else {
                    trackTitle.textContent = originalTitle;
                    trackArtist.textContent = originalArtist;
                }
            }, 2000);
        }
    }

    // MÉTODOS DO TIMER POMODORO
    start() {
        // Log para depuração
        console.log(`🚀 Iniciando timer. isPaused: ${this.isPaused}, wasPlayingBeforePause: ${this.wasPlayingBeforePause}, isPlaying: ${this.isPlaying}, YouTubeReady: ${this.isYouTubeReady}, Playlist: ${this.currentPlaylist.length}, VideoTime: ${this.currentVideoTime}s`);

        // Verificar se a música deve ser retomada
        if (this.isPaused && this.wasPlayingBeforePause && this.currentPlaylist.length > 0 && this.isYouTubeReady && this.youtubePlayer) {
            console.log('🎵 Retomando música após pausa');
            this.playMusic();
        }

        this.isPaused = false;
        this.isRunning = true;
        document.querySelector('.timer-container').classList.add('active');

        this.timer = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgress();

            if (this.currentTime <= 0) {
                this.completeSession();
            }
        }, 1000);

        this.resetUserActivity();
        this.saveSettings();
    }

    pause() {
        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timer);
        document.querySelector('.timer-container').classList.remove('active');

        // Salvar o estado da música antes de pausar
        this.wasPlayingBeforePause = this.isPlaying;
        console.log(`⏸️ Pausando timer. Música estava tocando? ${this.wasPlayingBeforePause}`);

        // Pausar música quando pausar timer
        if (this.isPlaying) {
            this.pauseMusic();
        }

        this.saveSettings();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timer);
        document.querySelector('.timer-container').classList.remove('active');

        this.currentTime = this.getTimeForMode(this.mode);
        this.updateDisplay();
        this.updateProgress();

        // Resetar o estado da música
        this.wasPlayingBeforePause = false;
        this.currentVideoTime = 0; // Resetar o tempo do vídeo
        console.log('🔄 Resetando timer. Estado da música e tempo do vídeo resetados.');

        // Parar música quando resetar
        if (this.isPlaying) {
            this.stopMusic();
        }

        this.saveSettings();
    }

    completeSession() {
        this.isRunning = false;
        clearInterval(this.timer);
        document.querySelector('.timer-container').classList.remove('active');

        this.totalSessions++;

        if (this.mode === 'work') {
            if (this.currentSession >= this.sessionsUntilLong) {
                this.mode = 'longBreak';
                this.currentSession = 1;
            } else {
                this.mode = 'shortBreak';
                this.currentSession++;
            }
        } else {
            this.mode = 'work';
        }

        this.currentTime = this.getTimeForMode(this.mode);
        this.updateDisplay();
        this.updateProgress();
        this.updateSessionInfo();
        this.showNotification();
        this.playNotificationSound();

        if (this.autoStart) {
            setTimeout(() => this.start(), 2000);
        }

        this.saveSettings();
    }

    getTimeForMode(mode) {
        switch(mode) {
            case 'work': return this.workTime;
            case 'shortBreak': return this.shortBreak;
            case 'longBreak': return this.longBreak;
            default: return this.workTime;
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const statusTexts = {
            work: 'Foco',
            shortBreak: 'Pausa Curta',
            longBreak: 'Pausa Longa'
        };

        this.statusDisplay.textContent = statusTexts[this.mode] || 'Foco';
        document.title = `${this.timeDisplay.textContent} - ${statusTexts[this.mode]} | Pomodoro Timer`;
    }

    updateProgress() {
        const totalTime = this.getTimeForMode(this.mode);
        const progress = (totalTime - this.currentTime) / totalTime;
        const offset = this.progressCircumference - (progress * this.progressCircumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    updateSessionInfo() {
        this.sessionNumber.textContent = this.currentSession;

        const nextTexts = {
            work: this.currentSession >= this.sessionsUntilLong ? 'Pausa Longa' : 'Pausa Curta',
            shortBreak: 'Foco',
            longBreak: 'Foco'
        };

        this.nextText.textContent = nextTexts[this.mode] || 'Pausa';
    }

    togglePanel(panelType) {
        const panel = panelType === 'music' ? this.musicPanel : this.settingsPanel;
        const otherPanel = panelType === 'music' ? this.settingsPanel : this.musicPanel;

        otherPanel.classList.add('hidden');
        panel.classList.toggle('hidden');

        if (!panel.classList.contains('hidden')) {
            this.resetPanelActivity();
        } else {
            clearTimeout(this.panelInactivityTimer);
        }
    }

    closePanel(panelType) {
        const panel = panelType === 'music' ? this.musicPanel : this.settingsPanel;
        panel.classList.add('hidden');
        clearTimeout(this.panelInactivityTimer);
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            this.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen().catch(e => {
                console.log('Erro ao entrar em fullscreen:', e);
            });
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => {
                console.log('Erro ao sair do fullscreen:', e);
            });
        }
    }

    changeTheme(themeName) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        this.currentTheme = themeName;

        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelector(`[data-theme="${themeName}"]`).classList.add('active');
        this.saveSettings();
        this.updateProgressColor(themeName);
    }

    updateProgressColor(theme) {
        const colors = {
            default: '#3b82f6',
            'neon-city': '#00ffff',
            'cyber-grid': '#00ff9f',
            'space-retro': '#9370db',
            'peace': '#7c7ce8',
            'nature': '#4a9d4a'
        };

        this.progressCircle.style.stroke = colors[theme] || colors.default;
    }

    showNotification() {
        if (!this.notificationsEnabled) return;

        const messages = {
            work: { title: 'Pausa Concluída!', message: `Hora de focar por ${this.workTime/60} minutos`, emoji: '🍅' },
            shortBreak: { title: 'Sessão Concluída!', message: `Hora da pausa de ${this.shortBreak/60} minutos`, emoji: '☕' },
            longBreak: { title: 'Sessão Concluída!', message: `Hora da pausa longa de ${this.longBreak/60} minutos`, emoji: '🎉' }
        };

        const message = messages[this.mode];

        document.querySelector('.notification-title').textContent = message.title;
        document.querySelector('.notification-message').textContent = message.message;
        document.querySelector('.notif-emoji').textContent = message.emoji;

        this.notification.classList.add('show');

        setTimeout(() => {
            this.hideNotification();
        }, 5000);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(message.title, {
                body: message.message,
                icon: '/favicon.ico'
            });
        }
    }

    hideNotification() {
        this.notification.classList.remove('show');
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

        } catch (error) {
            console.log('Erro ao reproduzir som de notificação:', error);
        }
    }

    saveSettings() {
        const settings = {
            workTime: this.workTime,
            shortBreak: this.shortBreak,
            longBreak: this.longBreak,
            sessionsUntilLong: this.sessionsUntilLong,
            autoStart: this.autoStart,
            notificationsEnabled: this.notificationsEnabled,
            volume: this.volume,
            currentTheme: this.currentTheme,
            currentSession: this.currentSession,
            totalSessions: this.totalSessions,
            mode: this.mode,
            currentType: this.currentType,
            currentVideoId: this.currentVideoId,
            wasPlayingBeforePause: this.wasPlayingBeforePause,
            currentVideoTime: this.currentVideoTime // Salvar o tempo do vídeo
        };

        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);

                this.workTime = settings.workTime || this.workTime;
                this.shortBreak = settings.shortBreak || this.shortBreak;
                this.longBreak = settings.longBreak || this.longBreak;
                this.sessionsUntilLong = settings.sessionsUntilLong || this.sessionsUntilLong;
                this.autoStart = settings.autoStart || false;
                this.notificationsEnabled = settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true;
                this.volume = settings.volume || 0.5;
                this.currentTheme = settings.currentTheme || 'default';
                this.currentSession = settings.currentSession || 1;
                this.totalSessions = settings.totalSessions || 0;
                this.mode = settings.mode || 'work';
                this.currentType = settings.currentType;
                this.currentVideoId = settings.currentVideoId;
                this.wasPlayingBeforePause = settings.wasPlayingBeforePause || false;
                this.currentVideoTime = settings.currentVideoTime || 0; // Carregar o tempo do vídeo

                // Aplicar configurações na interface
                document.getElementById('work-time').value = this.workTime / 60;
                document.getElementById('short-break').value = this.shortBreak / 60;
                document.getElementById('long-break').value = this.longBreak / 60;
                document.getElementById('sessions-until-long').value = this.sessionsUntilLong;
                document.getElementById('auto-start').checked = this.autoStart;
                document.getElementById('notifications').checked = this.notificationsEnabled;

                this.changeTheme(this.currentTheme);
                this.currentTime = this.getTimeForMode(this.mode);
                this.updateSessionInfo();

            } catch (error) {
                console.log('Erro ao carregar configurações:', error);
            }
        }

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// YOUTUBE API INTEGRATION
function onYouTubeIframeAPIReady() {
    console.log('🎵 YouTube IFrame API carregado');
    
    if (window.pomodoroTimer) {
        window.pomodoroTimer.youtubePlayer = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'showinfo': 0,
                'rel': 0,
                'autoplay': 0,
                'loop': 0,
                'fs': 0,
                'cc_load_policy': 0,
                'iv_load_policy': 3,
                'modestbranding': 1
            },
            events: {
                'onReady': function(event) {
                    window.pomodoroTimer.isYouTubeReady = true;
                    console.log('✅ YouTube Player pronto para uso');
                    // Tentar retomar música se estava pausada e o timer está rodando
                    if (window.pomodoroTimer.isRunning && window.pomodoroTimer.wasPlayingBeforePause && window.pomodoroTimer.currentPlaylist.length > 0) {
                        console.log('🎵 Retomando música ao inicializar YouTube Player');
                        window.pomodoroTimer.playMusic();
                    }
                },
                'onStateChange': function(event) {
                    const timer = window.pomodoroTimer;
                    
                    if (event.data === YT.PlayerState.ENDED) {
                        console.log('🎵 Faixa terminou - próxima automática');
                        timer.nextTrack();
                    }

                    if (event.data === YT.PlayerState.PLAYING) {
                        timer.isPlaying = true;
                        timer.wasPlayingBeforePause = true;
                        timer.updatePlayerControls();
                        timer.showMusicStatus();
                        console.log('🎵 Estado: Tocando');
                    }

                    if (event.data === YT.PlayerState.PAUSED) {
                        timer.isPlaying = false;
                        // Atualizar o tempo do vídeo ao pausar
                        timer.currentVideoTime = timer.youtubePlayer.getCurrentTime ? timer.youtubePlayer.getCurrentTime() : 0;
                        timer.updatePlayerControls();
                        console.log(`🎵 Estado: Pausado no tempo ${timer.currentVideoTime}s`);
                        timer.saveSettings();
                    }
                },
                'onError': function(event) {
                    console.error('Erro no YouTube Player:', event.data);
                    window.pomodoroTimer.showTemporaryMessage('Erro ao reproduzir vídeo');
                }
            }
        });
    } else {
        console.log('⚠️ Timer ainda não inicializado - tentando novamente...');
        setTimeout(() => {
            if (window.pomodoroTimer) {
                onYouTubeIframeAPIReady();
            }
        }, 1000);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Pomodoro Timer');
    window.pomodoroTimer = new PomodoroTimer();
    
    if (window.YT && window.YT.Player) {
        onYouTubeIframeAPIReady();
    }
});

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;