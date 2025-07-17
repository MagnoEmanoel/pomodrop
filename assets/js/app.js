// Pomodrop Timer App – versão completa e corrigida

class PomodoroTimer{
    constructor(){
        this.workTime    = 25*60;
        this.breakTime   = 5*60;
        this.currentTime = this.workTime;
        this.isRunning   = false;
        this.isWorkSession = true;
        this.timer       = null;
        this.sessionCount= 1;

        // Auto-hide timers (15 segundos)
        this.musicPanelTimer = null;
        this.settingsPanelTimer = null;
        
        // Modo infinito
        this.infiniteStartTime = 0;
        this.isInfiniteMode = false;

        this.audioManager = new AudioManager();
        this.settings     = this.loadSettings();
        this.init();
    }

    /* ---------- Inicialização ---------- */
    async init(){
        await this.waitForDOM();
        this.initializeElements();
        this.bindEvents();
        this.bindMusicPlayerEvents();
        this.applySettings();
        this.updateDisplay();
        this.setupNotifications();
        this.updateMusicPlayerUI();
        console.log('✅ Pomodrop Timer inicializado com sucesso!');
    }
    waitForDOM(){
        return new Promise(res=>{
            if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',res);}
            else{res();}
        });
    }

    /* ---------- Elementos ---------- */
    initializeElements(){
        const $ = id=>document.getElementById(id);

        this.timeText        = $('timeText');
        this.progressBar     = $('progressBar');
        this.timerStatus     = $('timerStatus');
        this.timerContainer  = document.querySelector('.timer-container');
        this.sessionNumber   = $('sessionNumber');
        this.nextSession     = $('nextSession');

        this.playBtn         = $('playBtn');
        this.pauseBtn        = $('pauseBtn');
        this.resetBtn        = $('resetBtn');
        this.settingsBtn     = $('settingsBtn');

        this.musicToggle     = $('musicToggle');
        this.fullscreenBtn   = $('fullscreenBtn');
        this.exitFullscreenBtn = $('exitFullscreenBtn');

        this.musicPanel      = $('musicPanel');
        this.settingsPanel   = $('settingsPanel');

        this.workTimeInput   = $('workTime');
        this.breakTimeInput  = $('breakTime');
        this.infiniteMode    = $('infiniteMode');
        this.pauseMusicWithTimer = $('pauseMusicWithTimer');
        this.activityType    = $('activityType');

        this.musicBtns       = document.querySelectorAll('.music-btn');
        this.volumeSlider    = $('volumeSlider');
        this.volumeValue     = $('volumeValue');
        this.audioUpload     = $('audioUpload');
        this.bgBtns          = document.querySelectorAll('.bg-btn');

        // YouTube elements
        this.youtubeLink     = $('youtubeLink');
        this.addYoutubeBtn   = $('addYoutubeBtn');
        this.youtubeStatus   = $('youtubeStatus');

        // Music player controls
        this.musicPlayBtn    = $('musicPlayBtn');
        this.musicPauseBtn   = $('musicPauseBtn');
        this.musicPrevBtn    = $('musicPrevBtn');
        this.musicNextBtn    = $('musicNextBtn');

        this.currentMusicTitle = $('currentMusicTitle');
        this.musicSource     = $('musicSource');
        this.musicStatus     = $('musicStatus');
        this.notification    = $('notification');

        console.log('✅ Elementos inicializados');
    }

    /* ---------- Event Bindings ---------- */
    bindEvents(){
        // Timer controls
        this.playBtn?.addEventListener('click',()=>this.startTimer());
        this.pauseBtn?.addEventListener('click',()=>this.pauseTimer());
        this.resetBtn?.addEventListener('click',()=>this.resetTimer());
        this.settingsBtn?.addEventListener('click',()=>this.toggleSettings());

        // Header controls
        this.musicToggle?.addEventListener('click',()=>this.toggleMusic());
        this.fullscreenBtn?.addEventListener('click',()=>this.toggleFullscreen());
        this.exitFullscreenBtn?.addEventListener('click',()=>this.exitFullscreen());

        // Settings
        this.workTimeInput?.addEventListener('change',()=>this.updateWorkTime());
        this.breakTimeInput?.addEventListener('change',()=>this.updateBreakTime());
        this.infiniteMode?.addEventListener('change',()=>this.toggleInfiniteMode());
        this.pauseMusicWithTimer?.addEventListener('change',()=>this.togglePauseMusicWithTimer());
        this.activityType?.addEventListener('change',()=>this.updateActivityType());

        // Music controls
        this.musicBtns.forEach(btn=>{
            btn.addEventListener('click',()=>this.selectMusic(btn.dataset.type));
        });
        this.volumeSlider?.addEventListener('input',()=>this.updateVolume());
        this.audioUpload?.addEventListener('change',()=>this.handleAudioUpload());

        // YouTube
        this.addYoutubeBtn?.addEventListener('click',()=>this.addYoutubeLink());

        // Background selection
        this.bgBtns?.forEach(btn=>{
            btn.addEventListener('click',()=>this.changeBackground(btn.dataset.bg));
        });

        // Panel close buttons
        document.getElementById('musicPanelClose')?.addEventListener('click',()=>this.hideMusicPanel());
        document.getElementById('settingsPanelClose')?.addEventListener('click',()=>this.hideSettingsPanel());
        document.getElementById('notificationClose')?.addEventListener('click',()=>this.hideNotification());

        // Close panels when clicking outside
        document.addEventListener('click',(e)=>{
            if(this.musicPanel && !this.musicPanel.contains(e.target) && 
               this.musicToggle && !this.musicToggle.contains(e.target)){
                this.hideMusicPanel();
            }
            if(this.settingsPanel && !this.settingsPanel.contains(e.target) && 
               this.settingsBtn && !this.settingsBtn.contains(e.target)){
                this.hideSettingsPanel();
            }
        });

        // Auto-hide panel timers
        this.musicPanel?.addEventListener('mouseenter',()=>this.clearMusicPanelTimer());
        this.musicPanel?.addEventListener('mouseleave',()=>this.startMusicPanelTimer());
        this.musicPanel?.addEventListener('click',()=>this.resetMusicPanelTimer());

        this.settingsPanel?.addEventListener('mouseenter',()=>this.clearSettingsPanelTimer());
        this.settingsPanel?.addEventListener('mouseleave',()=>this.startSettingsPanelTimer());
        this.settingsPanel?.addEventListener('click',()=>this.resetSettingsPanelTimer());

        // Fullscreen events
        document.addEventListener('fullscreenchange',()=>this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange',()=>this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange',()=>this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange',()=>this.handleFullscreenChange());

        // Keyboard shortcuts
        document.addEventListener('keydown',(e)=>{
            if(e.code==='Space' && !e.target.matches('input,select,textarea')){
                e.preventDefault();
                this.isRunning ? this.pauseTimer() : this.startTimer();
            }
            if(e.code==='Escape'){this.resetTimer();}
        });

        console.log('✅ Event listeners configurados');
    }

    /* ---------- Music Player Controls ---------- */
    bindMusicPlayerEvents(){
        this.musicPlayBtn?.addEventListener('click',()=>{
            this.audioManager.resumeMusic();
            this.updateMusicPlayerUI();
        });
        this.musicPauseBtn?.addEventListener('click',()=>{
            this.audioManager.pauseMusic();
            this.updateMusicPlayerUI();
        });
        this.musicPrevBtn?.addEventListener('click',()=>{
            this.audioManager.previousTrack();
            this.updateMusicPlayerUI();
        });
        this.musicNextBtn?.addEventListener('click',()=>{
            this.audioManager.nextTrack();
            this.updateMusicPlayerUI();
        });
    }

    updateMusicPlayerUI(){
        // Atualizar botões play/pause
        if(this.audioManager.isPlaying){
            this.musicPlayBtn?.classList.remove('primary');
            this.musicPauseBtn?.classList.add('primary');
        }else{
            this.musicPlayBtn?.classList.add('primary');
            this.musicPauseBtn?.classList.remove('primary');
        }

        // Habilitar/desabilitar navegação
        const hasPlaylist = this.audioManager.currentPlaylist.length > 0;
        if(this.musicPrevBtn) this.musicPrevBtn.disabled = !hasPlaylist;
        if(this.musicNextBtn) this.musicNextBtn.disabled = !hasPlaylist;

        // Forçar atualização do display
        this.audioManager.updateCurrentMusicDisplay();
    }

    /* ---------- Fullscreen Controls ---------- */
    setupFullscreenMode(){
        let mouseTimer;
        
        const showExitButton = ()=>{
            if(document.fullscreenElement){
                this.exitFullscreenBtn?.classList.add('show');
                if(mouseTimer) clearTimeout(mouseTimer);
                mouseTimer = setTimeout(()=>{
                    this.exitFullscreenBtn?.classList.remove('show');
                },3000);
            }
        };

        document.addEventListener('mousemove',()=>{
            if(document.fullscreenElement) showExitButton();
        });
        document.addEventListener('touchstart',()=>{
            if(document.fullscreenElement) showExitButton();
        });

        if(this.exitFullscreenBtn) this.exitFullscreenBtn.classList.remove('show');
    }

    handleFullscreenChange(){
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement;

        if(isFullscreen){
            document.body.classList.add('fullscreen-mode');
        }else{
            document.body.classList.remove('fullscreen-mode');
            this.exitFullscreenBtn?.classList.remove('show');
        }
    }

    exitFullscreen(){
        if(document.exitFullscreen) document.exitFullscreen();
        else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if(document.msExitFullscreen) document.msExitFullscreen();
    }

    /* ---------- Auto-hide Panel Methods (15 segundos) ---------- */
    startMusicPanelTimer(){
        this.clearMusicPanelTimer();
        this.musicPanelTimer = setTimeout(()=>this.hideMusicPanel(),15000);
    }
    clearMusicPanelTimer(){
        if(this.musicPanelTimer){clearTimeout(this.musicPanelTimer);this.musicPanelTimer=null;}
    }
    resetMusicPanelTimer(){this.clearMusicPanelTimer();this.startMusicPanelTimer();}

    startSettingsPanelTimer(){
        this.clearSettingsPanelTimer();
        this.settingsPanelTimer = setTimeout(()=>this.hideSettingsPanel(),15000);
    }
    clearSettingsPanelTimer(){
        if(this.settingsPanelTimer){clearTimeout(this.settingsPanelTimer);this.settingsPanelTimer=null;}
    }
    resetSettingsPanelTimer(){this.clearSettingsPanelTimer();this.startSettingsPanelTimer();}

    hideMusicPanel(){this.musicPanel?.classList.add('hidden');this.clearMusicPanelTimer();}
    hideSettingsPanel(){this.settingsPanel?.classList.add('hidden');this.clearSettingsPanelTimer();}

    /* ---------- Timer Control Methods ---------- */
    startTimer(){
        if(!this.isRunning){
            this.isRunning = true;
            this.playBtn?.classList.add('active');
            this.pauseBtn?.classList.remove('active');
            this.timerContainer?.classList.add('active');

            if(this.isInfiniteMode){
                this.infiniteStartTime = Date.now() - (this.currentTime * 1000);
            }

            if(this.settings.pauseMusicWithTimer){
                this.audioManager.resumeMusic();
            }

            this.timer = setInterval(()=>{
                if(this.isInfiniteMode){
                    this.currentTime = Math.floor((Date.now() - this.infiniteStartTime) / 1000);
                }else{
                    this.currentTime--;
                }
                this.updateDisplay();
                if(!this.isInfiniteMode && this.currentTime <= 0){
                    this.completeSession();
                }
            },1000);

            console.log('▶ Timer iniciado');
        }
    }

    pauseTimer(){
        if(this.isRunning){
            this.isRunning = false;
            this.playBtn?.classList.remove('active');
            this.pauseBtn?.classList.add('active');
            this.timerContainer?.classList.remove('active');
            clearInterval(this.timer);

            if(this.settings.pauseMusicWithTimer){
                this.audioManager.pauseMusic();
            }
            console.log('⏸ Timer pausado');
        }
    }

    resetTimer(){
        this.isRunning = false;
        this.playBtn?.classList.remove('active');
        this.pauseBtn?.classList.remove('active');
        this.timerContainer?.classList.remove('active');
        clearInterval(this.timer);

        if(this.isInfiniteMode){
            this.currentTime = 0;
            this.infiniteStartTime = 0;
        }else{
            this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        }
        this.updateDisplay();
        console.log('⏹ Timer resetado');
    }

    completeSession(){
        this.isRunning = false;
        this.playBtn?.classList.remove('active');
        this.pauseBtn?.classList.remove('active');
        this.timerContainer?.classList.remove('active');
        clearInterval(this.timer);

        this.audioManager.playNotification();
        
        this.showNotification(
            this.isWorkSession ? `${this.settings.activityType} Concluído!` : 'Pausa Concluída!',
            this.isWorkSession ? 'Hora da pausa' : `Hora de ${this.settings.activityType.toLowerCase()}`
        );

        if(!this.settings.infiniteMode){
            this.isWorkSession = !this.isWorkSession;
            if(this.isWorkSession) this.sessionCount++;
        }
        this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        this.updateDisplay();
    }

    updateDisplay(){
        let hours,minutes,seconds;

        if(this.isInfiniteMode){
            hours = Math.floor(this.currentTime / 3600);
            minutes = Math.floor((this.currentTime % 3600) / 60);
            seconds = this.currentTime % 60;
        }else{
            hours = Math.floor(this.currentTime / 3600);
            minutes = Math.floor((this.currentTime % 3600) / 60);
            seconds = this.currentTime % 60;
        }

        if(this.timeText){
            this.timeText.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        }

        if(this.timerStatus){
            this.timerStatus.textContent = this.isWorkSession ? this.settings.activityType : 'Pausa';
        }

        if(this.sessionNumber){
            this.sessionNumber.textContent = this.sessionCount;
        }

        if(this.nextSession){
            this.nextSession.textContent = this.isWorkSession ? 'Pausa' : this.settings.activityType;
        }

        // Update circular progress
        if(this.progressBar && !this.isInfiniteMode){
            const totalTime = this.isWorkSession ? this.workTime : this.breakTime;
            const progress = ((totalTime - this.currentTime) / totalTime) * 100;
            const circumference = 2 * Math.PI * 180;
            const offset = circumference - (progress / 100) * circumference;
            this.progressBar.style.strokeDashoffset = offset;
        }else if(this.progressBar && this.isInfiniteMode){
            this.progressBar.style.strokeDashoffset = 1130.97;
        }

        const timeForTitle = this.isInfiniteMode ? 
            `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}` :
            `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

        document.title = `${timeForTitle} - ${this.isWorkSession ? this.settings.activityType : 'Pausa'} - Pomodrop`;
    }

    /* ---------- Panel Methods ---------- */
    toggleSettings(){
        const isHidden = this.settingsPanel?.classList.contains('hidden');
        this.settingsPanel?.classList.toggle('hidden');
        this.hideMusicPanel();
        if(!isHidden){this.clearSettingsPanelTimer();}
        else{this.startSettingsPanelTimer();}
    }

    toggleMusic(){
        const isHidden = this.musicPanel?.classList.contains('hidden');
        this.musicPanel?.classList.toggle('hidden');
        this.hideSettingsPanel();
        if(!isHidden){this.clearMusicPanelTimer();}
        else{this.startMusicPanelTimer();}
    }

    toggleFullscreen(){
        if(!document.fullscreenElement){
            document.documentElement.requestFullscreen().catch(err=>{
                console.log('Erro ao entrar em tela cheia:',err);
            });
        }else{
            this.exitFullscreen();
        }
    }

    /* ---------- Settings Methods ---------- */
    updateActivityType(){
        if(this.activityType){
            this.settings.activityType = this.activityType.value;
            this.saveSettings();
            this.updateDisplay();
        }
        this.resetSettingsPanelTimer();
    }

    updateWorkTime(){
        if(this.workTimeInput){
            this.workTime = parseInt(this.workTimeInput.value) * 60;
            if(this.isWorkSession && !this.isInfiniteMode){
                this.currentTime = this.workTime;
                this.updateDisplay();
            }
            this.saveSettings();
        }
        this.resetSettingsPanelTimer();
    }

    updateBreakTime(){
        if(this.breakTimeInput){
            this.breakTime = parseInt(this.breakTimeInput.value) * 60;
            if(!this.isWorkSession && !this.isInfiniteMode){
                this.currentTime = this.breakTime;
                this.updateDisplay();
            }
            this.saveSettings();
        }
        this.resetSettingsPanelTimer();
    }

    toggleInfiniteMode(){
        this.settings.infiniteMode = this.infiniteMode?.checked || false;
        this.isInfiniteMode = this.settings.infiniteMode;

        if(this.isInfiniteMode){
            this.currentTime = 0;
            this.infiniteStartTime = 0;
        }else{
            this.currentTime = this.isWorkSession ? this.workTime : this.breakTime;
        }
        this.updateDisplay();
        this.saveSettings();
        this.resetSettingsPanelTimer();
    }

    togglePauseMusicWithTimer(){
        this.settings.pauseMusicWithTimer = this.pauseMusicWithTimer?.checked || false;
        this.saveSettings();
        this.resetSettingsPanelTimer();
    }

    /* ---------- Music Methods ---------- */
    selectMusic(type){
        this.musicBtns.forEach(btn=>btn.classList.remove('active'));
        event.target.closest('.music-btn')?.classList.add('active');

        if(type==='upload'){
            this.audioUpload?.click();
        }else{
            this.audioManager.playMusic(type);
            this.updateMusicStatus(type);
        }

        this.settings.musicType = type;
        this.saveSettings();
        this.resetMusicPanelTimer();
        this.updateMusicPlayerUI();
    }

    updateVolume(){
        if(this.volumeSlider && this.volumeValue){
            const volume = this.volumeSlider.value;
            this.volumeValue.textContent = `${volume}%`;
            this.audioManager.setVolume(volume / 100);
            this.settings.volume = volume;
            this.saveSettings();
        }
        this.resetMusicPanelTimer();
    }

    handleAudioUpload(){
        const file = this.audioUpload?.files[0];
        if(file){
            const url = URL.createObjectURL(file);
            this.audioManager.playCustomMusic(url);
            this.updateMusicStatus('upload');
        }
        this.resetMusicPanelTimer();
    }

    addYoutubeLink(){
        const link = this.youtubeLink?.value.trim();
        if(link){
            this.audioManager.setYoutubeLink(link);

            // Auto-selecionar YouTube
            this.musicBtns.forEach(btn=>btn.classList.remove('active'));
            const youtubeBtn = document.querySelector('.music-btn[data-type="youtube"]');
            if(youtubeBtn) youtubeBtn.classList.add('active');

            // Atualizar status
            if(this.youtubeStatus){
                this.youtubeStatus.innerHTML = `
                    <span class="status-icon">✅</span>
                    <span class="status-text">Vídeo carregado - Pronto para tocar</span>
                `;
            }

            this.youtubeLink.value = '';
            this.settings.musicType = 'youtube';
            this.saveSettings();
            this.updateMusicPlayerUI();

            console.log('✅ Link do YouTube adicionado');
        }
        this.resetMusicPanelTimer();
    }

    updateMusicStatus(type){
        const titles = {
            none:'Sem música',youtube:'YouTube',lofi:'Lofi Beats',
            nature:'Sons da Natureza',synthwave:'Synthwave',upload:'Áudio Personalizado'
        };
        const sources = {
            none:'Modo silencioso',youtube:'YouTube personalizado',lofi:'Música ambiente',
            nature:'Sons da natureza',synthwave:'Música retrô',upload:'Arquivo local'
        };

        if(this.currentMusicTitle) this.currentMusicTitle.textContent = titles[type] || 'Música';
        if(this.musicSource) this.musicSource.textContent = sources[type] || 'Desconhecido';
    }

    changeBackground(bg){
        this.bgBtns?.forEach(btn=>btn.classList.remove('active'));
        event.target.closest('.bg-btn')?.classList.add('active');

        document.body.className = bg==='default' ? '' : `bg-${bg}`;
        this.settings.background = bg;
        this.saveSettings();
        this.resetSettingsPanelTimer();
    }

    /* ---------- Notification Methods ---------- */
    showNotification(title,message){
        if(this.notification){
            const notificationTitle = this.notification.querySelector('.notification-title');
            const notificationMessage = this.notification.querySelector('.notification-message');
            const notifEmoji = this.notification.querySelector('.notif-emoji');

            if(notificationTitle) notificationTitle.textContent = title;
            if(notificationMessage) notificationMessage.textContent = message;
            if(notifEmoji) notifEmoji.textContent = this.isWorkSession ? '☕' : '🎉';

            this.notification.classList.remove('hidden');
            this.notification.classList.add('show');

            setTimeout(()=>this.hideNotification(),5000);
        }

        if('Notification' in window && Notification.permission==='granted'){
            new Notification(title,{body:message,icon:'/favicon.ico'});
        }
    }

    hideNotification(){
        if(this.notification){
            this.notification.classList.remove('show');
            this.notification.classList.add('hidden');
        }
    }

    setupNotifications(){
        if('Notification' in window) Notification.requestPermission();
    }

    /* ---------- Settings Persistence ---------- */
    saveSettings(){
        this.settings.workTime = this.workTimeInput ? parseInt(this.workTimeInput.value) : 25;
        this.settings.breakTime = this.breakTimeInput ? parseInt(this.breakTimeInput.value) : 5;
        this.settings.infiniteMode = this.infiniteMode?.checked || false;
        this.settings.pauseMusicWithTimer = this.pauseMusicWithTimer?.checked || false;
        this.settings.volume = this.volumeSlider ? parseInt(this.volumeSlider.value) : 30;
        this.settings.activityType = this.activityType?.value || 'Trabalho';

        localStorage.setItem('pomodoroSettings',JSON.stringify(this.settings));
    }

    loadSettings(){
        const saved = localStorage.getItem('pomodoroSettings');
        return saved ? JSON.parse(saved) : {
            workTime:25,breakTime:5,infiniteMode:false,
            pauseMusicWithTimer:true,musicType:'none',volume:30,
            background:'default',activityType:'Trabalho'
        };
    }

    applySettings(){
        if(this.workTimeInput) this.workTimeInput.value = this.settings.workTime;
        if(this.breakTimeInput) this.breakTimeInput.value = this.settings.breakTime;
        if(this.infiniteMode) this.infiniteMode.checked = this.settings.infiniteMode;
        if(this.pauseMusicWithTimer) this.pauseMusicWithTimer.checked = this.settings.pauseMusicWithTimer;
        if(this.volumeSlider) this.volumeSlider.value = this.settings.volume;
        if(this.volumeValue) this.volumeValue.textContent = `${this.settings.volume}%`;
        if(this.activityType) this.activityType.value = this.settings.activityType || 'Trabalho';

        this.workTime = this.settings.workTime * 60;
        this.breakTime = this.settings.breakTime * 60;
        this.isInfiniteMode = this.settings.infiniteMode;

        if(this.isInfiniteMode){
            this.currentTime = 0;
        }else{
            this.currentTime = this.workTime;
        }

        if(this.settings.background !== 'default'){
            document.body.className = `bg-${this.settings.background}`;
        }

        this.bgBtns?.forEach(btn=>{
            btn.classList.toggle('active',btn.dataset.bg === this.settings.background);
        });

        this.updateMusicStatus(this.settings.musicType);

        setTimeout(()=>{
            this.audioManager.setVolume(this.settings.volume / 100);
        },100);
    }
}

/* ---------- AUDIO MANAGER CLASS ---------- */
class AudioManager{
    constructor(){
        this.audioPlayer = null;
        this.youtubePlayer = null;
        this.currentMusic = null;
        this.volume = 0.3;
        this.isPlaying = false;
        this.currentType = 'none';
        this.currentVideoId = null;
        this.isYouTubeReady = false;
        this.predefinedMusics = {
            synthwave:['KQI-_q5SsoU','8GW6sLrK40k','R7NvGItVlA8'],
            nature:['xNN7iTA57jM','SnUBb-FAlCY'],
            lofi:['CLeZyIID9Bo','9kzE8isXlQY']
        };
        this.currentPlaylist = [];
        this.currentIndex = 0;

        this.setupAudioPlayer();
        this.initializeYouTubeAPI();
    }

    setupAudioPlayer(){
        if(!document.getElementById('audioPlayer')){
            this.audioPlayer = document.createElement('audio');
            this.audioPlayer.id = 'audioPlayer';
            this.audioPlayer.loop = true;
            this.audioPlayer.volume = this.volume;
            document.body.appendChild(this.audioPlayer);
        }else{
            this.audioPlayer = document.getElementById('audioPlayer');
        }
    }

    initializeYouTubeAPI(){
        if(typeof YT !== 'undefined' && YT.Player){
            this.onYouTubeReady();
        }else{
            window.onYouTubeIframeAPIReady = ()=>this.onYouTubeReady();
        }
    }

    onYouTubeReady(){
        try{
            if(!document.getElementById('youtubePlayer')){
                const container = document.createElement('div');
                container.id = 'youtubePlayer';
                container.style.display = 'none';
                container.style.position = 'absolute';
                container.style.top = '-9999px';
                document.body.appendChild(container);
            }

            this.youtubePlayer = new YT.Player('youtubePlayer',{
                height:'1',width:'1',
                playerVars:{
                    autoplay:0,controls:0,loop:0,modestbranding:1,rel:0,showinfo:0,
                    fs:0,cc_load_policy:0,iv_load_policy:3,enablejsapi:1,
                    origin:window.location.origin
                },
                events:{
                    onReady:()=>{
                        this.isYouTubeReady = true;
                        console.log('✅ YouTube player pronto');
                    },
                    onStateChange:(event)=>{
                        if(event.data === YT.PlayerState.ENDED){
                            this.playNextInPlaylist();
                        }
                        if(event.data === YT.PlayerState.PLAYING){
                            this.isPlaying = true;
                        }
                        if(event.data === YT.PlayerState.PAUSED){
                            this.isPlaying = false;
                        }
                    },
                    onError:(error)=>{
                        console.warn('YouTube player error:',error);
                        if(this.currentPlaylist.length > 1){
                            this.playNextInPlaylist();
                        }
                    }
                }
            });
        }catch(error){
            console.error('Erro ao inicializar YouTube player:',error);
            this.isYouTubeReady = false;
        }
    }

    /* ---------- Playback Control Methods ---------- */
    playNextInPlaylist(){
        if(this.currentPlaylist.length > 0){
            this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.length;
            const nextVideoId = this.currentPlaylist[this.currentIndex];

            if(this.isYouTubeReady && this.youtubePlayer){
                this.youtubePlayer.loadVideoById(nextVideoId);
                this.youtubePlayer.playVideo();
                this.youtubePlayer.setVolume(this.volume * 100);
                this.isPlaying = true;

                // Atualizar display imediatamente
                const typeNames = {
                    lofi:'Lofi Beats',
                    nature:'Sons da Natureza',
                    synthwave:'Synthwave'
                };
                this.updateCurrentMusicDisplay(
                    typeNames[this.currentType] || this.currentType,
                    `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
                );
            }
            console.log('🎵 Próxima música:',nextVideoId);
        }
    }

    nextTrack(){
        if(this.currentPlaylist.length > 0){
            this.playNextInPlaylist();
        }
    }

    previousTrack(){
        if(this.currentPlaylist.length > 0){
            this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.currentPlaylist.length - 1;
            const videoId = this.currentPlaylist[this.currentIndex];

            if(this.isYouTubeReady && this.youtubePlayer){
                this.youtubePlayer.loadVideoById(videoId);
                this.youtubePlayer.playVideo();
                this.youtubePlayer.setVolume(this.volume * 100);
                this.isPlaying = true;

                // Atualizar display imediatamente
                const typeNames = {
                    lofi:'Lofi Beats',
                    nature:'Sons da Natureza',
                    synthwave:'Synthwave'
                };
                this.updateCurrentMusicDisplay(
                    typeNames[this.currentType] || this.currentType,
                    `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
                );
            }
            console.log('🎵 Faixa anterior:',videoId);
        }
    }

    extractVideoId(url){
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    setYoutubeLink(url){
        const videoId = this.extractVideoId(url);
        if(videoId){
            this.currentVideoId = videoId;
            console.log('✅ Vídeo do YouTube configurado:',videoId);
        }
    }

    playMusic(type){
        this.currentType = type;

        if(type === 'none'){
            this.stopMusic();
            return;
        }

        if(type === 'youtube' && this.currentVideoId && this.isYouTubeReady){
            this.youtubePlayer.loadVideoById(this.currentVideoId);
            this.youtubePlayer.playVideo();
            this.youtubePlayer.setVolume(this.volume * 100);
            this.isPlaying = true;
            this.updateCurrentMusicDisplay('YouTube','Vídeo personalizado');
            console.log('🎵 Tocando YouTube personalizado:',this.currentVideoId);
            return;
        }

        if(this.predefinedMusics[type] && this.isYouTubeReady){
            this.currentPlaylist = [...this.predefinedMusics[type]]; // Fazer cópia
            this.currentIndex = 0;
            const videoId = this.currentPlaylist[this.currentIndex];

            this.youtubePlayer.loadVideoById(videoId);
            this.youtubePlayer.playVideo();
            this.youtubePlayer.setVolume(this.volume * 100);
            this.isPlaying = true;

            // Atualizar display imediatamente
            const typeNames = {
                lofi:'Lofi Beats',
                nature:'Sons da Natureza',
                synthwave:'Synthwave'
            };
            this.updateCurrentMusicDisplay(
                typeNames[type] || type,
                `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
            );

            console.log('🎵 Tocando playlist:',type,'Vídeo:',videoId);
            return;
        }

        this.playFallbackMusic(type);
    }

    playFallbackMusic(type){
        console.log('🎵 Tocando som ambiente:',type);
        this.isPlaying = true;
        this.updateCurrentMusicDisplay('Som Ambiente',type);
    }

    playCustomMusic(url){
        this.stopMusic();
        if(this.audioPlayer){
            this.audioPlayer.src = url;
            this.audioPlayer.volume = this.volume;
            this.audioPlayer.play();
            this.currentMusic = this.audioPlayer;
            this.isPlaying = true;
            this.updateCurrentMusicDisplay('Arquivo Local','MP3 Personalizado');
        }
    }

    pauseMusic(){
        if(this.youtubePlayer && this.isPlaying){
            this.youtubePlayer.pauseVideo();
        }
        if(this.audioPlayer && !this.audioPlayer.paused){
            this.audioPlayer.pause();
        }
        this.isPlaying = false;
        console.log('⏸ Música pausada');
    }

    resumeMusic(){
        if(this.currentType === 'none') return;

        if(this.youtubePlayer && !this.isPlaying){
            this.youtubePlayer.playVideo();
            this.isPlaying = true;
        }
        if(this.audioPlayer && this.currentMusic && this.audioPlayer.paused){
            this.audioPlayer.play();
            this.isPlaying = true;
        }

        // Atualizar display se necessário
        if(this.currentPlaylist.length > 0){
            const typeNames = {
                lofi:'Lofi Beats',
                nature:'Sons da Natureza',
                synthwave:'Synthwave'
            };
            this.updateCurrentMusicDisplay(
                typeNames[this.currentType] || this.currentType,
                `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`
            );
        }
        console.log('▶ Música retomada');
    }

    stopMusic(){
        if(this.youtubePlayer) this.youtubePlayer.stopVideo();
        if(this.audioPlayer){
            this.audioPlayer.pause();
            this.audioPlayer.src = '';
        }
        this.isPlaying = false;
        this.updateCurrentMusicDisplay('Nenhuma música','Silencioso');
        console.log('⏹ Música parada');
    }

    setVolume(volume){
        this.volume = volume;
        if(this.youtubePlayer && this.isYouTubeReady){
            this.youtubePlayer.setVolume(volume * 100);
        }
        if(this.audioPlayer) this.audioPlayer.volume = volume;
    }

    /* ---------- UI Update Methods ---------- */
    updateCurrentMusicDisplay(title = null,artist = null){
        const musicTitle = document.querySelector('.current-music .music-title');
        const musicArtist = document.querySelector('.current-music .music-artist');

        if(title && artist){
            if(musicTitle) musicTitle.textContent = title;
            if(musicArtist) musicArtist.textContent = artist;
        }else{
            // Atualizar baseado no estado atual
            if(this.currentType === 'none' || !this.isPlaying){
                if(musicTitle) musicTitle.textContent = 'Nenhuma música';
                if(musicArtist) musicArtist.textContent = 'Silencioso';
            }else if(this.currentType === 'youtube' && this.currentVideoId){
                if(musicTitle) musicTitle.textContent = 'YouTube';
                if(musicArtist) musicArtist.textContent = 'Vídeo personalizado';
            }else if(this.currentPlaylist.length > 0){
                const typeNames = {
                    lofi:'Lofi Beats',
                    nature:'Sons da Natureza',
                    synthwave:'Synthwave'
                };
                if(musicTitle) musicTitle.textContent = typeNames[this.currentType] || this.currentType;
                if(musicArtist) musicArtist.textContent = `Faixa ${this.currentIndex + 1}/${this.currentPlaylist.length}`;
            }
        }
    }

    playNotification(){
        try{
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800,audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600,audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(400,audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3,audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01,audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }catch(error){
            console.log('Notificação sonora não suportada');
        }
    }
}

/* ---------- Initialize app ---------- */
document.addEventListener('DOMContentLoaded',()=>{
    new PomodoroTimer();
});
