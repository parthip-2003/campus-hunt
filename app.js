// =====================================================
//  CAMPUS HUNT — Core Game Logic (Reverted)
// =====================================================

// State
let currentStation = null;
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let timerInterval = null;
let recordSeconds = 0;

// LocalStorage keys
const LS_COLLECTED = 'campushunt_collected';    // { stationId: letter | null }
const LS_COMPLETED = 'campushunt_completed';    // [stationId, ...]

// ---- Get station from URL param ----
function getStationFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('station'));
    if (!id || isNaN(id)) return null;
    return STATION_DATA.find(s => s.id === id) || null;
}

// ---- LocalStorage helpers ----
function getCollected() {
    try { return JSON.parse(localStorage.getItem(LS_COLLECTED)) || {}; }
    catch { return {}; }
}
function getCompleted() {
    try { return JSON.parse(localStorage.getItem(LS_COMPLETED)) || []; }
    catch { return []; }
}
function saveCollected(obj) { localStorage.setItem(LS_COLLECTED, JSON.stringify(obj)); }
function saveCompleted(arr) { localStorage.setItem(LS_COMPLETED, JSON.stringify(arr)); }

// ---- Show a screen ----
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

// ---- Render background particles ----
function spawnParticles() {
    const colors = ['#6c63ff', '#ff6b6b', '#00e5a0', '#ffd166', '#8b85ff'];
    const wrap = document.getElementById('particles');
    if (!wrap) return;
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
      left:${Math.random() * 100}%;
      bottom:${Math.random() * 20 - 10}%;
      width:${Math.random() * 6 + 3}px;
      height:${Math.random() * 6 + 3}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 12 + 8}s;
      animation-delay:${Math.random() * 8}s;
      opacity:0.5;
    `;
        wrap.appendChild(p);
    }
}

// ---- Loading screen animation ----
function runLoadingScreen(callback) {
    const bar = document.getElementById('loadingBar');
    let pct = 0;
    const iv = setInterval(() => {
        pct += Math.random() * 18;
        if (pct >= 100) { pct = 100; clearInterval(iv); setTimeout(callback, 400); }
        if (bar) bar.style.width = pct + '%';
    }, 120);
}

// ---- Build question screen ----
function buildQuestion(station) {
    document.getElementById('stationBadge').querySelector('span:last-child').textContent = station.name;
    document.getElementById('qProgress').textContent = `Station ${station.id} of ${STATION_DATA.length}`;
    document.getElementById('questionText').textContent = station.question;

    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];
    station.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.id = `opt-${i}`;
        btn.innerHTML = `<span class="option-label">${labels[i]}</span><span>${opt}</span>`;
        btn.addEventListener('click', () => handleAnswer(i, station));
        grid.appendChild(btn);
    });
}

// ---- Handle answer ----
function handleAnswer(selectedIndex, station) {
    document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'none');

    const correct = selectedIndex === station.correctIndex;
    const selectedBtn = document.getElementById(`opt-${selectedIndex}`);
    const correctBtn = document.getElementById(`opt-${station.correctIndex}`);

    if (correct) {
        selectedBtn.classList.add('correct-ans');
        setTimeout(() => showCorrectScreen(station), 800);
    } else {
        selectedBtn.classList.add('wrong-ans');
        correctBtn.classList.add('correct-ans');
        setTimeout(() => showWrongScreen(station), 900);
    }
}

// ---- Correct Answer Screen ----
function showCorrectScreen(station) {
    const collected = getCollected();
    collected[station.id] = station.secretLetter;
    saveCollected(collected);

    document.getElementById('secretLetter').textContent = station.secretLetter;

    const isLast = station.id === STATION_DATA.length;
    const clueEl = document.getElementById('nextClueText');
    clueEl.textContent = station.nextClue;

    if (isLast) {
        document.getElementById('nextClueCard').querySelector('.clue-header span:last-child').textContent = '🎉 Final Message';
    }

    renderProgressLetters('progressLetters');
    showScreen('screen-correct');
}

// ---- Wrong Answer Screen ----
function showWrongScreen(station) {
    document.getElementById('taskText').textContent = station.funTask;
    document.getElementById('nextClueTextWrong').textContent = station.nextClue;
    showScreen('screen-wrong');
}

// ---- Mark station complete ----
function markStationComplete() {
    const completed = getCompleted();
    if (!completed.includes(currentStation.id)) completed.push(currentStation.id);
    saveCompleted(completed);

    if (completed.length >= STATION_DATA.length) {
        showFinalScreen();
    } else {
        showWaitingForNext();
    }
}

function showWaitingForNext() {
    const el = document.getElementById('app');
    showScreen('screen-loading'); // Use loading as background
    const wrap = document.createElement('div');
    wrap.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg);z-index:100;padding:20px;text-align:center";
    wrap.innerHTML = `
    <div style="max-width:500px">
      <div style="font-size:72px;margin-bottom:20px">📱</div>
      <h2 style="font-size:28px;font-weight:800;margin-bottom:12px;color:#f0f2ff">Station Complete!</h2>
      <p style="color:#9ca3c4;font-size:16px;line-height:1.7;margin-bottom:32px">
        Follow the clue to the next station and scan its QR code to continue your hunt!
      </p>
      <div style="background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.35);border-radius:14px;padding:20px;font-size:15px;color:#f0f2ff;line-height:1.7">
        ${currentStation.nextClue}
      </div>
    </div>
  `;
    document.body.appendChild(wrap);
}

// ---- Render progress letters ----
function renderProgressLetters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const collected = getCollected();
    container.innerHTML = '';
    STATION_DATA.forEach(s => {
        const div = document.createElement('div');
        div.className = 'prog-letter';
        const letter = collected[s.id];
        if (letter) {
            div.classList.add('collected');
            div.textContent = letter;
        } else if (getCompleted().includes(s.id)) {
            div.classList.add('missed');
            div.textContent = '✗';
        } else {
            div.textContent = s.id;
        }
        container.appendChild(div);
    });
}

// ---- Final Screen ----
function showFinalScreen() {
    const collected = getCollected();
    const finalLetters = document.getElementById('finalLetters');
    finalLetters.innerHTML = '';
    let word = '';

    STATION_DATA.forEach(s => {
        const div = document.createElement('div');
        div.className = 'final-letter';
        const letter = collected[s.id];
        if (letter) {
            div.classList.add('got');
            div.textContent = letter;
            word += letter;
        } else {
            div.classList.add('missed-l');
            div.textContent = '?';
            word += '_';
        }
        finalLetters.appendChild(div);
    });

    document.getElementById('wordDisplay').textContent = word.split('').join(' ');
    spawnConfetti();
    showScreen('screen-final');
}

// ---- Confetti ----
function spawnConfetti() {
    const colors = ['#6c63ff', '#ff6b6b', '#00e5a0', '#ffd166', '#ff9f43', '#48dbfb'];
    const wrap = document.getElementById('confettiWrap');
    if (!wrap) return;
    for (let i = 0; i < 80; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.cssText = `
      left:${Math.random() * 100}%;
      top:-10px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      width:${Math.random() * 12 + 6}px;
      height:${Math.random() * 12 + 6}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation:confettiFall ${Math.random() * 3 + 2}s ${Math.random() * 2}s linear forwards;
    `;
        wrap.appendChild(c);
    }
}

// ---- Camera ----
async function startCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const preview = document.getElementById('videoPreview');
        preview.srcObject = mediaStream;
        preview.style.display = 'block';
        document.getElementById('videoOverlay').classList.add('hidden');
    } catch (err) {
        alert('Could not access camera: ' + err.message);
    }
}

function submitTask() {
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    const completed = getCompleted();
    if (!completed.includes(currentStation.id)) completed.push(currentStation.id);
    saveCompleted(completed);
    showScreen('screen-task-done');
}

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
    spawnParticles();
    showScreen('screen-loading');
    runLoadingScreen(() => {
        initGameFlow();
    });
});

function initGameFlow() {
    currentStation = getStationFromURL();

    if (!currentStation) {
        showNoStation();
        return;
    }

    const completed = getCompleted();
    if (completed.includes(currentStation.id)) {
        showAlreadyDone();
        return;
    }

    buildQuestion(currentStation);
    showScreen('screen-question');
}

function showNoStation() {
    showScreen('screen-loading');
    const el = document.getElementById('screen-loading');
    el.innerHTML = `
    <div style="text-align:center;padding:40px 20px;max-width:480px">
      <div style="font-size:72px;margin-bottom:20px">🔍</div>
      <h1 style="color:#f0f2ff">Campus Hunt</h1>
      <p style="color:#9ca3c4;margin-bottom:20px">Scan a station QR code to begin!</p>
      <button onclick="localStorage.clear();location.reload()" style="padding:10px 20px;color:#ff6b6b;background:transparent;border:1px solid #ff6b6b;border-radius:20px">Reset Progress</button>
    </div>
  `;
}

function showAlreadyDone() {
    showScreen('screen-loading');
    const el = document.getElementById('screen-loading');
    el.innerHTML = `
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:64px">✅</div>
      <h2 style="color:#f0f2ff">${currentStation.name}</h2>
      <p style="color:#9ca3c4">Station already completed!</p>
    </div>
  `;
}
