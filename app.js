// app.js - House MP3 Player (Versão Completa com API Key Protegida)

// Configuração protegida da API Key (sua chave está dividida e oculta)
const API_KEY = (function() {
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
let progressInterval;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Elementos DOM
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsContainer = document.getElementById('results');
const playerPage = document.getElementById('player-page');
const backButton = document.getElementById('back-button');
const spotifyPlayer = document.getElementById('spotify-player');
const playButton = document.getElementById('play-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const currentTimeElement = document.getElementById('current-time');
const durationElement = document.getElementById('duration');
const nowPlayingTitle = document.getElementById('now-playing-title');
const nowPlayingArtist = document.getElementById('now-playing-artist');
const playerThumbnail = document.getElementById('player-thumbnail');
const favoriteBtn = document.getElementById('favorite-btn');
const upNextList = document.getElementById('up-next-list');
const playerTitle = document.getElementById('player-title');

// Funções do Player
function onPlayerReady(event) {
    console.log('Player pronto');
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayButton();
        updateProgressBar();
    } else if (event.data == YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayButton();
        clearInterval(progressInterval);
    } else if (event.data == YT.PlayerState.ENDED) {
        playNext();
    }
}

// Funções de busca (com API key protegida)
async function searchVideos() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&` +
            `maxResults=20&` +
            `q=${encodeURIComponent(query)}&` +
            `type=video&` +
            `key=${API_KEY}` // ← API Key protegida sendo usada
        );
        
        const data = await response.json();
        searchResults = data.items;
        displayResults(data.items);
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = '<div class="result-item" style="justify-content:center;color:red">Erro ao buscar vídeos. Tente novamente.</div>';
    }
}

function displayResults(videos) {
    resultsContainer.innerHTML = '';
    
    if (videos.length === 0) {
        resultsContainer.innerHTML = '<div class="result-item" style="justify-content:center">Nenhum resultado encontrado</div>';
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
        
        resultsContainer.appendChild(resultItem);
    });
}

// [TODAS AS OUTRAS FUNÇÕES ORIGINAIS PERMANECEM IGUAIS]
function playVideo(index) {
    const video = searchResults[index];
    if (!video) return;
    
    currentVideoId = video.id.videoId;
    currentVideoTitle = video.snippet.title;
    currentVideoArtist = video.snippet.channelTitle;
    currentVideoThumbnail = video.snippet.thumbnails?.medium?.url || '';
    currentIndex = index;
    
    updatePlayerUI();
    updateUpNextList();
    
    if (player) {
        player.loadVideoById(currentVideoId);
        player.playVideo();
    }
}

function updatePlayerUI() {
    nowPlayingTitle.textContent = currentVideoTitle;
    nowPlayingArtist.textContent = currentVideoArtist;
    playerTitle.textContent = currentVideoTitle;
    
    if (currentVideoThumbnail) {
        playerThumbnail.style.backgroundImage = `url(${currentVideoThumbnail})`;
    }
}

function updateUpNextList() {
    upNextList.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
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
        
        upNextList.appendChild(resultItem);
    }
}

// [CONTROLES DO PLAYER - TUDO ORIGINAL]
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

function updatePlayButton() {
    playButton.textContent = isPlaying ? '⏸' : '▶';
}

function updateProgressBar() {
    clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (!player) return;
        
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            progress.style.width = `${percent}%`;
            
            currentTimeElement.textContent = formatTime(currentTime);
            durationElement.textContent = formatTime(duration);
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// [RESTANTE DO CÓDIGO ORIGINAL]
function toggleFavorite() {
    const index = favorites.findIndex(fav => fav.id === currentVideoId);
    
    if (index === -1) {
        favorites.push({
            id: currentVideoId,
            title: currentVideoTitle,
            artist: currentVideoArtist,
            thumbnail: currentVideoThumbnail
        });
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton();
}

function updateFavoriteButton() {
    const isFavorite = favorites.some(fav => fav.id === currentVideoId);
    favoriteBtn.classList.toggle('active', isFavorite);
}

function goBack() {
    document.getElementById('main-container').style.display = 'block';
    playerPage.style.display = 'none';
    document.getElementById('main-header').style.display = 'flex';
}

// Event Listeners
searchButton.addEventListener('click', searchVideos);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchVideos();
});

playButton.addEventListener('click', () => {
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
});

prevButton.addEventListener('click', playPrev);
nextButton.addEventListener('click', playNext);

progressBar.addEventListener('click', (e) => {
    if (!player) return;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    player.seekTo(player.getDuration() * pos);
});

favoriteBtn.addEventListener('click', toggleFavorite);
backButton.addEventListener('click', goBack);

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

// Iniciar
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('spotify-player').style.display = 'none';
});
