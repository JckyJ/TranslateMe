// ------- DATA OPSLAG --------

function loadData() {
    const raw = localStorage.getItem("wrtsApp");
    if (!raw) {
        return {
            profile: null,
            folders: [] // { name, lists: [ { name, fromLang, toLang, words: [{front, back}] } ] }
        };
    }
    try {
        return JSON.parse(raw);
    } catch {
        return { profile: null, folders: [] };
    }
}

function saveData() {
    localStorage.setItem("wrtsApp", JSON.stringify(appData));
}

let appData = loadData();

// ------- HULPFUNCTIES --------

function getPageId() {
    const body = document.body;
    return body ? body.dataset.page : null;
}

function goTo(page, params = {}) {
    let url = page + ".html";
    const keys = Object.keys(params);
    if (keys.length > 0) {
        const qs = new URLSearchParams(params).toString();
        url += "?" + qs;
    }
    window.location.href = url;
}

function enableTabToAddRow(container, addRowFunction) {
    container.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            const inputs = Array.from(container.querySelectorAll("input"));
            const lastInput = inputs[inputs.length - 1];

            // Als je tabt vanuit het laatste inputveld → nieuwe rij
            if (e.target === lastInput) {
                e.preventDefault();         
                addRowFunction();           // nieuwe rij maken
                const newInputs = container.querySelectorAll("input");
                const firstNew = newInputs[newInputs.length - 2];
                firstNew.focus();           // cursor naar nieuwe rij (eerste veld)
            }
        }
    });
}

// ------- NAVBAR -------

function initNavbar() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return; // p0 heeft geen navbar

    // Mapjes dropdown vullen
    const dropdown = document.getElementById("navFoldersDropdown");
    if (dropdown) {
        dropdown.innerHTML = "";
        if (appData.folders.length === 0) {
            const empty = document.createElement("div");
            empty.className = "dropdown-item";
            empty.textContent = "Nog geen mapjes";
            dropdown.appendChild(empty);
        } else {
            appData.folders.forEach((folder, index) => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.textContent = folder.name;
                item.onclick = () => goTo("p3_folder", { folder: index });
                dropdown.appendChild(item);
            });
        }
    }
}

// ------- PROFIEL PAGINA (p0) -------

function initProfileSetupPage() {
    const form = document.getElementById("profileForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        if (!firstName || !lastName) {
            alert("Vul zowel je voornaam als achternaam in.");
            return;
        }
        appData.profile = { firstName, lastName };
        saveData();
        goTo("p1_home");
    });
}

// ------- HOME (p1) -------

function initHomePage() {
    const profileNameEl = document.getElementById("profileName");
    const statsLanguagesEl = document.getElementById("statsLanguages");
    const statsListsEl = document.getElementById("statsLists");
    const languageListEl = document.getElementById("languageList");

    if (!appData.profile) return;

    profileNameEl.textContent = appData.profile.firstName + " " + appData.profile.lastName;

    const numFolders = appData.folders.length;
    let numLists = 0;
    appData.folders.forEach(f => numLists += f.lists.length);

    statsLanguagesEl.textContent = numFolders;
    statsListsEl.textContent = numLists;

    languageListEl.innerHTML = "";
    if (numFolders === 0) {
        languageListEl.textContent = "Nog geen talen/mapjes. Maak er één via 'Mapjes' of 'Nieuw'.";
    } else {
        appData.folders.forEach((folder, index) => {
            const li = document.createElement("li");
            const link = document.createElement("span");
            link.className = "navlink";
            link.textContent = folder.name;
            link.onclick = () => goTo("p3_folder", { folder: index });
            li.appendChild(link);
            languageListEl.appendChild(li);
        });
    }
}

// ------- MAPJES OVERZICHT (p2) -------

function initFoldersPage() {
    const folderListEl = document.getElementById("folderList");
    const newFolderInput = document.getElementById("newFolderName");
    const newFolderBtn = document.getElementById("createFolderBtn");

    function renderFolders() {
        folderListEl.innerHTML = "";
        if (appData.folders.length === 0) {
            folderListEl.textContent = "Je hebt nog geen mapjes.";
            return;
        }
        appData.folders.forEach((folder, index) => {
            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");
            title.textContent = folder.name;
            card.appendChild(title);

            const info = document.createElement("p");
            info.textContent = `Aantal lijsten: ${folder.lists.length}`;
            card.appendChild(info);

            const openBtn = document.createElement("button");
            openBtn.textContent = "Bekijk lijsten";
            openBtn.onclick = () => goTo("p3_folder", { folder: index });
            card.appendChild(openBtn);

            folderListEl.appendChild(card);
        });
    }

    newFolderBtn.addEventListener("click", () => {
        const name = newFolderInput.value.trim();
        if (!name) {
            alert("Geef een naam aan het mapje.");
            return;
        }
        appData.folders.push({ name, lists: [] });
        saveData();
        newFolderInput.value = "";
        renderFolders();
        initNavbar(); // dropdown vernieuwen
    });

    renderFolders();
}

// ------- MAPJE → LIJSTEN (p3) -------

function initFolderPage() {
    const params = new URLSearchParams(window.location.search);
    const folderIndex = parseInt(params.get("folder"), 10);

    if (isNaN(folderIndex) || folderIndex < 0 || folderIndex >= appData.folders.length) {
        alert("Ongeldig mapje.");
        goTo("p2_folders");
        return;
    }

    const folder = appData.folders[folderIndex];

    const folderTitleEl = document.getElementById("folderTitle");
    const listContainerEl = document.getElementById("listsInFolder");
    const newListBtn = document.getElementById("newListInFolderBtn");

    folderTitleEl.textContent = folder.name;

    function renderLists() {
        listContainerEl.innerHTML = "";
        if (folder.lists.length === 0) {
            listContainerEl.textContent = "Nog geen lijsten in dit mapje.";
            return;
        }
        folder.lists.forEach((list, listIndex) => {
            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");
            title.textContent = list.name;
            card.appendChild(title);

            const info = document.createElement("p");
            info.textContent = `Talen: ${list.fromLang} → ${list.toLang} (woorden: ${list.words.length})`;
            card.appendChild(info);

            const openBtn = document.createElement("button");
            openBtn.textContent = "Open lijst";
            openBtn.onclick = () => goTo("p4_list", { folder: folderIndex, list: listIndex });
            card.appendChild(openBtn);

            listContainerEl.appendChild(card);
        });
    }

    newListBtn.addEventListener("click", () => {
        goTo("p5_new_list", { folder: folderIndex });
    });

    renderLists();
}

// ------- LIJST PAGINA (p4) -------

let currentFolderIndex = null;
let currentListIndex = null;

function initListPage() {

    const params = new URLSearchParams(window.location.search);
    currentFolderIndex = parseInt(params.get("folder"), 10);
    currentListIndex = parseInt(params.get("list"), 10);

    if (
        isNaN(currentFolderIndex) || isNaN(currentListIndex) ||
        currentFolderIndex < 0 || currentFolderIndex >= appData.folders.length ||
        currentListIndex < 0 || currentListIndex >= appData.folders[currentFolderIndex].lists.length
    ) {
        alert("Lijst niet gevonden.");
        goTo("p2_folders");
        return;
    }

    const folder = appData.folders[currentFolderIndex];
    const list = folder.lists[currentListIndex];

    // DOM ELEMENTEN
    const titleEl = document.getElementById("listTitle");
    const infoEl = document.getElementById("listInfo");
    const wordsViewEl = document.getElementById("wordsView");

    const editSectionEl = document.getElementById("editSection");
    const editBtn = document.getElementById("editListBtn");
    const saveEditBtn = document.getElementById("saveEditBtn");
    const addRowBtn = document.getElementById("addWordRowBtn");
    const editRowsContainer = document.getElementById("editRows");

    const quizModeSelect = document.getElementById("quizMode");
    const quizDirectionSelect = document.getElementById("quizDirection");
    const startQuizBtn = document.getElementById("startQuizBtn");

    titleEl.textContent = list.name;
    infoEl.textContent = `Talen: ${list.fromLang} ↔ ${list.toLang}`;

    // Richting dynamisch instellen
    quizDirectionSelect.innerHTML = `
        <option value="forward">${list.fromLang} → ${list.toLang}</option>
        <option value="reverse">${list.toLang} → ${list.fromLang}</option>
        <option value="both">Beide kanten</option>
    `;

    // ---------------- WEERGAVE ----------------
    function renderWordsView() {
        wordsViewEl.innerHTML = "";
        if (list.words.length === 0) {
            wordsViewEl.textContent = "Nog geen woorden in deze lijst.";
            return;
        }

        const ul = document.createElement("ul");
        list.words.forEach(w => {
            const li = document.createElement("li");
            li.textContent = `${w.front} → ${w.back}`;
            ul.appendChild(li);
        });
        wordsViewEl.appendChild(ul);
    }

    renderWordsView();


    // ---------------- BEWERKEN ----------------
    function addEditRow(frontValue = "", backValue = "") {
        const row = document.createElement("div");
        row.className = "word-row";

        const frontInput = document.createElement("input");
        frontInput.type = "text";
        frontInput.placeholder = list.fromLang;
        frontInput.value = frontValue;

        const backInput = document.createElement("input");
        backInput.type = "text";
        backInput.placeholder = list.toLang;
        backInput.value = backValue;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "danger";
        delBtn.textContent = "X";
        delBtn.onclick = () => row.remove();

        row.appendChild(frontInput);
        row.appendChild(backInput);
        row.appendChild(delBtn);

        editRowsContainer.appendChild(row);
    }

    function enterEditMode() {
        editRowsContainer.innerHTML = "";
        list.words.forEach(w => addEditRow(w.front, w.back));
        editSectionEl.style.display = "block";
    }

    function saveEdits() {
        const rows = Array.from(editRowsContainer.querySelectorAll(".word-row"));
        const newWords = [];

        rows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            const front = inputs[0].value.trim();
            const back = inputs[1].value.trim();
            if (front && back) {
                newWords.push({ front, back });
            }
        });

        list.words = newWords;
        saveData();
        renderWordsView();
        editSectionEl.style.display = "none";
    }

    editSectionEl.style.display = "none";
    editBtn.addEventListener("click", enterEditMode);
    addRowBtn.addEventListener("click", () => addEditRow());
    enableTabToAddRow(editRowsContainer, addEditRow);
    saveEditBtn.addEventListener("click", saveEdits);


    // ---------------- QUIZ ----------------
    function startQuiz() {
        const mode = quizModeSelect.value;
        const direction = quizDirectionSelect.value;

        goTo("p6_quiz", {
            folder: currentFolderIndex,
            list: currentListIndex,
            mode,
            direction
        });
    }

    startQuizBtn.addEventListener("click", startQuiz);

    // ---------------- VERWIJDER LIJST ----------------
    const deleteBtn = document.getElementById("deleteListBtn");
    deleteBtn.onclick = function () {

        const confirmDelete = confirm("Weet je zeker dat je deze lijst wilt verwijderen?");

        if (!confirmDelete) return;

        const folder = appData.folders[currentFolderIndex];

        // Lijst verwijderen
        folder.lists.splice(currentListIndex, 1);

        saveData();

        alert("Lijst verwijderd!");

        // Terug naar de folderpagina
        goTo("p3_folder", { folder: currentFolderIndex });
    };


    // ---------------- EXPORT FUNCTIE ----------------
    const exportBtn = document.getElementById("exportListBtn");
    exportBtn.onclick = function () {

        const folder = appData.folders[currentFolderIndex];
        const list = folder.lists[currentListIndex];

        const json = JSON.stringify(list, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${list.name}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };


    // ---------------- IMPORT FUNCTIE ----------------
    const importBtn = document.getElementById("importListBtn");
    const importInput = document.getElementById("importListInput");

    importBtn.onclick = () => importInput.click();

    importInput.onchange = function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const importedList = JSON.parse(e.target.result);

                if (!importedList.words || !Array.isArray(importedList.words)) {
                    alert("Dit is geen geldige woordenlijst.");
                    return;
                }

                folder.lists.push(importedList);
                saveData();

                alert("Lijst succesvol geïmporteerd!");
                goTo("p3_folder", { folder: currentFolderIndex });

            } catch (err) {
                alert("Importeren mislukt (ongeldige JSON)");
            }
        };

        reader.readAsText(file);
    };

    // ---------------- IMPORT IN NIEUWE LIJST ----------------
    const importIntoNewBtn = document.getElementById("importIntoNewBtn");
    const importIntoNewInput = document.getElementById("importIntoNewInput");

    importIntoNewBtn.onclick = () => importIntoNewInput.click();

    importIntoNewInput.onchange = function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const importedList = JSON.parse(e.target.result);

                if (!importedList.words || !Array.isArray(importedList.words)) {
                    alert("Dit is geen geldige woordenlijst.");
                    return;
                }

                // Vul de form automatisch in
                document.getElementById("newListName").value = importedList.name || "";
                document.getElementById("newListFromLang").value = importedList.fromLang || "";
                document.getElementById("newListToLang").value = importedList.toLang || "";

                const container = document.getElementById("newListWords");
                container.innerHTML = "";

                importedList.words.forEach(w => {
                    container.innerHTML += `
                        <div class="word-row">
                            <input type="text" value="${w.front}">
                            <input type="text" value="${w.back}">
                        </div>
                    `;
                });

                alert("Lijst geïmporteerd en klaar om op te slaan!");

            } catch (err) {
                alert("Importeren mislukt (ongeldige JSON)");
            }
        };

        reader.readAsText(file);
    };
}


// ------- NIEUWE LIJST PAGINA (p5) -------

function initNewListPage() {
    const params = new URLSearchParams(window.location.search);
    const preselectedFolder = params.has("folder") ? parseInt(params.get("folder"), 10) : null;

    const folderSelect = document.getElementById("folderSelect");
    const listNameInput = document.getElementById("listName");
    const fromLangInput = document.getElementById("fromLang");
    const toLangInput = document.getElementById("toLang");
    const rowsContainer = document.getElementById("newListRows");
    const addRowBtn = document.getElementById("addWordRowBtn_new");
    const form = document.getElementById("newListForm");

    function populateFolderDropdown() {
        folderSelect.innerHTML = "";
        if (appData.folders.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Geen mapjes beschikbaar";
            folderSelect.appendChild(opt);
            folderSelect.disabled = true;
        } else {
            appData.folders.forEach((folder, index) => {
                const opt = document.createElement("option");
                opt.value = index;
                opt.textContent = folder.name;
                folderSelect.appendChild(opt);
            });
            if (preselectedFolder !== null && preselectedFolder >= 0 && preselectedFolder < appData.folders.length) {
                folderSelect.value = preselectedFolder;
            }
        }
    }

    function addWordRow(frontValue = "", backValue = "") {
        const row = document.createElement("div");
        row.className = "word-row";

        const frontInput = document.createElement("input");
        frontInput.type = "text";
        frontInput.placeholder = "Woord (taal A)";
        frontInput.value = frontValue;

        const backInput = document.createElement("input");
        backInput.type = "text";
        backInput.placeholder = "Vertaling (taal B)";
        backInput.value = backValue;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "danger";
        delBtn.textContent = "X";
        delBtn.onclick = () => row.remove();

        row.appendChild(frontInput);
        row.appendChild(backInput);
        row.appendChild(delBtn);

        rowsContainer.appendChild(row);
    }

    function handleSubmit(e) {
        e.preventDefault();

        const listName = listNameInput.value.trim();
        const fromLang = fromLangInput.value.trim();
        const toLang = toLangInput.value.trim();
        const folderIndex = parseInt(folderSelect.value, 10);

        if (!listName || !fromLang || !toLang) {
            alert("Vul de lijstnaam en beide talen in.");
            return;
        }
        if (isNaN(folderIndex)) {
            alert("Kies een mapje.");
            return;
        }

        const rows = Array.from(rowsContainer.querySelectorAll(".word-row"));
        const words = [];
        rows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            const front = inputs[0].value.trim();
            const back = inputs[1].value.trim();
            if (front && back) {
                words.push({ front, back });
            }
        });

        if (words.length === 0) {
            if (!confirm("Je lijst heeft nog geen woorden. Toch opslaan?")) {
                return;
            }
        }

        const newList = {
            name: listName,
            fromLang,
            toLang,
            words
        };

        const folder = appData.folders[folderIndex];
        folder.lists.push(newList);
        const newListIndex = folder.lists.length - 1;
        saveData();

        goTo("p4_list", { folder: folderIndex, list: newListIndex });
    }

    addRowBtn.addEventListener("click", () => addWordRow());
    enableTabToAddRow(rowsContainer, addWordRow);
    form.addEventListener("submit", handleSubmit);

    populateFolderDropdown();
    addWordRow(); // alvast één rij
}

function initQuizPage() {
    const params = new URLSearchParams(window.location.search);
    const folderIndex = parseInt(params.get("folder"));
    const listIndex = parseInt(params.get("list"));
    const mode = params.get("mode") || "type";       // "type" of "mc"
    const direction = params.get("direction") || "forward"; // "forward" / "reverse"
    const wrongOnly = params.get("wrongOnly") === "yes";

    window.folderIndex = folderIndex;
    window.listIndex = listIndex;

    const folder = appData.folders[folderIndex];
    const list = folder.lists[listIndex];

    // ---- BASIS WOORDEN OPHALEN ----
    let baseWords;
    if (wrongOnly) {
        const stored = localStorage.getItem("wrts_temp_wrongwords");
        baseWords = stored ? JSON.parse(stored) : [];
        localStorage.removeItem("wrts_temp_wrongwords");
    } else {
        baseWords = [...list.words];
    }

    if (!baseWords || baseWords.length === 0) {
        const q = document.getElementById("question");
        if (q) q.textContent = "Geen woorden beschikbaar voor deze overhoring.";
        return;
    }

    const originalTotal = baseWords.length; // voor progressiebalk
    // Shuffle de beginvolgorde
    for (let i = baseWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baseWords[i], baseWords[j]] = [baseWords[j], baseWords[i]];
    }
    let queue = [...baseWords];            // woorden die nog geoefend worden
    let index = 0;
    let totalAsked = 0;
    let correctCount = 0;
    let doneCount = 0;                     // hoeveel woorden zijn al helemaal 'af'
    let wrongWords = [];                   // unieke foute woorden

    // ---- DOM ELEMENTEN ----
    const questionEl = document.getElementById("question");
    const answerInput = document.getElementById("answerInput");
    const multipleChoices = document.getElementById("multipleChoices");
    const submitBtn = document.getElementById("submitBtn");
    const nextBtn = document.getElementById("nextBtn");
    const feedbackEl = document.getElementById("feedback");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const quizInfo = document.getElementById("quizInfo");

    if (quizInfo) {
        quizInfo.textContent = `${list.name} – ${list.fromLang} ↔ ${list.toLang}`;
    }

    // ---- PROGRESSIE UPDATEN ----
    function updateProgress() {
        const pct = (doneCount / originalTotal) * 100;
        if (progressBar) progressBar.style.width = pct + "%";
        if (progressText) {
            progressText.textContent = `${doneCount}/${originalTotal} woorden klaar`;
        }
    }

    // ---- NIEUWE VRAAG TONEN ----
    function displayQuestion() {
        updateProgress();

        // klaar? alle woorden zijn afgehandeld
        if (queue.length === 0) {
            const uniqueWrong = [...new Set(wrongWords)];
            goTo("p7_quiz_end", {
                correct: correctCount,
                total: totalAsked,
                folder: folderIndex,
                list: listIndex,
                wrong: encodeURIComponent(JSON.stringify(uniqueWrong))
            });
            return;
        }

        if (index >= queue.length) index = 0;
        const w = queue[index];

        multipleChoices.innerHTML = "";
        feedbackEl.textContent = "";
        nextBtn.style.display = "none";

        let question, answer;
        let askDirection = direction;

        // Als gebruiker "both" kiest → random richting per vraag
        if (direction === "both") {
            askDirection = Math.random() < 0.5 ? "forward" : "reverse";
        }

        if (askDirection === "forward") {
            question = w.front;
            answer = w.back;
        } else {
            question = w.back;
            answer = w.front;
        }

        window.currentCorrectAnswer = answer;
        questionEl.textContent = `Vertaal: ${question}`;

        if (mode === "type") {
            answerInput.style.display = "inline-block";
            multipleChoices.style.display = "none";
            answerInput.value = "";
            answerInput.focus();
        } else {
            answerInput.style.display = "none";
            multipleChoices.style.display = "block";

            const opts = new Set([answer]);
            while (opts.size < 4 && queue.length > 1) {
                const r = queue[Math.floor(Math.random() * queue.length)];
                const opt = (askDirection === "forward") ? r.back : r.front;
                opts.add(opt);
            }

            [...opts].sort(() => Math.random() - 0.5).forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "mc-option";
                btn.textContent = opt;
                btn.onclick = () => checkAnswer(opt);
                multipleChoices.appendChild(btn);
            });
        }
    }

    // ---- FOUT WOORD LATER NOG EEN KEER ----
    function rescheduleWrongWord(idx) {
        const item = queue[idx];
        const delay = Math.floor(Math.random() * 3) + 2; // 2–4 vragen later
        let newPos = idx + delay;
        if (newPos >= queue.length) newPos = queue.length - 1;

        queue.splice(idx, 1);
        queue.splice(newPos, 0, item);
    }

    // ---- ANTWOORD CONTROLEREN ----
    function checkAnswer(typed = null) {
        if (queue.length === 0) return;

        const current = queue[index];
        const correct = window.currentCorrectAnswer;

        let ans = mode === "type" ? answerInput.value.trim() : typed;

        if (!ans) {
            feedbackEl.textContent = "Vul iets in!";
            return;
        }

        totalAsked++;

        // --- MULTIPLE CHOICE KNOPPEN OPHALEN ---
        const buttons = multipleChoices.querySelectorAll(".mc-option");

        // --- TYPE-MODUS ---
        if (mode === "type") {

            if (ans.toLowerCase() === correct.toLowerCase()) {
                feedbackEl.textContent = "Goed! 🎉";
                correctCount++;
                doneCount++;
                queue.splice(index, 1);
                if (index >= queue.length) index = 0;
            } else {
                feedbackEl.textContent = `Fout. Het juiste antwoord is: ${correct}`;
                if (!wrongWords.includes(current)) wrongWords.push(current);
                rescheduleWrongWord(index);
                index++;
                if (index >= queue.length) index = 0;
            }

        } 
        // --- MULTIPLE CHOICE MODUS ---
        else {

            // goede knop groen maken
            buttons.forEach(btn => {
                if (btn.textContent === correct) {
                    btn.classList.add("mc-correct");
                }
                btn.disabled = true; // knoppen uitschakelen
            });

            if (ans === correct) {
                feedbackEl.textContent = "Goed! 🎉";
                correctCount++;
                doneCount++;
                queue.splice(index, 1);
                if (index >= queue.length) index = 0;
            } else {
                feedbackEl.textContent = `Fout. Het juiste antwoord is: ${correct}`;

                // fout aangeklikte knop rood + trillen
                buttons.forEach(btn => {
                    if (btn.textContent === ans) {
                        btn.classList.add("mc-wrong");
                    }
                });

                if (!wrongWords.includes(current)) wrongWords.push(current);
                rescheduleWrongWord(index);

                index++;
                if (index >= queue.length) index = 0;
            }
        }

        nextBtn.style.display = "inline-block";
        updateProgress();
    }

    // ENTER → eerst controleren, daarna naar volgende
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (nextBtn.style.display === "none") {
                checkAnswer();
            } else {
                nextBtn.click();
            }
        }
    });

    nextBtn.onclick = () => {
        displayQuestion();
    };

    submitBtn.onclick = () => checkAnswer();

    displayQuestion();
}

function initQuizEndPage() {
    const params = new URLSearchParams(window.location.search);

    const correct = parseInt(params.get("correct"));
    const total = parseInt(params.get("total"));
    const folder = parseInt(params.get("folder"));
    const list = parseInt(params.get("list"));
    const wrongRaw = params.get("wrong");

    window.folderIndex = folder;
    window.listIndex = list;

    let wrongWords = [];
    if (wrongRaw) {
        wrongWords = JSON.parse(decodeURIComponent(wrongRaw));
    }

    const endSummary = document.getElementById("endSummary");
    endSummary.innerHTML = `
        Je hebt <strong>${correct}</strong> van de <strong>${total}</strong> vragen goed! 🎉<br>
        Score: ${(correct / total * 100).toFixed(1)}%<br><br>
        ${wrongWords.length > 0 
            ? `Aantal fout gemaakte woorden: <strong>${wrongWords.length}</strong>`
            : "Je hebt geen enkele fout gemaakt!"}
    `;

    // knop foute woorden herhalen
    const retryBtn = document.getElementById("retryWrongBtn");

    if (wrongWords.length === 0) {
        retryBtn.style.display = "none";
    } else {
        retryBtn.onclick = () => {
            // start een nieuwe quiz, maar met alleen de foute woorden
            localStorage.setItem("wrts_temp_wrongwords", JSON.stringify(wrongWords));
            goTo("p6_quiz", {
                folder,
                list,
                mode: "type",    // of: params.get("mode")
                direction: "forward", // of: params.get("direction")
                wrongOnly: "yes"
            });
        };
    }
}

// ------- INIT BIJ LADEN -------

document.addEventListener("DOMContentLoaded", () => {
    const page = getPageId();

    // als geen profiel + niet op p0 → eerst naar profielpagina
    if (page !== "profile-setup" && !appData.profile) {
        goTo("p0_profile");
        return;
    }

    initNavbar();

    switch (page) {
        case "profile-setup":
            initProfileSetupPage();
            break;
        case "home":
            initHomePage();
            break;
        case "folders":
            initFoldersPage();
            break;
        case "folder":
            initFolderPage();
            break;
        case "list":
            initListPage();
            break;
        case "new-list":
            initNewListPage();
            break;
        case "quiz":
            initQuizPage();
            break;

        case "quiz-end":
            initQuizEndPage();
            break;
        default:
            break;
    }
});