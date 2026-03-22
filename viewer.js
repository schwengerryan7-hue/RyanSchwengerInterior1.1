// viewer.js — Enhanced 3D Viewer with lighting, backgrounds, and camera presets

class EnhancedViewer {
  constructor(modelViewerEl) {
    this.mv = modelViewerEl;
    this.currentEnv = 'neutral';
    this.currentBg = 'transparent';
    this.init();
  }

  init() {
    this.buildControls();
    this.bindEvents();
  }

  buildControls() {
    const wrap = this.mv.closest('.viewer-panel') || this.mv.parentElement;

    const controls = document.createElement('div');
    controls.className = 'viewer-controls';
    controls.innerHTML = `
      <div class="vc-group">
        <span class="vc-label">Camera</span>
        <div class="vc-btns">
          <button class="vc-btn active" data-camera="perspective" title="Perspective">⬡</button>
          <button class="vc-btn" data-camera="front" title="Front">F</button>
          <button class="vc-btn" data-camera="side" title="Side">S</button>
          <button class="vc-btn" data-camera="top" title="Top">T</button>
        </div>
      </div>
      <div class="vc-group">
        <span class="vc-label">Lighting</span>
        <div class="vc-btns">
          <button class="vc-btn active" data-env="neutral" title="Neutral">○</button>
          <button class="vc-btn" data-env="studio" title="Studio">◎</button>
          <button class="vc-btn" data-env="outdoor" title="Outdoor">◑</button>
          <button class="vc-btn" data-env="dramatic" title="Dramatic">●</button>
        </div>
      </div>
      <div class="vc-group">
        <span class="vc-label">Background</span>
        <div class="vc-btns">
          <button class="vc-btn active" data-bg="transparent" title="Transparent" style="background: repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0 / 10px 10px;"></button>
          <button class="vc-btn" data-bg="#f7f6f4" title="Off-white" style="background:#f7f6f4;"></button>
          <button class="vc-btn" data-bg="#1a1916" title="Dark" style="background:#1a1916;"></button>
          <button class="vc-btn" data-bg="#e8f4f8" title="Studio Blue" style="background:#e8f4f8;"></button>
        </div>
      </div>
      <div class="vc-group">
        <span class="vc-label">Exposure</span>
        <input class="vc-slider" type="range" min="0.2" max="3" step="0.1" value="1" data-control="exposure" title="Exposure">
      </div>
      <div class="vc-group">
        <span class="vc-label">Shadow</span>
        <input class="vc-slider" type="range" min="0" max="3" step="0.1" value="1" data-control="shadow" title="Shadow intensity">
      </div>
    `;

    // Insert before model-viewer
    wrap.insertBefore(controls, this.mv);
    this.controls = controls;
  }

  bindEvents() {
    // Camera presets
    this.controls.querySelectorAll('[data-camera]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controls.querySelectorAll('[data-camera]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setCamera(btn.dataset.camera);
      });
    });

    // Environment / lighting
    const envMap = {
      neutral: 'neutral',
      studio: 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr',
      outdoor: 'https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr',
      dramatic: 'https://modelviewer.dev/shared-assets/environments/whipple_creek_regional_park_04_1k.hdr',
    };

    this.controls.querySelectorAll('[data-env]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controls.querySelectorAll('[data-env]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mv.environmentImage = envMap[btn.dataset.env] || 'neutral';
        this.mv.skyboxImage = null;
      });
    });

    // Background
    this.controls.querySelectorAll('[data-bg]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controls.querySelectorAll('[data-bg]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const bg = btn.dataset.bg;
        if (bg === 'transparent') {
          this.mv.style.background = 'transparent';
          this.mv.removeAttribute('skybox-image');
        } else {
          this.mv.style.background = bg;
        }
      });
    });

    // Exposure slider
    const expSlider = this.controls.querySelector('[data-control="exposure"]');
    expSlider.addEventListener('input', () => {
      this.mv.exposure = parseFloat(expSlider.value);
    });

    // Shadow slider
    const shadowSlider = this.controls.querySelector('[data-control="shadow"]');
    shadowSlider.addEventListener('input', () => {
      this.mv.shadowIntensity = parseFloat(shadowSlider.value);
    });
  }

  setCamera(preset) {
    const presets = {
      perspective: { orbit: '45deg 60deg 5m', fov: '30deg' },
      front:       { orbit: '0deg 90deg 5m', fov: '25deg' },
      side:        { orbit: '90deg 90deg 5m', fov: '25deg' },
      top:         { orbit: '0deg 0deg 5m', fov: '30deg' },
    };
    const p = presets[preset];
    if (p) {
      this.mv.cameraOrbit = p.orbit;
      this.mv.fieldOfView = p.fov;
    }
  }

  loadModel(url) {
    this.mv.src = url;
  }
}

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const mv = document.getElementById('model-viewer');
  if (mv) {
    window.enhancedViewer = new EnhancedViewer(mv);
  }
});