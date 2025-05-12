// Configurações
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
let isShuffleMode = false;
let currentMusicStyle = '';
let progressInterval;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let notificationTimeout;

// [Restante do código permanece exatamente igual...]

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

// [Restante do código continua inalterado...]
