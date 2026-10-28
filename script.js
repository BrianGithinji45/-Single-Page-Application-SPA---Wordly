const searchForm = document.getElementById('search-form');
const wordInput = document.getElementById('word-input');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');
const favoritesList = document.getElementById('favorites-list');

const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
let favorites = JSON.parse(localStorage.getItem('wordlyFavorites')) || [];

displayFavorites();

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const word = wordInput.value.trim();
    if (!word) {
        showError('Please enter a word');
        return;
    }
    await fetchWord(word);
});

async function fetchWord(word) {
    try {
        showLoading(true);
        hideError();
        resultsDiv.innerHTML = '';

        const response = await fetch(`${API_URL}${word}`);
        if (!response.ok) throw new Error('Word not found');

        const data = await response.json();
        displayWord(data[0]);
    } catch (err) {
        showError(`Could not find "${word}". Try hello, world, dictionary`);
    } finally {
        showLoading(false);
    }
}

function displayWord(data) {
    const word = data.word;
    const phonetic = data.phonetics.find(p => p.text)?.text || '';
    
    // FIXED: Find first non-empty audio
    const phoneticWithAudio = data.phonetics.find(p => p.audio && p.audio.length > 10);
    const audio = phoneticWithAudio ? phoneticWithAudio.audio : '';

    const meaningsHtml = data.meanings.map(meaning => {
        const definitionsHtml = meaning.definitions.map(def => `
            <div class="definition">• ${def.definition}</div>
            ${def.example ? `<div class="example">"${def.example}"</div>` : ''}
        `).join('');

        const synonyms = [...new Set(
            meaning.definitions.flatMap(d => d.synonyms || [])
        )].slice(0, 5).join(', ');

        return `
            <div class="meaning">
                <div class="part-of-speech">${meaning.partOfSpeech}</div>
                ${definitionsHtml}
                ${synonyms ? `<div class="synonyms"><strong>Synonyms:</strong> ${synonyms}</div>` : ''}
            </div>
        `;
    }).join('');

    resultsDiv.innerHTML = `
        <div class="word-card">
            <div class="word-title">
                ${word}
                <span class="phonetic">${phonetic}</span>
            </div>
            ${audio 
                ? `<button class="audio-btn" onclick="playAudio('${audio}')">🔊 Play Pronunciation</button>` 
                : '<p style="color:#999;margin-top:10px;">No audio available - try hello, water, dictionary</p>'
            }
            <button class="save-btn ${favorites.includes(word) ? 'saved' : ''}" onclick="toggleFavorite('${word}')">
                ${favorites.includes(word) ? '★ Saved' : '☆ Save Word'}
            </button>
            ${meaningsHtml}
        </div>
    `;
}

function playAudio(url) {
    console.log("Playing:", url);
    if (!url) {
        showError("No audio for this word");
        return;
    }
    const audio = new Audio(url);
    audio.play().catch(err => {
        console.error(err);
        // Fallback - Web Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                document.querySelector('.word-title').childNodes[0].textContent.trim()
            );
            speechSynthesis.speak(utterance);
        } else {
            showError("Audio blocked by browser. Check volume and try again.");
        }
    });
}

function toggleFavorite(word) {
    if (favorites.includes(word)) {
        favorites = favorites.filter(w => w !== word);
    } else {
        favorites.push(word);
    }
    localStorage.setItem('wordlyFavorites', JSON.stringify(favorites));
    displayFavorites();
    const btn = document.querySelector('.save-btn');
    if (btn) {
        btn.textContent = favorites.includes(word) ? '★ Saved' : '☆ Save Word';
        btn.classList.toggle('saved', favorites.includes(word));
    }
}

function displayFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = 'No saved words yet';
        return;
    }
    favoritesList.innerHTML = favorites.map(w => 
        `<span class="fav-tag" onclick="fetchWord('${w}')">${w}</span>`
    ).join('');
}

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
}

function hideError() { errorDiv.classList.add('hidden'); }
function showLoading(show) { loadingDiv.classList.toggle('hidden', !show); }

window.playAudio = playAudio;
window.toggleFavorite = toggleFavorite;
window.fetchWord = fetchWord;