// Configurações
const API_KEY = 'SUA_CHAVE_DE_API_YOUTUBE';

// Variáveis globais
let player;
let currentVideoId = '';
let currentVideoTitle = '';
let currentVideoArtist = '';
let currentVideoThumbnail = '';
let searchResults = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffleMode = false;
let currentMusicStyle = '';
let progressInterval;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let notificationTimeout;

// Elementos DOM
const elements = {
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    results: document.getElementById('results'),
    mainContainer: document.getElementById('main-container'),
    playerPage: document.getElementById('player-page'),
    backButton: document.getElementById('back-button'),
    mobileBackButton: document.getElementById('mobile-back-button'),
    spotifyPlayer: document.getElementById('spotify-player'),
    playButton: document.getElementById('play-button'),
    prevButton: document.getElementById('prev-button'),
    nextButton: document.getElementById('next-button'),
    progressBar: document.getElementById('progress-bar'),
    progress: document.getElementById('progress'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    nowPlayingTitle: document.getElementById('now-playing-title'),
    nowPlayingArtist: document.getElementById('now-playing-artist'),
    playerThumbnail: document.getElementById('player-thumbnail'),
    favoriteBtn: document.getElementById('favorite-btn'),
    upNextList: document.getElementById('up-next-list'),
    playerTitle: document.getElementById('player-title'),
    mainHeader: document.getElementById('main-header'),
    splashScreen: document.getElementById('splash-screen'),
    notification: document.getElementById('notification')
};

// Funções do Player
function onPlayerReady(event) {
    console.log('Player pronto');
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayButton();
        updateProgressBar();
        updateMediaSession();
    } else if (event.data == YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayButton();
        clearInterval(progressInterval);
        updateMediaSession();
    } else if (event.data == YT.PlayerState.ENDED) {
        if (isShuffleMode) playRandomSimilar();
        else playNext();
    }
}

// Funções de busca e exibição
async function searchVideos() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`);
        const data = await response.json();
        searchResults = data.items;
        displayResults(data.items);
    } catch (error) {
        console.error('Erro na busca:', error);
        elements.results.innerHTML = '<div class="result-item" style="justify-content:center;color:red">Erro ao buscar vídeos. Tente novamente.</div>';
    }
}

function displayResults(videos) {
    elements.results.innerHTML = videos.length === 0 ? 
        '<div class="result-item" style="justify-content:center">Nenhum resultado encontrado</div>' : 
        videos.map((video, index) => `
            <div class="result-item" onclick="playVideo(${index})">
                <div class="result-thumbnail" style="background-image:url('${video.snippet.thumbnails?.medium?.url || ''}')"></div>
                <div class="result-info">
                    <h3>${video.snippet.title}</h3>
                    <p>${video.snippet.channelTitle}</p>
                </div>
            </div>
        `).join('');
}

// Funções de controle de reprodução
function playVideo(index) {
    const video = searchResults[index];
    if (!video) return;
    
    currentVideoId = video.id.videoId;
    currentVideoTitle = video.snippet.title;
    currentVideoArtist = video.snippet.channelTitle;
    currentVideoThumbnail = video.snippet.thumbnails?.medium?.url || '';
    currentIndex = index;
    currentMusicStyle = detectMusicStyle(currentVideoTitle);
    
    updateUI();
    if (player) {
        player.loadVideoById(currentVideoId);
        player.playVideo();
    }
}

function playNext() {
    if (searchResults.length === 0) return;
    currentIndex = (currentIndex + 1) % searchResults.length;
    playVideo(currentIndex);
}

function playPrev() {
    if (searchResults.length === 0) return;
    currentIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
    playVideo(currentIndex);
}

function playRandomSimilar() {
    const similarSongs = searchResults.filter((_, i) => 
        i !== currentIndex && detectMusicStyle(searchResults[i].snippet.title) === currentMusicStyle
    );
    
    const randomIndex = similarSongs.length > 0 ? 
        searchResults.findIndex(i => i.id.videoId === similarSongs[Math.floor(Math.random() * similarSongs.length)].id.videoId) :
        Math.floor(Math.random() * searchResults.length);
    
    playVideo(randomIndex);
}

// Funções auxiliares
function detectMusicStyle(title) {
    const styles = {
        'house': ['house', 'deep house', 'tech house', 'edm'],
        'rock': ['rock', 'alternative', 'indie rock'],
        'pop': ['pop', 'top 40', 'hit'],
        'hiphop': ['hip hop', 'rap', 'trap'],
        'jazz': ['jazz', 'bossa nova', 'blues']
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [style, keywords] of Object.entries(styles)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) return style;
    }
    return 'unknown';
}

function showNotification(message) {
    elements.notification.textContent = message;
    elements.notification.style.display = 'block';
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        elements.notification.style.display = 'none';
    }, 2000);
}

function updateMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentVideoTitle,
            artist: currentVideoArtist,
            artwork: [
                { src: currentVideoThumbnail, sizes: '96x96', type: 'image/jpeg' },
                { src: currentVideoThumbnail, sizes: '128x128', type: 'image/jpeg' },
                { src: currentVideoThumbnail, sizes: '192x192', type: 'image/jpeg' },
                { src: currentVideoThumbnail, sizes: '256x256', type: 'image/jpeg' },
                { src: currentVideoThumbnail, sizes: '384x384', type: 'image/jpeg' },
                { src: currentVideoThumbnail, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
        
        navigator.mediaSession.setActionHandler('play', () => {
            player.playVideo();
            isPlaying = true;
            updatePlayButton();
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            player.pauseVideo();
            isPlaying = false;
            updatePlayButton();
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (isShuffleMode) playRandomSimilar();
            else playPrev();
        });
        
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            if (isShuffleMode) playRandomSimilar();
            else playNext();
        });
    }
}

// [Restante das funções...]

// Inicialização
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'disablekb': 1,
            'modestbranding': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registrado'))
            .catch(err => console.log('SW erro:', err));
    });
}
