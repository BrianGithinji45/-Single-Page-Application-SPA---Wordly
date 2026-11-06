const searchForm = document.querySelector("#search-form");
const wordInput = document.querySelector("#word-input");
const divDisplay = document.querySelector("#dataDisplay") || document.querySelector("#results");
const errorDiv = document.querySelector("#error");
const loadingDiv = document.querySelector("#loading");
const favList = document.querySelector("#favorites-list");

const API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

displayFavs();

searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const word = wordInput.value.trim();
    if (!word) return;
    await fetchWordData(API + word);
});

async function fetchWordData(APIURL){
    try {
        if (loadingDiv) loadingDiv.classList.remove("hidden");
        if (errorDiv) errorDiv.classList.add("hidden");
        if (divDisplay) divDisplay.innerHTML = "";
        const response = await fetch(APIURL);
        if (!response.ok) throw new Error("Word not found");
        const data = await response.json();
        renderWordDetails(data[0]);
    } catch(error){
        if (errorDiv) {
            errorDiv.textContent = "Word not found. Try: hello, world, love";
            errorDiv.classList.remove("hidden");
        }
    } finally {
        if (loadingDiv) loadingDiv.classList.add("hidden");
    }
}

function renderWordDetails(data){
    const searchValue = data.word;
    const wordpara = document.createElement("p");
    wordpara.textContent = searchValue;
    wordpara.style.fontSize = "2rem";
    wordpara.style.fontWeight = "bold";
    const phoneticText = data.phonetics.find(p => p.text)?.text || "";
    const phoneticPara = document.createElement("p");
    phoneticPara.textContent = phoneticText;
    phoneticPara.style.fontStyle = "italic";
    phoneticPara.style.color = "#777";
    divDisplay.appendChild(wordpara);
    divDisplay.appendChild(phoneticPara);

    data.meanings.forEach(m => {
        const pos = document.createElement("h4");
        pos.textContent = m.partOfSpeech;
        pos.style.color = "#764ba2";
        pos.style.textTransform = "capitalize";
        pos.style.marginTop = "12px";
        divDisplay.appendChild(pos);
        m.definitions.forEach(d => {
            const defP = document.createElement("p");
            defP.textContent = `• ${d.definition}`;
            defP.style.marginLeft = "18px";
            divDisplay.appendChild(defP);
            if (d.example) {
                const exP = document.createElement("p");
                exP.textContent = `"${d.example}"`;
                exP.style.fontStyle = "italic";
                exP.style.color = "#666";
                exP.style.marginLeft = "18px";
                divDisplay.appendChild(exP);
            }
        });
        const synonyms = [...new Set(m.definitions.flatMap(x => x.synonyms || []))].slice(0,5);
        if (synonyms.length) {
            const synP = document.createElement("p");
            synP.textContent = `Synonyms: ${synonyms.join(", ")}`;
            synP.style.color = "#667eea";
            divDisplay.appendChild(synP);
        }
    });

    const audioObj = data.phonetics.find(p => p.audio && p.audio.length > 10);
    if (audioObj) {
        const audioBtn = document.createElement("button");
        audioBtn.textContent = "🔊 Play Pronunciation";
        audioBtn.style.marginTop = "10px";
        audioBtn.onclick = () => {
            const audio = new Audio(audioObj.audio);
            audio.play().catch(() => {
                if ('speechSynthesis' in window) {
                    speechSynthesis.speak(new SpeechSynthesisUtterance(searchValue));
                }
            });
        };
        divDisplay.appendChild(audioBtn);
    }

    let favs = JSON.parse(localStorage.getItem("wordlyFavorites")) || [];
    const isSaved = favs.includes(searchValue);
    const saveBtn = document.createElement("button");
    saveBtn.textContent = isSaved ? "★ Saved" : "☆ Save";
    saveBtn.style.marginLeft = "10px";
    saveBtn.onclick = () => {
        let current = JSON.parse(localStorage.getItem("wordlyFavorites")) || [];
        if (current.includes(searchValue)) {
            current = current.filter(x => x !== searchValue);
            saveBtn.textContent = "☆ Save";
        } else {
            current.push(searchValue);
            saveBtn.textContent = "★ Saved";
        }
        localStorage.setItem("wordlyFavorites", JSON.stringify(current));
        displayFavs();
    };
    divDisplay.appendChild(saveBtn);
}

function displayFavs(){
    if (!favList) return;
    let favs = JSON.parse(localStorage.getItem("wordlyFavorites")) || [];
    if (favs.length === 0) {
        favList.innerHTML = "No saved words yet";
        return;
    }
    favList.innerHTML = "";
    favs.forEach(w => {
        const tag = document.createElement("span");
        tag.className = "fav-tag";
        tag.textContent = w;
        tag.onclick = () => {
            wordInput.value = w;
            fetchWordData(API + w);
        };
        const del = document.createElement("b");
        del.textContent = " ×";
        del.onclick = (e) => {
            e.stopPropagation();
            let updated = JSON.parse(localStorage.getItem("wordlyFavorites")) || [];
            updated = updated.filter(x => x !== w);
            localStorage.setItem("wordlyFavorites", JSON.stringify(updated));
            displayFavs();
        };
        tag.appendChild(del);
        favList.appendChild(tag);
    });
}