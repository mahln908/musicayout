// Configuração protegida da API Key
const API_KEY = (() => {
    const part1 = "AIzaSy";
    const part2 = "C_8CHx";
    const part3 = "OvjcNCs36B";
    const part4 = "-Omt3v5VjzVA";
    const part5 = "azdIw";
    return part1 + part2 + part3 + part4 + part5;
})();

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

// Funções de busca
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
    elements.results.innerHTML = '';
    
    if (videos.length === 0) {
        elements.results.innerHTML = '<div class="result-item" style="justify-content:center">Nenhum resultado encontrado</div>';
        return;
    }
    
    videos.forEach((video, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.onclick = () => playVideo(index);
        
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url || '';
        
        resultItem.innerHTML = `
            <div class="result-thumbnail" style="background-image:url('${thumbnailUrl}')"></div>
            <div class="result-info">
                <h3>${video.snippet.title}</h3>
                <p>${video.snippet.channelTitle}</p>
            </div>
        `;
        
        elements.results.appendChild(resultItem);
    });
}

// Controles de reprodução
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
    updateMediaSession();
    
    if (player) {
        player.loadVideoById(currentVideoId);
        player.playVideo();
    }
}

function playNext() {
    if (searchResults.length === 0) return;
    currentIndex = (currentIndex + 1) % searchResults.length;
    playVideo(currentIndex);
    showNotification('Próxima música');
}

function playPrev() {
    if (searchResults.length === 0) return;
    currentIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
    playVideo(currentIndex);
    showNotification('Música anterior');
}

function playRandomSimilar() {
    if (searchResults.length === 0) return;
    
    const similarSongs = searchResults.filter((_, i) => {
        if (i === currentIndex) return false;
        const style = detectMusicStyle(searchResults[i].snippet.title);
        return style === currentMusicStyle;
    });
    
    const randomIndex = similarSongs.length > 0 ? 
        searchResults.findIndex(item => item.id.videoId === similarSongs[Math.floor(Math.random() * similarSongs.length)].id.videoId) :
        Math.floor(Math.random() * searchResults.length);
    
    playVideo(randomIndex);
    showNotification('Aleatório: Similar');
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
            if (player) player.playVideo();
            isPlaying = true;
            updatePlayButton();
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            if (player) player.pauseVideo();
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

function updateUI() {
    elements.nowPlayingTitle.textContent = currentVideoTitle;
    elements.nowPlayingArtist.textContent = currentVideoArtist;
    elements.playerTitle.textContent = currentVideoTitle;
    
    if (currentVideoThumbnail) {
        elements.playerThumbnail.style.backgroundImage = `url(${currentVideoThumbnail})`;
    }
    
    updateFavoriteButton();
    updateUpNextList();
}

function updateUpNextList() {
    elements.upNextList.innerHTML = '';
    
    for (let i = 1; i <= 20; i++) {
        const nextIndex = (currentIndex + i) % searchResults.length;
        const video = searchResults[nextIndex];
        if (!video) continue;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.onclick = () => playVideo(nextIndex);
        
        const thumbnailUrl = video.snippet.thumbnails?.medium?.url || '';
        
        resultItem.innerHTML = `
            <div class="result-thumbnail" style="background-image:url('${thumbnailUrl}')"></div>
            <div class="result-info">
                <h3>${video.snippet.title}</h3>
                <p>${video.snippet.channelTitle}</p>
            </div>
        `;
        
        elements.upNextList.appendChild(resultItem);
    }
}

function updatePlayButton() {
    elements.playButton.textContent = isPlaying ? '⏸' : '▶';
}

function updateProgressBar() {
    clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (!player) return;
        
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            elements.progress.style.width = `${percent}%`;
            
            elements.currentTime.textContent = formatTime(currentTime);
            elements.duration.textContent = formatTime(duration);
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function toggleFavorite() {
    const index = favorites.findIndex(fav => fav.id === currentVideoId);
    
    if (index === -1) {
        favorites.push({
            id: currentVideoId,
            title: currentVideoTitle,
            artist: currentVideoArtist,
            thumbnail: currentVideoThumbnail
        });
        showNotification('Adicionado aos favoritos');
    } else {
        favorites.splice(index, 1);
        showNotification('Removido dos favoritos');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton();
}

function updateFavoriteButton() {
    const isFavorite = favorites.some(fav => fav.id === currentVideoId);
    elements.favoriteBtn.classList.toggle('active', isFavorite);
}

function goBack() {
    elements.mainContainer.style.display = 'block';
    elements.playerPage.style.display = 'none';
    elements.mainHeader.style.display = 'flex';
}

// Event Listeners
function setupEventListeners() {
    elements.searchButton.addEventListener('click', searchVideos);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchVideos();
    });
    
    elements.playButton.addEventListener('click', () => {
        if (!player) return;
        if (isPlaying) player.pauseVideo();
        else player.playVideo();
    });
    
    elements.prevButton.addEventListener('click', () => {
        if (isShuffleMode) playRandomSimilar();
        else playPrev();
    });
    
    elements.nextButton.addEventListener('click', () => {
        if (isShuffleMode) playRandomSimilar();
        else playNext();
    });
    
    elements.progressBar.addEventListener('click', (e) => {
        if (!player) return;
        const rect = elements.progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        player.seekTo(player.getDuration() * pos);
    });
    
    elements.favoriteBtn.addEventListener('click', toggleFavorite);
    elements.backButton.addEventListener('click', goBack);
    
    elements.spotifyPlayer.addEventListener('click', function(e) {
        if (!e.target.closest('.control-buttons') && !e.target.closest('.favorite-btn') && currentVideoId) {
            elements.mainContainer.style.display = 'none';
            elements.playerPage.style.display = 'block';
            elements.mainHeader.style.display = 'none';
        }
    });
    
    // Teclas de atalho
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (player) {
                if (isPlaying) player.pauseVideo();
                else player.playVideo();
            }
        }
        
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (isShuffleMode) playRandomSimilar();
            else playNext();
        }
        
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (isShuffleMode) playRandomSimilar();
            else playPrev();
        }
        
        if (e.code === 'KeyS') {
            e.preventDefault();
            isShuffleMode = !isShuffleMode;
            showNotification(isShuffleMode ? 'Modo aleatório ativado' : 'Modo aleatório desativado');
        }
    });
}

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
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registrado com sucesso');
            registration.update();
        }).catch(err => {
            console.log('Falha no registro do ServiceWorker:', err);
        });
    });
}

// Iniciar
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    elements.spotifyPlayer.style.display = 'none';
    
    setTimeout(() => {
        elements.splashScreen.style.display = 'none';
    }, 2500);
});
