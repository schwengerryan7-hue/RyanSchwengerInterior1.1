let selectedPreset = '';
let currentModelUrl = null;
let renderHistory = [];
let renderStartTime = null;

// Drag & drop
const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.background = '#eeece8'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.background = ''; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (file) loadModel(file);
});

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) loadModel(file);
}

function loadModel(file) {
  const url = URL.createObjectURL(file);
  const viewer = document.getElementById('model-viewer');
  const empty = document.getElementById('empty-state');
  viewer.src = url;
  viewer.style.display = 'block';
  empty.style.display = 'none';
  uploadZone.classList.add('has-file');
  document.getElementById('upload-text').innerHTML = `<strong>${file.name}</strong><br>${(file.size / 1024).toFixed(0)} KB`;
  currentModelUrl = url;
  showToast('Model loaded ✓');
}

function selectPreset(btn, prompt) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedPreset = prompt;
  document.getElementById('prompt-input').value = prompt;
}

function appendSuggestion(text) {
  const input = document.getElementById('prompt-input');
  input.value = input.value ? input.value + ', ' + text : text;
}

function updateApiStatus() {
  const url = document.getElementById('api-url').value.trim();
  const dot = document.getElementById('api-dot');
  const status = document.getElementById('api-status');
  if (url) {
    dot.style.background = '#f59e0b';
    status.textContent = 'Checking...';
    fetch(url + '/health').then(r => {
      if (r.ok) { dot.style.background = '#22c55e'; status.textContent = 'Connected'; }
      else { dot.style.background = '#ef4444'; status.textContent = 'Error'; }
    }).catch(() => { dot.style.background = '#ef4444'; status.textContent = 'Unreachable'; });
  }
}

async function triggerRender() {
  const prompt = document.getElementById('prompt-input').value.trim();
  const apiUrl = document.getElementById('api-url').value.trim();

  if (!prompt) { showToast('Enter a material prompt first'); return; }
  if (!apiUrl) { showToast('Enter your API URL first'); return; }

  const overlay = document.getElementById('render-overlay');
  overlay.classList.add('active');
  document.getElementById('render-btn').disabled = true;
  renderStartTime = Date.now();

  const steps = [
    { text: 'Sending to Blender...', pct: 15 },
    { text: 'Loading 3D model...', pct: 30 },
    { text: 'Applying materials...', pct: 55 },
    { text: 'Rendering with Cycles...', pct: 75 },
    { text: 'Saving output...', pct: 90 },
  ];
  let stepIdx = 0;
  const progressInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      document.getElementById('render-status').textContent = steps[stepIdx].text;
      document.getElementById('progress-bar').style.width = steps[stepIdx].pct + '%';
      stepIdx++;
    }
  }, 2000);

  try {
    const res = await fetch(apiUrl + '/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model_path: '/workspace/chair.glb' })
    });

    clearInterval(progressInterval);
    if (!res.ok) throw new Error('Render failed');
    const data = await res.json();

    document.getElementById('progress-bar').style.width = '100%';
    document.getElementById('render-status').textContent = 'Complete!';

    setTimeout(() => {
      overlay.classList.remove('active');
      document.getElementById('render-btn').disabled = false;

      const elapsed = ((Date.now() - renderStartTime) / 1000).toFixed(1);
      const imgUrl = apiUrl + '/output/' + data.filename + '?t=' + Date.now();
      const img = document.getElementById('result-image');
      img.src = imgUrl;
      img.onload = () => img.classList.add('loaded');
      document.getElementById('result-placeholder').style.display = 'none';
      document.getElementById('result-time').textContent = `Rendered in ${elapsed}s`;
      const dlBtn = document.getElementById('download-btn');
      dlBtn.href = imgUrl;
      dlBtn.classList.add('visible');

      addToHistory(prompt, imgUrl);
      showToast('Render complete ✓');
    }, 800);

  } catch (err) {
    clearInterval(progressInterval);
    overlay.classList.remove('active');
    document.getElementById('render-btn').disabled = false;
    document.getElementById('progress-bar').style.width = '0%';
    showToast('Could not reach API — is Flask running?');
  }
}

function addToHistory(prompt, imgUrl) {
  renderHistory.unshift({ prompt, imgUrl, time: new Date().toLocaleTimeString() });
  const list = document.getElementById('history-list');
  list.innerHTML = renderHistory.slice(0, 5).map(item => `
    <div class="history-item" onclick="loadHistoryResult('${item.imgUrl}')">
      <div class="history-thumb"><img src="${item.imgUrl}" alt=""></div>
      <div class="history-info">
        <div class="history-prompt">${item.prompt}</div>
        <div class="history-time">${item.time}</div>
      </div>
    </div>
  `).join('');
}

function loadHistoryResult(url) {
  const img = document.getElementById('result-image');
  img.src = url;
  img.classList.add('loaded');
  document.getElementById('result-placeholder').style.display = 'none';
}

function resetCamera() {
  const viewer = document.getElementById('model-viewer');
  viewer.cameraOrbit = 'auto auto auto';
  viewer.resetTurntableRotation();
}

function toggleFullscreen() {
  const panel = document.querySelector('.viewer-panel');
  if (!document.fullscreenElement) panel.requestFullscreen();
  else document.exitFullscreen();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}