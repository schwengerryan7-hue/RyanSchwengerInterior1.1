let currentView = 'render';
let history = [];
let currentFile = null;

// File upload
document.getElementById('file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  currentFile = file;
  const zone = document.getElementById('upload-zone');
  zone.classList.add('has-file');
  zone.querySelector('.upload-text').innerHTML = `<strong>${file.name}</strong><br><span style="color:var(--text-muted)">Click to change</span>`;
  document.getElementById('file-label').textContent = file.name;
  const url = URL.createObjectURL(file);
  document.getElementById('model-viewer').src = url;
  showToast('Model loaded: ' + file.name);
});

// Drag and drop
const zone = document.getElementById('upload-zone');
zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--text)'; });
zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('file-input').files = dt.files;
    document.getElementById('file-input').dispatchEvent(new Event('change'));
  }
});

function setView(view) {
  currentView = view;
  const rv = document.getElementById('render-view');
  const mv = document.getElementById('model-viewer');
  document.getElementById('btn-render').classList.toggle('active', view === 'render');
  document.getElementById('btn-3d').classList.toggle('active', view === '3d');
  rv.style.display = view === 'render' ? 'flex' : 'none';
  mv.style.display = view === '3d' ? 'block' : 'none';
  if (view === '3d') mv.style.flex = '1';
}

function selectPreset(btn, prompt) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('prompt-input').value = prompt;
}

function addSuggestion(text) {
  const input = document.getElementById('prompt-input');
  const val = input.value.trim();
  input.value = val ? val + ', ' + text : text;
  input.focus();
}

async function triggerRender() {
  const prompt = document.getElementById('prompt-input').value.trim();
  const apiUrl = document.getElementById('api-url').value.trim();
  if (!prompt) { showToast('Enter a prompt first'); return; }
  if (!apiUrl) { showToast('Enter API URL first'); return; }

  const btn = document.getElementById('render-btn');
  btn.disabled = true;
  btn.textContent = 'Rendering...';
  startLoading();

  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    if (currentFile) formData.append('model', currentFile);

    const start = Date.now();
    const res = await fetch(`${apiUrl}/render`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (data.image_url) showResult(`${apiUrl}${data.image_url}`, prompt, elapsed);
    if (data.glb_url) document.getElementById('model-viewer').src = `${apiUrl}${data.glb_url}`;

  } catch (err) {
    showToast('Could not reach API — is Flask running on RunPod?');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Render';
    stopLoading();
  }
}

function showResult(imgUrl, prompt, time) {
  const renderImg = document.getElementById('render-img');
  renderImg.src = imgUrl;
  renderImg.classList.add('visible');
  document.getElementById('empty-viewer').style.display = 'none';
  setView('render');

  const ri = document.getElementById('result-img');
  ri.src = imgUrl;
  ri.classList.add('loaded');
  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-time').textContent = `Rendered in ${time}s`;
  document.getElementById('stat-time').textContent = time + 's';

  const dl = document.getElementById('download-btn');
  dl.href = imgUrl;
  dl.classList.add('visible');

  // Feed compare slider if we have a previous render
  const prevImg = document.getElementById('render-img').src;
  if (prevImg && prevImg !== imgUrl && window.updateCompare) {
    window.updateCompare(prevImg, imgUrl);
  }

  addHistory(prompt, imgUrl, time);
  showToast(`Done in ${time}s`);
}

function addHistory(prompt, imgUrl, time) {
  const list = document.getElementById('history-list');
  if (history.length === 0) list.innerHTML = '';
  history.unshift({ prompt, imgUrl, time });

  const item = document.createElement('div');
  item.className = 'history-item active';
  item.innerHTML = `
    <div class="history-thumb">
      ${imgUrl ? `<img src="${imgUrl}">` : '🪑'}
    </div>
    <div class="history-info">
      <div class="history-prompt">${prompt}</div>
      <div class="history-time">${time}s · 256 samples</div>
    </div>
  `;
  item.onclick = () => {
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    if (imgUrl) {
      document.getElementById('render-img').src = imgUrl;
      document.getElementById('render-img').classList.add('visible');
      document.getElementById('empty-viewer').style.display = 'none';
      setView('render');
    }
  };
  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
  list.prepend(item);
}

const loadingSteps = [
  [15, 'Parsing prompt...'],
  [30, 'Loading 3D scene...'],
  [50, 'Applying materials...'],
  [70, 'Rendering with Cycles...'],
  [90, 'Saving output...'],
];
let loadingTimer;

function startLoading() {
  document.getElementById('render-overlay').classList.add('active');
  let i = 0;
  loadingTimer = setInterval(() => {
    if (i < loadingSteps.length) {
      document.getElementById('progress-bar').style.width = loadingSteps[i][0] + '%';
      document.getElementById('render-status').textContent = loadingSteps[i][1];
      i++;
    }
  }, 700);
}

function stopLoading() {
  clearInterval(loadingTimer);
  document.getElementById('progress-bar').style.width = '100%';
  setTimeout(() => {
    document.getElementById('render-overlay').classList.remove('active');
    document.getElementById('progress-bar').style.width = '0%';
  }, 400);
}

// API health check
document.getElementById('api-url').addEventListener('blur', async function() {
  const url = this.value.trim();
  if (!url) return;
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      document.getElementById('conn-dot').classList.add('connected');
      document.getElementById('conn-label').textContent = 'Connected';
      showToast('API connected ✓');
    }
  } catch {
    document.getElementById('conn-dot').classList.remove('connected');
    document.getElementById('conn-label').textContent = 'Not connected';
  }
});

// Cmd+Enter to render
document.getElementById('prompt-input').addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') triggerRender();
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}