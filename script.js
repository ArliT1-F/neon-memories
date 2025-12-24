// Main variables
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const uploadPrompt = document.getElementById('uploadPrompt');
const canvasContainer = document.getElementById('canvasContainer');

let originalImage = null;
let zoom = 1;
let history = [];
let historyIndex = -1;
let currentTool = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let overlays = { timestamp: false, rec: false, play: false };
let currentFrame = 'none';
let activeMobilePanel = null;

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const year = 1985 + Math.floor(Math.random() * 10);
    const text = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')} ${year} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const el = document.getElementById('timestamp');
    if (el) el.textContent = text;
}
setInterval(updateTimestamp, 1000);
updateTimestamp();

// File handling
fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadImage(e.target.files[0]);
});

// Drag and drop
canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadPrompt.classList.add('dragover');
});

canvasContainer.addEventListener('dragleave', () => {
    uploadPrompt.classList.remove('dragover');
});

canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadPrompt.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
});

// Click to upload on mobile
uploadPrompt.addEventListener('click', () => {
    fileInput.click();
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            
            // Responsive max dimensions
            const isMobile = window.innerWidth < 768;
            const maxWidth = isMobile ? window.innerWidth - 40 : 800;
            const maxHeight = isMobile ? 400 : 500;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
            
            document.getElementById('imageInfo').textContent = `${Math.round(width)} × ${Math.round(height)} px`;
            
            saveToHistory();
            resetAdjustments();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// History management
function saveToHistory() {
    historyIndex++;
    history = history.slice(0, historyIndex);
    history.push(canvas.toDataURL());
    updateHistoryButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        loadFromHistory();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        loadFromHistory();
    }
}

function loadFromHistory() {
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        updateHistoryButtons();
    };
    img.src = history[historyIndex];
}

function updateHistoryButtons() {
    document.getElementById('undoBtn').disabled = historyIndex <= 0;
    document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

// Tab switching (desktop)
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const tabBtn = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (tabBtn) tabBtn.classList.add('active');
    
    ['panelAdjust', 'panelEffects', 'panelVintage', 'panelFrames'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    const panel = document.getElementById(`panel${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (panel) panel.classList.remove('hidden');
}

// Mobile Panel Functions
function openMobilePanel(type) {
    activeMobilePanel = type;
    const overlay = document.getElementById('mobilePanelOverlay');
    const panel = document.getElementById('mobilePanel');
    const title = document.getElementById('mobilePanelTitle');
    const content = document.getElementById('mobilePanelContent');
    
    // Update nav buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Set title
    const titles = {
        tools: '🔧 TOOLS',
        adjust: '🎚️ ADJUSTMENTS',
        effects: '✨ EFFECTS',
        vintage: '📷 VINTAGE',
        frames: '🖼️ FRAMES'
    };
    title.textContent = titles[type] || type.toUpperCase();
    
    // Set content
    content.innerHTML = getMobilePanelContent(type);
    
    // Bind events for sliders
    if (type === 'adjust') {
        bindMobileSliders();
    }
    
    overlay.classList.add('active');
    panel.classList.add('active');
}

function closeMobilePanel() {
    document.getElementById('mobilePanelOverlay').classList.remove('active');
    document.getElementById('mobilePanel').classList.remove('active');
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    activeMobilePanel = null;
}

function getMobilePanelContent(type) {
    switch(type) {
        case 'tools':
            return `
                <div class="space-y-4">
                    <div class="tool-section p-4">
                        <h3 class="vhs-font text-sm text-pink-400 mb-3">TRANSFORM</h3>
                        <div class="grid grid-cols-4 gap-3">
                            <button onclick="rotateImage(-90)" class="btn-icon">↺</button>
                            <button onclick="rotateImage(90)" class="btn-icon">↻</button>
                            <button onclick="flipImage('h')" class="btn-icon">⇆</button>
                            <button onclick="flipImage('v')" class="btn-icon">⇅</button>
                        </div>
                    </div>
                    <div class="tool-section p-4">
                        <h3 class="vhs-font text-sm text-pink-400 mb-3">DRAW</h3>
                        <div class="flex items-center gap-3 mb-3">
                            <button onclick="setTool('brush'); updateMobileToolButtons()" class="btn-icon flex-1 ${currentTool === 'brush' ? 'active' : ''}" id="mobileBrushTool">🖌️ Brush</button>
                            <button onclick="setTool('eraser'); updateMobileToolButtons()" class="btn-icon flex-1 ${currentTool === 'eraser' ? 'active' : ''}" id="mobileEraserTool">🧹 Eraser</button>
                        </div>
                        <div class="flex items-center gap-3 mb-3">
                            <div class="color-picker-wrapper">
                                <input type="color" id="mobileBrushColor" value="${document.getElementById('brushColor')?.value || '#ff2a6d'}" onchange="document.getElementById('brushColor').value = this.value">
                            </div>
                            <div class="flex-1 slider-wrapper">
                                <label class="vhs-font text-xs text-gray-400">SIZE</label>
                                <input type="range" id="mobileBrushSize" min="1" max="50" value="${document.getElementById('brushSize')?.value || 5}" onchange="document.getElementById('brushSize').value = this.value">
                            </div>
                        </div>
                    </div>
                    <div class="tool-section p-4">
                        <h3 class="vhs-font text-sm text-pink-400 mb-3">ADD TEXT</h3>
                        <input type="text" id="mobileTextInput" placeholder="Enter text..." 
                            class="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-3 text-base mb-3 focus:border-pink-500 focus:outline-none">
                        <div class="flex gap-2 mb-3">
                            <select id="mobileTextFont" class="flex-1 bg-black/50 border border-cyan-500/30 rounded px-3 py-3 text-sm">
                                <option value="VT323">VHS</option>
                                <option value="Orbitron">RETRO</option>
                                <option value="Press Start 2P">PIXEL</option>
                            </select>
                            <input type="number" id="mobileTextSize" value="32" min="8" max="120" 
                                class="w-20 bg-black/50 border border-cyan-500/30 rounded px-3 py-3 text-sm">
                        </div>
                        <button onclick="addTextMobile()" class="btn-neon w-full">ADD TEXT</button>
                    </div>
                </div>
            `;
            
        case 'adjust':
            return `
                <div class="space-y-5">
                    ${['brightness', 'contrast', 'saturation', 'exposure', 'temperature', 'tint', 'vignette', 'blur', 'hue'].map(adj => `
                        <div class="slider-wrapper">
                            <div class="flex justify-between mb-2">
                                <label class="vhs-font text-sm text-pink-400">${adj.toUpperCase()}</label>
                                <span class="vhs-font text-xs text-cyan-400" id="mobile${adj}Val">${document.getElementById(adj)?.value || 0}${adj === 'hue' ? '°' : ''}</span>
                            </div>
                            <input type="range" id="mobile${adj}" 
                                min="${adj === 'vignette' || adj === 'blur' ? 0 : adj === 'hue' ? 0 : -100}" 
                                max="${adj === 'hue' ? 360 : adj === 'blur' ? 20 : 100}" 
                                value="${document.getElementById(adj)?.value || 0}"
                                step="${adj === 'blur' ? 0.5 : 1}"
                                oninput="syncSlider('${adj}', this.value)">
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'effects':
            return `
                <div class="grid grid-cols-3 gap-3">
                    ${[
                        ['vhs', '📼', 'VHS'],
                        ['glitch', '👾', 'GLITCH'],
                        ['scanlines', '📺', 'SCAN'],
                        ['chromatic', '🌈', 'RGB'],
                        ['pixelate', '🎮', '8-BIT'],
                        ['neon', '💜', 'NEON'],
                        ['cyberpunk', '🌃', 'CYBER'],
                        ['synthwave', '🌅', 'SYNTH'],
                        ['vaporwave', '🌴', 'VAPOR'],
                        ['miami', '🏖️', 'MIAMI'],
                        ['tokyo', '🗼', 'TOKYO'],
                        ['duotone', '🎨', 'DUO']
                    ].map(([id, icon, label]) => `
                        <div class="effect-card" onclick="applyEffect('${id}')">
                            <div class="text-2xl mb-1">${icon}</div>
                            <div class="vhs-font text-xs">${label}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'vintage':
            return `
                <div class="grid grid-cols-3 gap-3">
                    ${[
                        ['sepia', '🟤', 'SEPIA'],
                        ['faded', '🌫️', 'FADED'],
                        ['polaroid', '📷', 'POLAROID'],
                        ['kodak', '🎞️', 'KODAK'],
                        ['grain', '✨', 'GRAIN'],
                        ['dusty', '💨', 'DUSTY'],
                        ['lightleak', '☀️', 'LEAK'],
                        ['oldphoto', '🖼️', 'OLD'],
                        ['1970s', '🕺', '1970s'],
                        ['1980s', '💿', '1980s'],
                        ['1990s', '💾', '1990s'],
                        ['daguerreotype', '🏛️', 'ANTIQUE']
                    ].map(([id, icon, label]) => `
                        <div class="effect-card" onclick="applyVintage('${id}')">
                            <div class="text-2xl mb-1">${icon}</div>
                            <div class="vhs-font text-xs">${label}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'frames':
            return `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="effect-card" onclick="applyFrame('vhsFrame')">
                            <div class="text-2xl mb-1">📼</div>
                            <div class="vhs-font text-xs">VHS FRAME</div>
                        </div>
                        <div class="effect-card" onclick="applyFrame('polaroidFrame')">
                            <div class="text-2xl mb-1">🖼️</div>
                            <div class="vhs-font text-xs">POLAROID</div>
                        </div>
                        <div class="effect-card" onclick="applyFrame('neonBorder')">
                            <div class="text-2xl mb-1">💠</div>
                            <div class="vhs-font text-xs">NEON</div>
                        </div>
                        <div class="effect-card" onclick="applyFrame('none')">
                            <div class="text-2xl mb-1">❌</div>
                            <div class="vhs-font text-xs">NO FRAME</div>
                        </div>
                    </div>
                    <div class="tool-section p-4">
                        <h3 class="vhs-font text-sm text-pink-400 mb-3">OVERLAYS</h3>
                        <div class="space-y-2">
                            <label class="checkbox-wrapper">
                                <input type="checkbox" id="mobileOverlayTimestamp" ${overlays.timestamp ? 'checked' : ''} onchange="toggleOverlay('timestamp')">
                                <span class="vhs-font text-sm">📅 TIMESTAMP</span>
                            </label>
                            <label class="checkbox-wrapper">
                                <input type="checkbox" id="mobileOverlayRec" ${overlays.rec ? 'checked' : ''} onchange="toggleOverlay('rec')">
                                <span class="vhs-font text-sm">🔴 REC</span>
                            </label>
                            <label class="checkbox-wrapper">
                                <input type="checkbox" id="mobileOverlayPlay" ${overlays.play ? 'checked' : ''} onchange="toggleOverlay('play')">
                                <span class="vhs-font text-sm">▶ PLAY</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
            
        default:
            return '';
    }
}

function syncSlider(name, value) {
    const desktopSlider = document.getElementById(name);
    if (desktopSlider) desktopSlider.value = value;
    
    const valDisplay = document.getElementById(`mobile${name}Val`);
    if (valDisplay) valDisplay.textContent = value + (name === 'hue' ? '°' : '');
    
    updateAdjustments();
}

function bindMobileSliders() {
    // Sliders are already bound via oninput in HTML
}

function updateMobileToolButtons() {
    const brushBtn = document.getElementById('mobileBrushTool');
    const eraserBtn = document.getElementById('mobileEraserTool');
    if (brushBtn) brushBtn.classList.toggle('active', currentTool === 'brush');
    if (eraserBtn) eraserBtn.classList.toggle('active', currentTool === 'eraser');
}

function addTextMobile() {
    const text = document.getElementById('mobileTextInput')?.value;
    const font = document.getElementById('mobileTextFont')?.value || 'VT323';
    const size = document.getElementById('mobileTextSize')?.value || 32;
    const color = document.getElementById('mobileBrushColor')?.value || '#ff2a6d';
    
    if (!text || !originalImage) return;
    
    ctx.font = `${size}px ${font}, monospace`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
    
    saveToHistory();
}

// Adjustments
function updateAdjustments() {
    if (!originalImage) return;
    
    const getValue = (id) => parseFloat(document.getElementById(id)?.value || 0);
    
    const brightness = getValue('brightness');
    const contrast = getValue('contrast');
    const saturation = getValue('saturation');
    const exposure = getValue('exposure');
    const hue = getValue('hue');
    const blur = getValue('blur');
    const vignette = getValue('vignette');
    const temperature = getValue('temperature');
    const tint = getValue('tint');
    
    // Update desktop value displays
    const updateVal = (id, val, suffix = '') => {
        const el = document.getElementById(id);
        if (el) el.textContent = val + suffix;
    };
    
    updateVal('brightnessVal', brightness);
    updateVal('contrastVal', contrast);
    updateVal('saturationVal', saturation);
    updateVal('exposureVal', exposure);
    updateVal('temperatureVal', temperature);
    updateVal('tintVal', tint);
    updateVal('vignetteVal', vignette);
    updateVal('blurVal', blur);
    updateVal('hueVal', hue, '°');
    
    // Apply CSS filters
    const brightnessFilter = (brightness + 100) / 100;
    const contrastFilter = (contrast + 100) / 100;
    const saturationFilter = (saturation + 100) / 100;
    const exposureFilter = 1 + (exposure / 100);
    
    ctx.filter = `brightness(${brightnessFilter * exposureFilter}) contrast(${contrastFilter}) saturate(${saturationFilter}) hue-rotate(${hue}deg) blur(${blur}px)`;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    
    // Apply temperature/tint
    if (temperature !== 0 || tint !== 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] + temperature * 0.5));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - temperature * 0.5));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + tint * 0.3));
        }
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Apply vignette
    if (vignette > 0) {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    renderOverlays();
}

function resetAdjustments() {
    ['brightness', 'contrast', 'saturation', 'exposure', 'temperature', 'tint', 'vignette', 'blur', 'hue'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 0;
    });
    updateAdjustments();
}

function resetImage() {
    if (originalImage) {
        resetAdjustments();
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        currentFrame = 'none';
        overlays = { timestamp: false, rec: false, play: false };
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        saveToHistory();
    }
}

// Effects (same as before, condensed)
function applyEffect(effect) {
    if (!originalImage) return;
    updateAdjustments();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const effects = {
        vhs: () => {
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 25;
                data[i] = Math.min(255, Math.max(0, data[i] + noise + 15));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 25));
            }
        },
        glitch: () => {
            const temp = new Uint8ClampedArray(data);
            for (let y = 0; y < canvas.height; y++) {
                if (Math.random() > 0.92) {
                    const offset = Math.floor((Math.random() - 0.5) * 60);
                    for (let x = 0; x < canvas.width; x++) {
                        const srcX = Math.min(canvas.width - 1, Math.max(0, x + offset));
                        const srcIdx = (y * canvas.width + srcX) * 4;
                        const dstIdx = (y * canvas.width + x) * 4;
                        data[dstIdx] = temp[srcIdx];
                        data[dstIdx + 1] = temp[srcIdx + 1];
                        data[dstIdx + 2] = temp[srcIdx + 2];
                    }
                }
            }
        },
        scanlines: () => {
            for (let y = 0; y < canvas.height; y += 2) {
                for (let x = 0; x < canvas.width; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    data[idx] *= 0.7;
                    data[idx + 1] *= 0.7;
                    data[idx + 2] *= 0.7;
                }
            }
        },
        chromatic: () => {
            const temp = new Uint8ClampedArray(data);
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    const rIdx = (y * canvas.width + Math.min(canvas.width - 1, x + 6)) * 4;
                    const bIdx = (y * canvas.width + Math.max(0, x - 6)) * 4;
                    data[idx] = temp[rIdx];
                    data[idx + 2] = temp[bIdx];
                }
            }
        },
        pixelate: () => {
            const size = 6;
            for (let y = 0; y < canvas.height; y += size) {
                for (let x = 0; x < canvas.width; x += size) {
                    const idx = (y * canvas.width + x) * 4;
                    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                    for (let py = 0; py < size && y + py < canvas.height; py++) {
                        for (let px = 0; px < size && x + px < canvas.width; px++) {
                            const pIdx = ((y + py) * canvas.width + (x + px)) * 4;
                            data[pIdx] = r; data[pIdx + 1] = g; data[pIdx + 2] = b;
                        }
                    }
                }
            }
        },
        neon: () => {
            for (let i = 0; i < data.length; i += 4) {
                if ((data[i] + data[i + 1] + data[i + 2]) / 3 > 100) {
                    data[i] = Math.min(255, data[i] * 1.4);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.5);
                }
                data[i + 1] *= 0.6;
            }
        },
        cyberpunk: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 0.8 + 40);
                data[i + 1] *= 0.9;
                data[i + 2] = Math.min(255, data[i + 2] * 1.3);
            }
        },
        synthwave: () => {
            for (let i = 0; i < data.length; i += 4) {
                const y = Math.floor((i / 4) / canvas.width) / canvas.height;
                data[i] = Math.min(255, data[i] * (1.2 + y * 0.3));
                data[i + 1] *= (0.6 + y * 0.2);
                data[i + 2] = Math.min(255, data[i + 2] * (1.4 - y * 0.3));
            }
        },
        vaporwave: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 0.9 + 60);
                data[i + 1] = Math.min(255, data[i + 1] * 1.1 + 40);
                data[i + 2] = Math.min(255, data[i + 2] * 1.2 + 70);
            }
        },
        miami: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.3 + 30);
                data[i + 1] *= 0.85;
                data[i + 2] = Math.min(255, data[i + 2] * 1.2 + 50);
            }
        },
        tokyo: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1 + 20);
                data[i + 1] *= 0.7;
                data[i + 2] = Math.min(255, data[i + 2] * 1.5);
            }
        },
        duotone: () => {
            for (let i = 0; i < data.length; i += 4) {
                const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = Math.min(255, gray * 1.5);
                data[i + 1] = gray * 0.2;
                data[i + 2] = Math.min(255, gray * 1.8);
            }
        }
    };
    
    if (effects[effect]) effects[effect]();
    ctx.putImageData(imageData, 0, 0);
    renderOverlays();
    saveToHistory();
}

// Vintage effects
function applyVintage(effect) {
    if (!originalImage) return;
    updateAdjustments();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const effects = {
        sepia: () => {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            }
        },
        faded: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 0.9 + 25);
                data[i + 1] = Math.min(255, data[i + 1] * 0.85 + 20);
                data[i + 2] = Math.min(255, data[i + 2] * 0.8 + 30);
            }
        },
        polaroid: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1 + 10);
                data[i + 1] = Math.min(255, data[i + 1] * 1.05 + 10);
                data[i + 2] = data[i + 2] * 0.9 + 20;
            }
        },
        kodak: () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.15 + 15);
                data[i + 1] = Math.min(255, data[i + 1] * 1.05 + 5);
                data[i + 2] = data[i + 2] * 0.85;
            }
        },
        grain: () => {
            for (let i = 0; i < data.length; i += 4) {
                const grain = (Math.random() - 0.5) * 40;
                data[i] = Math.min(255, Math.max(0, data[i] + grain));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
            }
        },
        dusty: () => {
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() > 0.995) data[i] = data[i + 1] = data[i + 2] = 255;
                const grain = (Math.random() - 0.5) * 20;
                data[i] = Math.min(255, Math.max(0, data[i] + grain + 10));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain + 5));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
            }
        },
        lightleak: () => {
            for (let i = 0; i < data.length; i += 4) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                const dist = Math.sqrt(Math.pow(x - canvas.width * 0.8, 2) + Math.pow(y - canvas.height * 0.2, 2));
                const maxDist = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2)) * 0.5;
                const intensity = Math.max(0, 1 - dist / maxDist) * 100;
                data[i] = Math.min(255, data[i] + intensity * 1.5);
                data[i + 1] = Math.min(255, data[i + 1] + intensity * 0.8);
            }
        },
        oldphoto: () => {
            for (let i = 0; i < data.length; i += 4) {
                const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const grain = (Math.random() - 0.5) * 30;
                data[i] = Math.min(255, gray * 1.1 + 30 + grain);
                data[i + 1] = Math.min(255, gray * 0.9 + 15 + grain);
                data[i + 2] = Math.min(255, gray * 0.7 + grain);
            }
        },
        '1970s': () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1 + 20);
                data[i + 1] = Math.min(255, data[i + 1] * 0.95 + 10);
                data[i + 2] = data[i + 2] * 0.8;
            }
        },
        '1980s': () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.2 + 15);
                data[i + 1] = data[i + 1] * 0.85;
                data[i + 2] = Math.min(255, data[i + 2] * 1.3 + 20);
            }
        },
        '1990s': () => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.05 + 5);
                data[i + 1] = Math.min(255, data[i + 1] * 1.1);
                data[i + 2] = Math.min(255, data[i + 2] * 1.15 + 10);
            }
        },
        daguerreotype: () => {
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const contrast = ((gray - 128) * 1.3) + 128;
                data[i] = Math.min(255, contrast + 20);
                data[i + 1] = Math.min(255, contrast + 10);
                data[i + 2] = contrast;
            }
        }
    };
    
    if (effects[effect]) effects[effect]();
    ctx.putImageData(imageData, 0, 0);
    renderOverlays();
    saveToHistory();
}

// Frames & Overlays
function applyFrame(frame) {
    currentFrame = frame;
    updateAdjustments();
    saveToHistory();
}

function toggleOverlay(overlay) {
    overlays[overlay] = !overlays[overlay];
    updateAdjustments();
}

function renderOverlays() {
    if (currentFrame === 'vhsFrame') {
        const topGrad = ctx.createLinearGradient(0, 0, 0, 50);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, 50);
        
        const bottomGrad = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
        bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bottomGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    }
    
    if (currentFrame === 'polaroidFrame') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 15;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    }
    
    if (currentFrame === 'neonBorder') {
        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 15;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.strokeStyle = '#05d9e8';
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
        ctx.shadowBlur = 0;
    }
    
    if (overlays.timestamp) {
        const now = new Date();
        const year = 1985 + Math.floor(Math.random() * 10);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px VT323, monospace';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`${now.getMonth() + 1}/${now.getDate()}/${year}`, canvas.width - 120, canvas.height - 15);
        ctx.shadowBlur = 0;
    }
    
    if (overlays.rec) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(25, 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px VT323, monospace';
        ctx.fillText('REC', 38, 30);
    }
    
    if (overlays.play) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px VT323, monospace';
        ctx.fillText('▶ PLAY', 15, canvas.height - 15);
    }
}

// Transform functions
function rotateImage(degrees) {
    if (!originalImage) return;
    
    const temp = document.createElement('canvas');
    const tempCtx = temp.getContext('2d');
    
    if (Math.abs(degrees) === 90) {
        temp.width = canvas.height;
        temp.height = canvas.width;
    } else {
        temp.width = canvas.width;
        temp.height = canvas.height;
    }
    
    tempCtx.translate(temp.width / 2, temp.height / 2);
    tempCtx.rotate(degrees * Math.PI / 180);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    canvas.width = temp.width;
    canvas.height = temp.height;
    ctx.drawImage(temp, 0, 0);
    
    const newImg = new Image();
    newImg.onload = () => { originalImage = newImg; };
    newImg.src = canvas.toDataURL();
    
    saveToHistory();
}

function flipImage(direction) {
    if (!originalImage) return;
    
    const temp = document.createElement('canvas');
    const tempCtx = temp.getContext('2d');
    temp.width = canvas.width;
    temp.height = canvas.height;
    
    if (direction === 'h') {
        tempCtx.translate(canvas.width, 0);
        tempCtx.scale(-1, 1);
    } else {
        tempCtx.translate(0, canvas.height);
        tempCtx.scale(1, -1);
    }
    
    tempCtx.drawImage(canvas, 0, 0);
    ctx.drawImage(temp, 0, 0);
    
    const newImg = new Image();
    newImg.onload = () => { originalImage = newImg; };
    newImg.src = canvas.toDataURL();
    
    saveToHistory();
}

// Zoom
function zoomCanvas(delta) {
    zoom = Math.max(0.25, Math.min(3, zoom + delta));
    canvas.style.transform = `scale(${zoom})`;
    document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
}

function resetZoom() {
    zoom = 1;
    canvas.style.transform = 'scale(1)';
    document.getElementById('zoomLevel').textContent = '100%';
}

// Drawing tools with touch support
function setTool(tool) {
    currentTool = currentTool === tool ? null : tool;
    const brushBtn = document.getElementById('brushTool');
    const eraserBtn = document.getElementById('eraserTool');
    if (brushBtn) brushBtn.classList.toggle('active', currentTool === 'brush');
    if (eraserBtn) eraserBtn.classList.toggle('active', currentTool === 'eraser');
    canvas.style.cursor = currentTool ? 'crosshair' : 'default';
}

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

function handleTouchStart(e) {
    if (!currentTool) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
}

function handleTouchMove(e) {
    if (!isDrawing || !currentTool) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : (document.getElementById('brushColor')?.value || '#ff2a6d');
    ctx.lineWidth = document.getElementById('brushSize')?.value || 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastX = x;
    lastY = y;
}

function startDrawing(e) {
    if (!currentTool) return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
    lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
}

function draw(e) {
    if (!isDrawing || !currentTool) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : (document.getElementById('brushColor')?.value || '#ff2a6d');
    ctx.lineWidth = document.getElementById('brushSize')?.value || 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveToHistory();
    }
}

// Text tool
function addText() {
    if (!originalImage) return;
    
    const text = document.getElementById('textInput')?.value;
    if (!text) return;
    
    const font = document.getElementById('textFont')?.value || 'VT323';
    const size = document.getElementById('textSize')?.value || 32;
    const color = document.getElementById('brushColor')?.value || '#ff2a6d';
    
    ctx.font = `${size}px ${font}, monospace`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
    
    saveToHistory();
}

// Download
function downloadImage(format = 'png') {
    if (!originalImage) return;
    
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.download = `neon_memories_${timestamp}.${format}`;
    link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.9);
    link.click();
}

// Handle resize
window.addEventListener('resize', () => {
    if (activeMobilePanel && window.innerWidth >= 1024) {
        closeMobilePanel();
    }
});