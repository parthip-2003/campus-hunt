// =====================================================
//  CAMPUS HUNT — Core Game Logic
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
const LS_SESSION_ID = 'campushunt_session_id';  // UUID
const LS_NICKNAME = 'campushunt_nickname';      // String

// Supabase config (using user's keys)
const SUPABASE_URL = 'https://vskalrepzuzaneglzdez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza2FscmVwenV6YW5lZ2x6ZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5OTY1OTYsImV4cCI6MjAzMjU3MjU5Nn0.aWd31fqNw-4w6Dwk-sD8CQ_umT2tBhZ';
let supabase;

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

// ---- Session Helpers ----
function getSessionId() { return localStorage.getItem(LS_SESSION_ID); }
function getNickname() { return localStorage.getItem(LS_NICKNAME); }

async function startHuntSession() {
    const input = document.getElementById('nicknameInput');
    const nick = input.value.trim();
    if (!nick) {
        alert('Please enter a nickname to start!');
        return;
    }

    // Create session in Supabase
    const { data, error } = await supabase
        .from('hunt_sessions')
        .insert([{ nickname: nick }])
        .select()
        .single();

    if (error) {
        console.error('Session error:', error);
        alert('Could not start session. Please check your internet.');
        return;
    }

    localStorage.setItem(LS_SESSION_ID, data.id);
    localStorage.setItem(LS_NICKNAME, nick);

    // Continue to game
    initGameFlow();
}

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
        bar.style.width = pct + '%';
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
    // Disable all buttons after selection
    document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'none');

    const correct = selectedIndex === station.correctIndex;
    const selectedBtn = document.getElementById(`opt-${selectedIndex}`);
    const correctBtn = document.getElementById(`opt-${station.correctIndex}`);

    if (correct) {
        selectedBtn.classList.add('correct-ans');
        // Sync correct answer status to Supabase
        syncProgress(station.id, 'correct');
        setTimeout(() => showCorrectScreen(station), 800);
    } else {
        selectedBtn.classList.add('wrong-ans');
        correctBtn.classList.add('correct-ans');
        setTimeout(() => showWrongScreen(station), 900);
    }
}

async function syncProgress(stationId, status) {
    const sessionId = getSessionId();
    if (!sessionId) return;

    await supabase.from('hunt_progress').insert([
        { session_id: sessionId, station_id: stationId, status: status }
    ]);
}

// ---- Correct Answer Screen ----
function showCorrectScreen(station) {
    // Save collected letter
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

// ---- Mark station complete (after correct answer / task done) ----
function markStationComplete() {
    const completed = getCompleted();
    if (!completed.includes(currentStation.id)) completed.push(currentStation.id);
    saveCompleted(completed);

    // Check if all stations done
    if (completed.length >= STATION_DATA.length) {
        showFinalScreen();
    } else {
        // Go back to question screen cleared (scan next QR)
        showScreen('screen-question');
        buildQuestion(currentStation); // Show same station again for reference
        // Actually bring user to a "waiting" notice
        showWaitingForNext();
    }
}

function showWaitingForNext() {
    // Replace question screen with a "next QR" notice
    const el = document.getElementById('screen-question');
    el.innerHTML = `
    <div style="text-align:center;padding:40px 20px;max-width:500px">
      <div style="font-size:72px;margin-bottom:20px">📱</div>
      <h2 style="font-size:28px;font-weight:800;margin-bottom:12px;color:#f0f2ff">Station Complete!</h2>
      <p style="color:#9ca3c4;font-size:16px;line-height:1.7;margin-bottom:32px">
        Follow the clue to the next station and scan its QR code to continue your hunt!
      </p>
      <div style="background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.35);border-radius:14px;padding:20px;font-size:15px;color:#f0f2ff;line-height:1.7">
        ${currentStation.nextClue}
      </div>
      <div style="margin-top:24px;font-size:13px;color:#5a617a">
        Stations completed: ${getCompleted().length} / ${STATION_DATA.length}
      </div>
    </div>
  `;
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

// ---- Camera & Recording ----
async function startCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const preview = document.getElementById('videoPreview');
        preview.srcObject = mediaStream;
        preview.style.display = 'block';
        document.getElementById('videoOverlay').classList.add('hidden');
        document.getElementById('btnRecord').disabled = false;
        document.getElementById('btnStartCam').textContent = '✅ Camera On';
        document.getElementById('btnStartCam').style.opacity = '0.5';
        document.getElementById('btnStartCam').disabled = true;
    } catch (err) {
        alert('Could not access camera: ' + err.message + '\n\nPlease allow camera permission and try again.');
    }
}

function toggleRecording() {
    if (!isRecording) startRecording();
    else stopRecording();
}

function startRecording() {
    recordedChunks = [];
    recordSeconds = 0;
    const btn = document.getElementById('btnRecord');

    try {
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            document.getElementById('btnSubmitTask').disabled = false;
        };
        mediaRecorder.start();
        isRecording = true;
        btn.classList.add('recording');
        btn.innerHTML = '<span class="rec-dot"></span> Stop Recording';

        const timerDisplay = document.getElementById('timerDisplay');
        timerDisplay.style.display = 'flex';
        timerInterval = setInterval(() => {
            recordSeconds++;
            const m = Math.floor(recordSeconds / 60);
            const s = recordSeconds % 60;
            document.getElementById('timerCount').textContent = `${m}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    } catch (err) {
        alert('Recording failed: ' + err.message);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if (timerInterval) clearInterval(timerInterval);
    isRecording = false;
    const btn = document.getElementById('btnRecord');
    btn.classList.remove('recording');
    btn.innerHTML = '<span class="rec-dot"></span> Re-record';
}

async function submitTask() {
    const btn = document.getElementById('btnSubmitTask');
    btn.disabled = true;
    btn.textContent = '⏳ Uploading...';

    const sessionId = getSessionId();
    let videoUrl = null;

    // Upload video if we have chunks
    if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const fileName = `${sessionId}_station${currentStation.id}_${Date.now()}.webm`;

        const { data, error } = await supabase.storage
            .from('task_videos')
            .upload(fileName, blob);

        if (!error) {
            const { data: urlData } = supabase.storage
                .from('task_videos')
                .getPublicUrl(fileName);
            videoUrl = urlData.publicUrl;
        }
    }

    // Sync task completion to Supabase
    await syncProgress(currentStation.id, 'task_completed');

    // Save task metadata
    if (sessionId) {
        await supabase.from('hunt_tasks').insert([
            { session_id: sessionId, station_id: currentStation.id, video_url: videoUrl }
        ]);
    }

    // Stop stream
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    if (timerInterval) clearInterval(timerInterval);

    // Save that this station was completed without a letter
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
        // If no nickname session yet, show nickname screen
        if (!getSessionId()) {
            showScreen('screen-nickname');
        } else {
            initGameFlow();
        }
    });
});

function initGameFlow() {
    // Initialize Supabase safely
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Supabase SDK not loaded!");
    }

    currentStation = getStationFromURL();

    if (!currentStation) {
        showNoStation();
        return;
    }

    // Check if already completed
    const completed = getCompleted();
    if (completed.includes(currentStation.id)) {
        showAlreadyDone();
        return;
    }

    buildQuestion(currentStation);
    showScreen('screen-question');
}

// ---- No station param fallback ----
function showNoStation() {
    const el = document.getElementById('screen-loading');
    el.innerHTML = `
    <div style="text-align:center;padding:40px 20px;max-width:480px">
      <div style="font-size:72px;margin-bottom:20px">🔍</div>
      <h1 style="font-size:32px;font-weight:900;margin-bottom:12px;
         background:linear-gradient(135deg,#6c63ff,#8b85ff);
         -webkit-background-clip:text;-webkit-text-fill-color:transparent">
        Campus Hunt
      </h1>
      <p style="color:#9ca3c4;font-size:16px;line-height:1.7;margin-bottom:28px">
        Find a QR code at one of the 7 stations around campus to begin your challenge!
      </p>
      <div style="background:rgba(108,99,255,0.08);border:1px solid rgba(108,99,255,0.25);
           border-radius:14px;padding:20px;font-size:14px;color:#9ca3c4;line-height:1.8">
        📍 7 Stations &nbsp;|&nbsp; ❓ 7 Questions &nbsp;|&nbsp; 🔐 7 Secret Letters<br>
        <span style="color:#5a617a;font-size:12px">Collect all letters to reveal the secret word!</span>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#5a617a">
        Collected letters: ${Object.keys(getCollected()).length} / 7 &nbsp;|&nbsp;
        Stations done: ${getCompleted().length} / 7
      </p>
      <button onclick="localStorage.clear();location.reload()"
        style="margin-top:20px;padding:10px 24px;background:transparent;border:1px solid rgba(255,107,107,0.3);
               color:#ff6b6b;border-radius:99px;cursor:pointer;font-family:Outfit,sans-serif;font-size:13px">
        🗑️ Reset Progress
      </button>
    </div>
  `;
    el.classList.add('active');
}

// ---- Already done ----
function showAlreadyDone() {
    const el = document.getElementById('screen-loading');
    const coll = getCollected();
    const letter = coll[currentStation.id];
    el.innerHTML = `
    <div style="text-align:center;padding:40px 20px;max-width:480px">
      <div style="font-size:64px;margin-bottom:16px">✅</div>
      <h2 style="font-size:26px;font-weight:800;margin-bottom:10px;color:#f0f2ff">
        ${currentStation.name}
      </h2>
      <p style="color:#9ca3c4;font-size:15px;margin-bottom:24px">
        You've already completed this station!
        ${letter ? `Your letter: <span style="font-family:'Space Mono',monospace;font-size:22px;color:#00e5a0;font-weight:700">${letter}</span>` : '<span style="color:#ff6b6b">No letter collected</span>'}
      </p>
      <p style="color:#5a617a;font-size:13px">Scan the next station QR code to continue.</p>
    </div>
  `;
    el.classList.add('active');
}
