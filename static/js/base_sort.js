const SHUFFLE_DELAY = 2000;
const SORT_DELAY = 5000;
const RED = "element-red";
const BLUE = "element-blue";
const GREEN = "element-green";
const NOTE_DURATION = 50;
const FREQ_MIN = 200;
const FREQ_MAX = 600;
const VOLUME = 0.005;
var elements = [];
var running = false;
var audio = true;
const audioCtx = new(window.AudioContext || window.webkitAudioContext)();

// Appena si carica la pagina, carica la box
window.addEventListener("load", () => {
    fillBox();
    document.getElementById("audio").addEventListener("click", audioButton);

    let menu = document.getElementsByClassName("menu-btns")[0];
    for (let i = 0; i < menu.children.length; i++) {
        menu.children[i].addEventListener("click", () => {
            loadCode(menu.children[i]);
        })
    }
    loadCode(menu.children[0]);
});

// Chiamata al cambiare dello slider, cambia il testo degli item e chiama la fillBox
function sliderChange() {
    running = false;
    let slider = document.getElementById("slider");
    let sliderSpan = document.getElementById("slider-span");
    sliderSpan.innerHTML = slider.value;
    fillBox();
    activateButtons();
}

// Crea gli elementi nella box
function fillBox(value=document.getElementById("slider").value) {
    let box = document.getElementById("sort-container");
    let size = 100 / value;
    clearBox(box);

    elements = [];

    for (let i = 0; i < value; i++) {
        let element = document.createElement("div");
        element.classList.add("element");
        element.style.left = i*size + "%";
        element.style.width = size + "%";
        element.style.height = (i+1)*size + "%";
        elements.push(element);
        box.append(element);
    }
}

// Distrugge gli elementi della box
function clearBox(box) {
    while (box.lastElementChild) {
        box.removeChild(box.lastElementChild);
    }
}

// Chiamata quando premi il bottone, itera per ogni div e lo swappa con un altro a caso
async function shuffle() {
    running = true;
    disableButtons();
    for (let i = 0; i < elements.length; i++) {
        let rand_index = Math.floor(Math.random() * elements.length);
        await swap(i, rand_index, SHUFFLE_DELAY/elements.length);
    }
    activateButtons();
    running = false;
}

// Swappa lo style left e la loro posizione nell'elements elements dati 2 indici. Aspetta delay alla fine
// Frequenza tra 200 e 600
async function swap(i, j, delay) {
    let freq = Math.floor(( (getHeight(i) + getHeight(j)) / 200) * (FREQ_MAX - FREQ_MIN) + FREQ_MIN);
    playNote(freq, NOTE_DURATION);
    if (!running) return;
    changeColor(i, RED);
    [elements[i].style.left, elements[j].style.left] = [elements[j].style.left, elements[i].style.left];
    [elements[i], elements[j]] = [elements[j], elements[i]];
    await sleep(delay);
    resetColor(j);
}

function sleep(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

function playNote(frequency, duration) {
    if (!audio) return;
    const oscillator = new OscillatorNode(audioCtx);
    const gainNode = new GainNode(audioCtx);
    oscillator.type = "square";
    oscillator.frequency.value = frequency; // value in hertz
    gainNode.gain.value = VOLUME;
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();

    setTimeout(function() {
        oscillator.stop();
    }, duration);
}

function getHeight(x) {
    return parseFloat(elements[x].style.height.slice(0, -1));
}

function getHeightElement(element) {
    return parseFloat(element.style.height.slice(0, -1));
}

// Controlla se l'elemento ad indice x è >= dell'elemento ad indice y
function compare(x, y) {
    return getHeight(x) >= getHeight(y);
}

// Wrapper della chiamata al sort che regola le variabili di stato e i bottoni, chiama l'algoritmo di sorting e il controlLoop.
async function runBtn(sort, ...args) {
    running = true;
    disableButtons();
    await sort(...args);
    await controlLoop();
    resetColors();
    activateButtons();
    running = false;
}

// Chiamata quando clicchi sul bottone, setta la variabile di stato e rifilla tutta la box.
function stop() {
    running = false;
    fillBox();
}

// Trasforma il play button in stop button e disabilita lo shuffle
function disableButtons() {
    btn = document.getElementById("run-btn");
    btn.lastElementChild.innerHTML = 'stop'
    btn.onclick = stop;
    btn.disabled = false;
    document.getElementById("shuffle-btn").disabled = true;
}

// Trasforma lo stop button in un play button e riabilita lo shuffle
function activateButtons() {
    btn = document.getElementById("run-btn");
    btn.lastElementChild.innerHTML = 'play_arrow'
    btn.onclick = run;
    btn.disabled = false;
    document.getElementById("shuffle-btn").disabled = false;
}

function changeColor(i, color) {
    elements[i].classList.add(color);
}

function resetColor(i) {
    elements[i].classList.remove(RED);
    elements[i].classList.remove(BLUE);
    elements[i].classList.remove(GREEN);
}

function resetColors() {
    for (let i = 0; i < elements.length; i++) resetColor(i);
}

// Fa partire l'animazione verde alla fine del loop
async function controlLoop() {
    let delay = SHUFFLE_DELAY/elements.length/2;
    let anim_length = parseInt(elements.length / 6);
    for (let i = 0; i < elements.length+anim_length; i++) {
        if (!running) return;

        if (i < elements.length) {
            playNote(calculateFreq(i), NOTE_DURATION);
            changeColor(i, GREEN);
        }

        if (i > anim_length-1) {
            resetColor(i-anim_length);
        }
        await sleep(delay);
    }
}

// Calcola la frequenza della nota per l'elelemento dell'indice i
function calculateFreq(i) {
    return getHeight(i) / 100 * (FREQ_MAX - FREQ_MIN) + FREQ_MIN;
}

// Carica l'implementazione nel linguaggio scelto
function loadCode(btn) {
    let lang = btn.innerHTML;
    let menu = document.getElementsByClassName("menu-btns")[0];

    for (let i = 0; i < menu.children.length; i++) {
        menu.children[i].classList.remove("menu-btns-activated");
    }

    btn.classList.add("menu-btns-activated");
    let code = document.getElementById("code");
    code.innerHTML = codes[lang];
    code.className = '';
    code.classList.add(lang.toLowerCase())
    hljs.highlightAll();
}

// Attiva / disattiva l'audio e cambia la sua icona
function audioButton() {
    let icons = {"volume_up": "volume_off", "volume_off": "volume_up"}
    audio = !audio;
    document.getElementById("audio").firstChild.innerHTML = icons[document.getElementById("audio").firstChild.innerHTML]
}