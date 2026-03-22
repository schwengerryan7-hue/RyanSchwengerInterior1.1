// compare.js — Before/After image comparison slider

class CompareSlider {
  constructor(container) {
    this.container = container;
    this.isDragging = false;
    this.position = 50; // percent
    this.beforeImg = null;
    this.afterImg = null;
    this.build();
  }

  build() {
    this.container.innerHTML = `
      <div class="cs-wrap">
        <div class="cs-after">
          <img class="cs-img" id="cs-after-img" src="" alt="After">
          <span class="cs-tag cs-tag-after">After</span>
        </div>
        <div class="cs-before">
          <img class="cs-img" id="cs-before-img" src="" alt="Before">
          <span class="cs-tag cs-tag-before">Before</span>
        </div>
        <div class="cs-handle">
          <div class="cs-line"></div>
          <div class="cs-circle">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10l-4 0M6 10l-2-2M6 10l-2 2M14 10l4 0M14 10l2-2M14 10l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="cs-line"></div>
        </div>
        <div class="cs-empty">
          <span>Load before & after renders to compare</span>
        </div>
      </div>
    `;

    this.wrap = this.container.querySelector('.cs-wrap');
    this.beforeEl = this.container.querySelector('.cs-before');
    this.handle = this.container.querySelector('.cs-handle');
    this.empty = this.container.querySelector('.cs-empty');

    this.bindDrag();
    this.setPosition(50);
  }

  bindDrag() {
    const onMove = (x) => {
      if (!this.isDragging) return;
      const rect = this.wrap.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
      this.setPosition(pct);
    };

    this.handle.addEventListener('mousedown', (e) => { this.isDragging = true; e.preventDefault(); });
    this.wrap.addEventListener('mousedown', (e) => { this.isDragging = true; onMove(e.clientX); });
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', () => { this.isDragging = false; });

    // Touch
    this.handle.addEventListener('touchstart', (e) => { this.isDragging = true; e.preventDefault(); });
    this.wrap.addEventListener('touchstart', (e) => { this.isDragging = true; onMove(e.touches[0].clientX); });
    window.addEventListener('touchmove', (e) => { if (this.isDragging) onMove(e.touches[0].clientX); });
    window.addEventListener('touchend', () => { this.isDragging = false; });

    // Click anywhere on wrap
    this.wrap.addEventListener('click', (e) => onMove(e.clientX));
  }

  setPosition(pct) {
    this.position = pct;
    this.beforeEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    this.handle.style.left = `${pct}%`;
  }

  setImages(beforeSrc, afterSrc) {
    const beforeImg = this.container.querySelector('#cs-before-img');
    const afterImg = this.container.querySelector('#cs-after-img');
    beforeImg.src = beforeSrc;
    afterImg.src = afterSrc;
    this.empty.style.display = 'none';
    this.wrap.classList.add('cs-loaded');
    // Animate handle in
    this.setPosition(50);
    setTimeout(() => this.animateIn(), 100);
  }

  animateIn() {
    let pct = 50;
    let dir = 1;
    let steps = 0;
    const anim = setInterval(() => {
      pct += dir * 2;
      this.setPosition(pct);
      steps++;
      if (pct >= 70) dir = -1;
      if (steps > 30) { clearInterval(anim); this.setPosition(50); }
    }, 16);
  }
}

// CSS for compare slider — injected dynamically
const compareCSS = `
.compare-panel { padding: 0; }

.cs-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--off-white);
  overflow: hidden;
  cursor: col-resize;
  user-select: none;
}

.cs-after, .cs-before {
  position: absolute;
  inset: 0;
}

.cs-before {
  clip-path: inset(0 50% 0 0);
  transition: clip-path 0s;
}

.cs-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cs-tag {
  position: absolute;
  top: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  pointer-events: none;
}

.cs-tag-after {
  right: 12px;
  background: rgba(26,25,22,0.7);
  color: white;
}

.cs-tag-before {
  left: 12px;
  background: rgba(255,255,255,0.85);
  color: var(--text);
}

.cs-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.cs-line {
  flex: 1;
  width: 2px;
  background: white;
  box-shadow: 0 0 8px rgba(0,0,0,0.3);
}

.cs-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  flex-shrink: 0;
  pointer-events: all;
  cursor: col-resize;
  transition: transform 0.15s;
}

.cs-circle:hover { transform: scale(1.1); }

.cs-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--off-white);
}

.cs-wrap.cs-loaded .cs-empty { display: none; }

/* Viewer controls */
.viewer-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--white);
  flex-wrap: wrap;
}

.vc-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vc-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  white-space: nowrap;
}

.vc-btns { display: flex; gap: 4px; }

.vc-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--white);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans', sans-serif;
}

.vc-btn:hover { border-color: var(--text); color: var(--text); background: var(--off-white); }
.vc-btn.active { background: var(--text); color: white; border-color: var(--text); }

.vc-slider {
  width: 80px;
  height: 2px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--mid);
  border-radius: 1px;
  outline: none;
  cursor: pointer;
}

.vc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
`;

// Inject CSS
const styleEl = document.createElement('style');
styleEl.textContent = compareCSS;
document.head.appendChild(styleEl);

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('compare-container');
  if (container) {
    window.compareSlider = new CompareSlider(container);
  }
});

// Global function to update slider from render results
window.updateCompare = function(beforeSrc, afterSrc) {
  if (window.compareSlider) {
    window.compareSlider.setImages(beforeSrc, afterSrc);
  }
};