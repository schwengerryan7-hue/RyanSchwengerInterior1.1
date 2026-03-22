(function() {
  function init() {
    const mv = document.getElementById('model-viewer');
    if (!mv) return;

    const panel = mv.closest('.viewer-panel') || mv.parentElement;
    const controls = document.createElement('div');
    controls.className = 'viewer-controls';
    controls.innerHTML = `
      <div class="vc-group">
        <span class="vc-label">Camera</span>
        <div class="vc-btns">
          <button class="vc-btn active" data-camera="perspective">3D</button>
          <button class="vc-btn" data-camera="front">F</button>
          <button class="vc-btn" data-camera="side">S</button>
          <button class="vc-btn" data-camera="top">T</button>
        </div>
      </div>
      <div class="vc-group">
        <span class="vc-label">Lighting</span>
        <div class="vc-btns">
          <button class="vc-btn active" data-env="neutral">○</button>
          <button class="vc-btn" data-env="studio">◎</button>
          <button class="vc-btn" data-env="dramatic">●</button>
        </div>
      </div>
      <div class="vc-group">
        <span class="vc-label">Background</span>
        <div class="vc-btns">
          <button class="vc-btn active" data-bg="transparent">□</button>
          <button class="vc-btn" data-bg="#f7f6f4" style="background:#f7f6f4">□</button>
          <button class="vc-btn" data-bg="#1a1916" style="background:#1a1916;color:white">□</button>
        </div>
      </div>
      <div class="vc-group">
        <span class="vc-label">Exposure</span>
        <input class="vc-slider" type="range" min="0.2" max="3" step="0.1" value="1" id="vc-exposure">
      </div>
    `;

    panel.insertBefore(controls, mv);

    controls.querySelectorAll('[data-camera]').forEach(btn => {
      btn.addEventListener('click', () => {
        controls.querySelectorAll('[data-camera]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const presets = {
          perspective: '45deg 60deg 5m',
          front: '0deg 90deg 5m',
          side: '90deg 90deg 5m',
          top: '0deg 0deg 5m'
        };
        mv.cameraOrbit = presets[btn.dataset.camera];
      });
    });

    controls.querySelectorAll('[data-env]').forEach(btn => {
      btn.addEventListener('click', () => {
        controls.querySelectorAll('[data-env]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const envs = {
          neutral: 'neutral',
          studio: 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr',
          dramatic: 'https://modelviewer.dev/shared-assets/environments/whipple_creek_regional_park_04_1k.hdr'
        };
        mv.environmentImage = envs[btn.dataset.env];
      });
    });

    controls.querySelectorAll('[data-bg]').forEach(btn => {
      btn.addEventListener('click', () => {
        controls.querySelectorAll('[data-bg]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mv.style.background = btn.dataset.bg === 'transparent' ? '' : btn.dataset.bg;
      });
    });

    document.getElementById('vc-exposure').addEventListener('input', function() {
      mv.exposure = parseFloat(this.value);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
