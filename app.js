// Dynamic Canvas Contouring Simulator for Hero Mockup
const canvas = document.getElementById('hero-contour-canvas');
const ctx = canvas.getContext('2d');
const regenBtn = document.getElementById('regenerate-contour-btn');

const mockX = document.getElementById('mock-x');
const mockY = document.getElementById('mock-y');
const mockZ = document.getElementById('mock-z');

let points = [];
const gridRows = 8;
const gridCols = 10;

function initRandomPoints() {
    points = [];
    for (let r = 0; r < gridRows; r++) {
        points[r] = [];
        for (let c = 0; c < gridCols; c++) {
            // Generate arbitrary elevation heights from 90m to 150m
            const baseVal = 120 + Math.sin(r * 0.8) * 15 + Math.cos(c * 0.6) * 15;
            points[r][c] = baseVal + (Math.random() - 0.5) * 8;
        }
    }
}

// Map elevation to gradient color (Blue -> Green -> Red)
function getElevationColor(val) {
    const minHeight = 90;
    const maxHeight = 150;
    const ratio = Math.max(0, Math.min(1, (val - minHeight) / (maxHeight - minHeight)));
    
    // HSL mapping: Blue (220 deg) at low to Red (0 deg) at high
    const hue = 220 - (ratio * 220);
    return `hsl(${hue}, 85%, 50%)`;
}

function drawContourGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellW = canvas.width / (gridCols - 1);
    const cellH = canvas.height / (gridRows - 1);
    
    // 1. Draw interpolation blocks
    for (let r = 0; r < gridRows - 1; r++) {
        for (let c = 0; c < gridCols - 1; c++) {
            const valTL = points[r][c];
            const valTR = points[r][c+1];
            const valBL = points[r+1][c];
            const valBR = points[r+1][c+1];
            
            const avgVal = (valTL + valTR + valBL + valBR) / 4;
            
            ctx.fillStyle = getElevationColor(avgVal);
            ctx.globalAlpha = 0.25;
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
    }
    ctx.globalAlpha = 1.0;
    
    // 2. Draw isolines (Mock contours)
    ctx.lineWidth = 1.5;
    const contourLevels = [100, 110, 120, 130, 140];
    
    contourLevels.forEach(level => {
        ctx.strokeStyle = getElevationColor(level);
        ctx.beginPath();
        
        // Trace paths connecting segments (simple visualization loop)
        for (let r = 0; r < gridRows - 1; r++) {
            for (let c = 0; c < gridCols - 1; c++) {
                const valTL = points[r][c];
                const valTR = points[r][c+1];
                const valBL = points[r+1][c];
                const valBR = points[r+1][c+1];
                
                const xL = c * cellW;
                const xR = (c + 1) * cellW;
                const yT = r * cellH;
                const yB = (r + 1) * cellH;
                
                // Marching squares segment drawing simulation
                if ((valTL >= level && valTR < level) || (valTL < level && valTR >= level)) {
                    ctx.moveTo(xL + cellW * 0.5, yT);
                    ctx.lineTo(xL, yT + cellH * 0.5);
                }
                if ((valTR >= level && valBR < level) || (valTR < level && valBR >= level)) {
                    ctx.moveTo(xR, yT + cellH * 0.5);
                    ctx.lineTo(xL + cellW * 0.5, yB);
                }
            }
        }
        ctx.stroke();
    });
    
    // 3. Draw grid dots
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            ctx.beginPath();
            ctx.arc(c * cellW, r * cellH, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Interactive coordinates updates
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellW = rect.width / (gridCols - 1);
    const cellH = rect.height / (gridRows - 1);
    
    const colIdx = Math.max(0, Math.min(gridCols - 1, Math.round(x / cellW)));
    const rowIdx = Math.max(0, Math.min(gridRows - 1, Math.round(y / cellH)));
    
    if (points[rowIdx] && points[rowIdx][colIdx]) {
        const height = points[rowIdx][colIdx];
        mockX.textContent = (x * 0.2).toFixed(1);
        mockY.textContent = ((rect.height - y) * 0.2).toFixed(1);
        mockZ.textContent = height.toFixed(1) + "m";
    }
});

// Regenerate Trigger
regenBtn.addEventListener('click', () => {
    initRandomPoints();
    drawContourGrid();
});

// Tab Switch Logic
function switchPlaygroundTab(tabId) {
    document.querySelectorAll('.tab-trigger').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activate target
    const targetBtn = Array.from(document.querySelectorAll('.tab-trigger')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (targetBtn) targetBtn.classList.add('active');
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

// Bearing Calculator Function
function calculateWebBearing() {
    const azInput = parseFloat(document.getElementById('azimuth-input').value);
    const resultBox = document.getElementById('bearing-result');
    const needle = document.getElementById('compass-needle');
    
    if (isNaN(azInput) || azInput < 0 || azInput > 360) {
        resultBox.textContent = "Invalid Input";
        return;
    }
    
    let qb = "";
    const needleAngle = azInput; // Rotate needle to match Azimuth
    needle.style.transform = `translate(-50%, -50%) rotate(${needleAngle}deg)`;
    
    // Normalization/Quadrant logic matching developer details
    if (azInput === 0 || azInput === 360) {
        qb = "Due North (0°)";
    } else if (azInput === 90) {
        qb = "Due East (90°)";
    } else if (azInput === 180) {
        qb = "Due South (180°)";
    } else if (azInput === 270) {
        qb = "Due West (270°)";
    } else if (azInput > 0 && azInput < 90) {
        qb = `N ${azInput.toFixed(2)}° E`;
    } else if (azInput > 90 && azInput < 180) {
        qb = `S ${(180 - azInput).toFixed(2)}° E`;
    } else if (azInput > 180 && azInput < 270) {
        qb = `S ${(azInput - 180).toFixed(2)}° W`;
    } else if (azInput > 270 && azInput < 360) {
        qb = `N ${(360 - azInput).toFixed(2)}° W`;
    }
    
    resultBox.textContent = qb;
}

// Concrete Estimator Function
function calculateWebConcrete() {
    const l = parseFloat(document.getElementById('slab-length').value);
    const w = parseFloat(document.getElementById('slab-width').value);
    const t = parseFloat(document.getElementById('slab-thickness').value);
    const ratio = document.getElementById('mix-ratio').value;
    
    if (isNaN(l) || isNaN(w) || isNaN(t) || l <= 0 || w <= 0 || t <= 0) {
        alert("Please input positive numbers.");
        return;
    }
    
    const wetVolume = l * w * t;
    // Dry volume multiplier (standard is 1.54 for concrete shrinkage/wastage)
    const dryVolume = wetVolume * 1.54; 
    
    // Determine ratio sum
    let parts = ratio.split(':').map(Number);
    const sum = parts[0] + parts[1] + parts[2];
    
    // Cement calculation (parts[0]/sum * dryVolume) in m3, convert to bags (1 bag = 0.035 m3)
    const cementVol = (parts[0] / sum) * dryVolume;
    const cementBags = cementVol / 0.035;
    
    // Sand calculation (parts[1]/sum * dryVolume) in m3, convert to tons (approx 1.5 tons per m3)
    const sandVol = (parts[1] / sum) * dryVolume;
    const sandTons = sandVol * 1.55;
    
    document.getElementById('concrete-vol').textContent = wetVolume.toFixed(2) + " m³";
    document.getElementById('cement-bags').textContent = cementBags.toFixed(1) + " Bags";
    document.getElementById('sand-quantity').textContent = sandTons.toFixed(2) + " Ton";
}

// Sag Tape Correction Function
function calculateWebSag() {
    const w = parseFloat(document.getElementById('sag-weight').value);
    const p = parseFloat(document.getElementById('sag-pull').value);
    const l = parseFloat(document.getElementById('sag-length').value);
    
    if (isNaN(w) || isNaN(p) || isNaN(l) || p <= 0 || l <= 0) {
        alert("Please verify inputs are valid positive numbers.");
        return;
    }
    
    // Standard sag formula: Cs = - (w^2 * L) / (24 * P^2)
    const correction = - (Math.pow(w, 2) * l) / (24 * Math.pow(p, 2));
    
    document.getElementById('sag-result').innerHTML = correction.toFixed(4) + " m";
}

// Run canvas setup immediately
initRandomPoints();
drawContourGrid();
calculateWebBearing();
