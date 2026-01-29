/**
 * Participa DF - Main Application Logic
 * -------------------------------------
 * This file handles all client-side interactions for the PWA, including:
 * 1. Form submission and local database storage (LocalStorage).
 * 2. Integration with the Backend API (Gemini) for classification and PII redaction.
 * 3. Audio recording and visualization (Web Audio API).
 * 4. Video recording (MediaRecorder API).
 * 5. Dashboard rendering (Chart.js).
 */

// DOM Elements
const textInput = document.getElementById('text-input');
const aiCategory = document.getElementById('ai-category');
const aiFeedback = document.getElementById('ai-feedback');
const improveTextBtn = document.getElementById('improve-text-btn');
const privacyPill = document.getElementById('privacy-pill');
const privacyStatus = document.getElementById('privacy-status');
const piiWarning = document.getElementById('pii-warning');
const viewRedactedBtn = document.getElementById('view-redacted-btn');
const redactedModal = document.getElementById('redacted-modal');
const redactedContent = document.getElementById('redacted-content');
const closeRedactedBtn = document.getElementById('close-redacted-btn'); // One declaration only

// DB Elements
const submissionsBtn = document.getElementById('submissions-btn');
const submissionsModal = document.getElementById('submissions-modal');
const closeSubmissionsBtn = document.getElementById('close-submissions-btn');
const submissionsList = document.getElementById('submissions-list');
const clearDbBtn = document.getElementById('clear-db-btn');
const finalSubmitBtn = document.getElementById('final-submit-btn'); // Need to ensure this exists in HTML or find the button

let latestRedactedText = "";
let db = JSON.parse(localStorage.getItem('participa_df_db') || '[]');

// --- Database Logic ---
function saveSubmission(data) {
    db.unshift(data); // Add to top
    localStorage.setItem('participa_df_db', JSON.stringify(db));
    alert("Manifestação enviada com sucesso! Protocolo: " + data.id);
    // Clear form
    textInput.value = '';
    aiCategory.textContent = 'Detectando...';
    aiFeedback.classList.add('hidden');
    privacyPill.classList.add('hidden');
    piiWarning.classList.add('hidden');
    if (viewRedactedBtn) viewRedactedBtn.classList.add('hidden');
}

function renderSubmissions() {
    submissionsList.innerHTML = '';
    if (db.length === 0) {
        submissionsList.innerHTML = '<p style="text-align: center; color: #888; margin-top: 50px;">Nenhuma manifestação registrada ainda.</p>';
        return;
    }

    db.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = 'background: #f8f9fa; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                <strong style="color: var(--gdf-blue-dark);">#${item.id}</strong>
                <span style="color: #666;">${item.date}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="background: #e9ecef; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${item.type}</span>
                <span style="background: ${item.privacy === 'Sigiloso' ? '#f8d7da' : '#d4edda'}; color: ${item.privacy === 'Sigiloso' ? '#721c24' : '#155724'}; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 5px;">${item.privacy}</span>
                <span style="background: #cce5ff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 5px;">${item.category}</span>
            </div>
            <p style="font-size: 0.95rem; color: #333; white-space: pre-wrap;">${item.text}</p>
        `;
        submissionsList.appendChild(div);
    });
}

if (submissionsBtn) {
    submissionsBtn.addEventListener('click', () => {
        renderSubmissions();
        submissionsModal.classList.remove('hidden');
    });

    closeSubmissionsBtn.addEventListener('click', () => {
        submissionsModal.classList.add('hidden');
    });

    clearDbBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
            db = [];
            localStorage.removeItem('participa_df_db');
            renderSubmissions();
        }
    });
}

// Hook into Submit Button
// Using ID for selector safety
document.getElementById('submit-btn').addEventListener('click', () => {
    const text = textInput.value;
    if (!text) { alert('Por favor, descreva sua manifestação.'); return; }

    // Enforce redaction if sensitive
    const isSensitive = privacyStatus.textContent === 'Sigiloso';
    const finalText = (isSensitive && latestRedactedText) ? latestRedactedText : text;

    const submission = {
        id: Date.now().toString().slice(-6),
        date: new Date().toLocaleString('pt-BR'),
        text: finalText,
        type: 'Texto', // Default, could simplify
        category: aiCategory.textContent === 'Detectando...' ? 'Geral' : aiCategory.textContent,
        privacy: privacyStatus.textContent
    };
    saveSubmission(submission);
});

// Redacted View Listeners
if (viewRedactedBtn) {
    viewRedactedBtn.addEventListener('click', () => {
        redactedContent.textContent = latestRedactedText || "Nenhum texto para visualizar.";
        redactedModal.classList.remove('hidden');
    });

    closeRedactedBtn.addEventListener('click', () => {
        redactedModal.classList.add('hidden');
    });
}

// PII Detection Logic
async function detectAndRedactPII(text) {
    if (!text) return { hasPII: false, reactedText: text };

    let hasPII = false;
    let curatedText = text;

    // 1. Real AI Check (if Key exists)
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey) {
        const prompt = `Analise o texto abaixo procurando por dados pessoais (CPF, RG, Email, Telefone, Endereço completo). Substitua APENAS os dados pessoais por [DADO PESSOAL]. Mantenha o resto do texto inalterado. Texto: "${text}"`;
        const result = await callGemini(prompt);

        if (result && result.includes('[DADO PESSOAL]')) {
            hasPII = true;
            curatedText = result;
        }
    } else {
        // 2. Mock Regex Check (Simulation)
        const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g;

        if (cpfRegex.test(curatedText)) {
            hasPII = true;
            curatedText = curatedText.replace(cpfRegex, '[CPF]');
        }
        if (emailRegex.test(curatedText)) { hasPII = true; curatedText = curatedText.replace(emailRegex, '[EMAIL]'); }
        if (phoneRegex.test(curatedText)) { hasPII = true; curatedText = curatedText.replace(phoneRegex, '[TEL]'); }
    }

    latestRedactedText = curatedText;
    return { hasPII, curatedText };
}

function updatePrivacyUI(isSensitive, statusLabel) {
    privacyPill.classList.remove('hidden');

    if (isSensitive) {
        privacyPill.style.background = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
        privacyPill.style.borderColor = '#f5c6cb';
        privacyPill.style.color = '#721c24';
        privacyStatus.textContent = statusLabel || "Sigiloso";
        piiWarning.classList.remove('hidden');
        if (viewRedactedBtn) viewRedactedBtn.classList.remove('hidden');
    } else {
        privacyPill.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
        privacyPill.style.borderColor = '#c3e6cb';
        privacyPill.style.color = '#155724';
        privacyStatus.textContent = statusLabel || "Público";
        piiWarning.classList.add('hidden');
        if (viewRedactedBtn) viewRedactedBtn.classList.add('hidden');
    }
}

// Global PII Check Debounce
let debounceTimer; // Fix: Declare debounceTimer
let piiDebounceTimer;
textInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    clearTimeout(piiDebounceTimer);

    // Categorize
    debounceTimer = setTimeout(() => categorize(e.target.value), 1000);

    // PII Check
    piiDebounceTimer = setTimeout(async () => {
        const { hasPII } = await detectAndRedactPII(e.target.value);
        updatePrivacyUI(hasPII);
    }, 800);
});

// Audio Elements
// ... (rest of the file)
const recordBtn = document.getElementById('record-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const audioStatus = document.getElementById('audio-status');
const liveTranscriptionBox = document.getElementById('live-transcription');

// Video Elements
const videoSection = document.getElementById('video-section');
const videoPreview = document.getElementById('video-preview');
const videoPlayback = document.getElementById('video-playback');
const startCameraBtn = document.getElementById('start-camera-btn');
const recordVideoBtn = document.getElementById('record-video-btn');
const stopVideoBtn = document.getElementById('stop-video-btn');
const videoStatus = document.getElementById('video-status');

// Visualizer Elements
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

const reviewSection = document.getElementById('review-section');
const aiSummaryText = document.getElementById('ai-summary-text');
const confirmSummaryBtn = document.getElementById('confirm-summary-btn');
const retryAudioBtn = document.getElementById('retry-audio-btn');

let recognition;
let finalTranscript = '';
let isPaused = false;

// Web Audio API State
let audioContext;
let analyser;
let dataArray;
let source;
let animationId;
let mediaStream;

// Initialize Categories
let categoriesData = {};
async function loadCategories() {
    try {
        const res = await fetch('js/categories.json');
        categoriesData = await res.json();
    } catch (e) { console.error('Error loading categories', e); }
}
loadCategories();

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;

        // Reset visibility
        document.getElementById('text-section').classList.add('hidden');
        document.getElementById('audio-section').classList.add('hidden');
        document.getElementById('video-section').classList.add('hidden');

        if (type === 'text') {
            document.getElementById('text-section').classList.remove('hidden');
        } else if (type === 'audio') {
            document.getElementById('audio-section').classList.remove('hidden');
        } else if (type === 'video') {
            document.getElementById('video-section').classList.remove('hidden');
        }
    });
});

// Categorization Logic
async function categorize(text) {
    if (!text) return;

    if (aiCategory) aiCategory.textContent = "Analisando privacidade...";
    if (aiFeedback) aiFeedback.classList.remove('hidden');

    try {
        // Get enabled PII types from user preferences
        const enabledPIITypes = getEnabledPIITypes();

        const response = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                enabled_pii_types: enabledPIITypes.length > 0 ? enabledPIITypes : null
            })
        });

        if (response.ok) {
            const result = await response.json();
            // result = { is_sensitive, privacy_status, reason, detected_pii }

            // Update Privacy UI
            updatePrivacyUI(result.is_sensitive, result.privacy_status);

            // Show Reason/PII in the "Category" pill area for now (repurposing UI)
            if (result.is_sensitive) {
                aiCategory.textContent = `⚠️ Identificado: ${result.detected_pii.join(', ') || 'Dados Pessoais'}`;
                aiCategory.style.background = "#f8d7da";
                aiCategory.style.color = "#721c24";
            } else {
                aiCategory.textContent = "✅ Pronto para Transparência";
                aiCategory.style.background = "#d4edda";
                aiCategory.style.color = "#155724";
            }

            // Allow user to see the reason on hover or separate element?
            // For hackathon, reusing the pill is fine.
        }
    } catch (e) {
        console.error("API Error:", e);
        aiCategory.textContent = "Erro na análise";
    }
}


// Debounce input handled above in the combined listener
// let debounceTimer;
// textInput.addEventListener('input', (e) => { ... });

// --- Speech Recognition & Visualization Logic ---

async function startRecording() {
    try {
        // 1. Get User Media for Visualization
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setupVisualizer(mediaStream);

        // 2. Start Speech Recognition
        if (recognition) {
            finalTranscript = '';
            isPaused = false;
            recognition.start();
            reviewSection.classList.add('hidden');

            // UI Updates
            audioStatus.innerHTML = '<span style="color: #dc3545;">●</span> Gravando...';
            recordBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            liveTranscriptionBox.innerHTML = '<span class="placeholder-text">Ouvindo...</span>';
        }
    } catch (err) {
        console.error("Error accessing microphone:", err);
        audioStatus.textContent = "Erro ao acessar microfone.";
    }
}

function setupVisualizer(stream) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    drawVisualizer();
}

function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = '#f0f4f8'; // Match bg
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color based on height/volume
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 100)`;
        // Or specific brand color:
        // canvasCtx.fillStyle = '#0056b3';

        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

function stopVisualizer() {
    if (animationId) cancelAnimationFrame(animationId);
    if (source) source.disconnect();
    // if (audioContext) audioContext.close(); // Don't close if we want to reuse

    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Stop stream tracks
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
}


if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onend = () => {
        if (!isPaused && recordBtn.disabled) {
            // Only if it wasn't manual stop/pause, restart? 
            // Or if stopped naturally.
            // Actually, we usually want to stop everything if recognition ends abruptly.
            // But let's assume manual stop handles UI.
        }
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
                currentFinal += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        liveTranscriptionBox.innerHTML = `
            <span style="color: #333;">${finalTranscript}</span>
            <span style="color: #666; font-style: italic;">${interimTranscript}</span>
        `;
        liveTranscriptionBox.scrollTop = liveTranscriptionBox.scrollHeight;
    };

    // Button Actions
    recordBtn.addEventListener('click', startRecording);

    pauseBtn.addEventListener('click', () => {
        if (!isPaused) {
            recognition.stop();
            isPaused = true;
            audioStatus.textContent = "⏸️ Pausado";
            pauseBtn.innerHTML = "▶️ Retomar";
            recordBtn.disabled = true;
            if (animationId) cancelAnimationFrame(animationId); // Pause viz
        } else {
            recognition.start();
            isPaused = false;
            audioStatus.innerHTML = '<span style="color: #dc3545;">●</span> Gravando...';
            pauseBtn.innerHTML = "⏸️ Pausar";
            drawVisualizer(); // Resume viz
        }
    });

    stopBtn.addEventListener('click', () => {
        recognition.stop();
        isPaused = false;
        pauseBtn.innerHTML = "⏸️ Pausar";
        stopVisualizer();
        finishRecording();
    });

} else {
    audioStatus.textContent = "Seu navegador não suporta reconhecimento de fala.";
}

// Finish Recording & Show Summary
function finishRecording() {
    audioStatus.textContent = "Processando...";
    recordBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;

    setTimeout(() => {
        const summary = finalTranscript.trim();
        if (summary) {
            aiSummaryText.value = summary; // Use value for textarea
            reviewSection.classList.remove('hidden');
            categorize(summary);
            // Move to review section visual
            reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            audioStatus.textContent = "Nenhum áudio detectado.";
        }
    }, 500);
}

// Confirmation Flow
confirmSummaryBtn.addEventListener('click', () => {
    const pendingText = aiSummaryText.value;

    // Switch to Text Tab
    document.querySelector('.tab-btn[data-type="text"]').click();

    if (textInput.value.length > 0) {
        textInput.value += "\n\n" + pendingText;
    } else {
        textInput.value = pendingText;
    }

    reviewSection.classList.add('hidden');
    categorize(textInput.value);

    // Highlight effect on text area
    textInput.focus();
    textInput.style.background = "#e6fffa";
    setTimeout(() => textInput.style.background = "transparent", 1000);
});

retryAudioBtn.addEventListener('click', () => {
    reviewSection.classList.add('hidden');
    finalTranscript = '';
    liveTranscriptionBox.innerHTML = '<span class="placeholder-text">Fala aparecerá aqui...</span>';
    audioStatus.textContent = "Pronto para gravar";
    // Scroll back up?
});

// --- AI Text Improvement Agent ---
// --- Settings & OpenAI Logic ---
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiKeyInput = document.getElementById('api-key-input');
const settingsStatus = document.getElementById('settings-status');

// Load saved key
const savedKey = localStorage.getItem('gemini_api_key');
if (savedKey) apiKeyInput.value = savedKey;

settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    settingsStatus.textContent = '';
});

saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key.length > 20) { // Simple validation
        localStorage.setItem('gemini_api_key', key);
        settingsStatus.textContent = "✅ Chave salva com sucesso!";
        settingsStatus.style.color = "green";
    } else {
        localStorage.removeItem('gemini_api_key'); // Clear if empty/invalid
        settingsStatus.textContent = "⚠️ Chave removida ou inválida. Usando modo simulação.";
        settingsStatus.style.color = "#dc3545";
    }

    // Save PII Filter Preferences
    const piiFilters = {};
    document.querySelectorAll('.pii-filter').forEach(checkbox => {
        piiFilters[checkbox.dataset.piiType] = checkbox.checked;
    });
    localStorage.setItem('pii_filters', JSON.stringify(piiFilters));

    settingsStatus.textContent += " Filtros de privacidade salvos!";
    setTimeout(() => settingsModal.classList.add('hidden'), 1500);
});

// Load PII Filter Preferences
function loadPIIFilters() {
    const savedFilters = localStorage.getItem('pii_filters');
    if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        document.querySelectorAll('.pii-filter').forEach(checkbox => {
            const type = checkbox.dataset.piiType;
            if (filters.hasOwnProperty(type)) {
                checkbox.checked = filters[type];
            }
        });
    }
}

// Call on page load
loadPIIFilters();

// Select All PII Filters
document.getElementById('select-all-pii')?.addEventListener('click', () => {
    document.querySelectorAll('.pii-filter').forEach(checkbox => {
        checkbox.checked = true;
    });
});

// Deselect All PII Filters
document.getElementById('deselect-all-pii')?.addEventListener('click', () => {
    document.querySelectorAll('.pii-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
});

// Helper function to get enabled PII types
function getEnabledPIITypes() {
    const enabled = [];
    document.querySelectorAll('.pii-filter:checked').forEach(checkbox => {
        enabled.push(checkbox.dataset.piiType);
    });
    return enabled;
}


// Real AI Function
// Real AI Function (Gemini)
async function callGemini(prompt) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return null; // Fallback to mock

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        // Extract text from Gemini response
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }
        return null;

    } catch (error) {
        console.error("Gemini API Error:", error);
        alert("Erro na API do Gemini: " + error.message);
        return null;
    }
}

// Updated Improve Text Logic
improveTextBtn.addEventListener('click', async () => {
    const originalText = textInput.value;
    if (!originalText || originalText.trim().length < 5) {
        alert("Por favor, digite um texto mais longo para que a IA possa melhorar.");
        return;
    }

    const originalLabel = improveTextBtn.innerHTML;
    improveTextBtn.innerHTML = "✨ Melhorando...";
    improveTextBtn.disabled = true;

    try {
        // Try Real AI First
        const apiKey = localStorage.getItem('gemini_api_key');
        let improved = null;

        if (apiKey) {
            const prompt = `Melhore o seguinte texto para um registro formal de ouvidoria, corrigindo gramática e deixando mais polido, mas mantendo a essência: "${originalText}"`;
            improved = await callGemini(prompt);
        }

        // Fallback to Mock if no key or error
        if (!improved) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Mock Delay
            improved = originalText;
            improved = improved.replace(/\bvc\b/gi, "você");
            improved = improved.replace(/\bq\b/gi, "que");
            improved = improved.replace(/\btb\b/gi, "também");
            improved = improved.replace(/\btava\b/gi, "estava");
            improved = improved.replace(/\bpra\b/gi, "para");
            improved = improved.replace(/\bta\b/gi, "está");
            improved = improved.replace(/\bnao\b/gi, "não");

            improved = improved.charAt(0).toUpperCase() + improved.slice(1);
            if (!improved.endsWith('.')) improved += '.';

            if (!improved.toLowerCase().startsWith("gostaria") && !improved.toLowerCase().startsWith("solicito") && !improved.toLowerCase().startsWith("venho")) {
                improved = "Venho por meio deste informar que " + improved.toLowerCase();
            }
        }

        textInput.value = improved;
        categorize(improved); // Re-categorize based on new text

    } catch (error) {
        console.error("AI Error:", error);
        alert("Erro ao processar texto.");
    } finally {
        improveTextBtn.innerHTML = originalLabel;
        improveTextBtn.disabled = false;
    }
});

// --- Dashboard Logic ---
const dashboardBtn = document.getElementById('dashboard-btn');
const dashboardModal = document.getElementById('dashboard-modal');
const closeDashboardBtn = document.getElementById('close-dashboard-btn');
const seedDataBtn = document.getElementById('seed-data-btn');

let privacyChart = null;
let categoryChart = null;

function renderDashboard() {
    // 1. Prepare Data
    const privacyCounts = { 'Público': 0, 'Sigiloso': 0 };
    const categoryCounts = {};

    db.forEach(item => {
        // Privacy
        const p = item.privacy || 'Público';
        privacyCounts[p] = (privacyCounts[p] || 0) + 1;

        // Category (Split > to get main)
        const c = item.category ? item.category.split('>')[0].trim() : 'Geral';
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });

    // 2. Render Privacy Chart
    const ctxP = document.getElementById('privacy-chart').getContext('2d');
    if (privacyChart) privacyChart.destroy();

    privacyChart = new Chart(ctxP, {
        type: 'pie',
        data: {
            labels: Object.keys(privacyCounts),
            datasets: [{
                data: Object.values(privacyCounts),
                backgroundColor: ['#28a745', '#dc3545'], // Green, Red
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // 3. Render Category Chart
    const ctxC = document.getElementById('category-chart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctxC, {
        type: 'bar',
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
                label: 'Demandas',
                data: Object.values(categoryCounts),
                backgroundColor: 'rgba(0, 51, 102, 0.7)', // GDF Blue
                borderColor: 'rgba(0, 51, 102, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            plugins: { legend: { display: false } }
        }
    });
}

function seedDatabase() {
    if (!confirm("Isso importará uma amostra de 100 registros do Repositório e-SIC. Continuar?")) return;

    db = [];

    // Realistic e-SIC samples
    const samples = [
        { text: "Solicito informações sobre o cronograma de obras da VP 03 no Guará.", cat: "Solicitação > Obras", priv: "Público" },
        { text: "Buraco perigoso na via principal de Taguatinga Norte, próximo ao mercado.", cat: "Solicitação > Tapa-buraco", priv: "Público" },
        { text: "Gostaria de denunciar um servidor que está utilizando o carro oficial para fins pessoais na placa JJJ-9999.", cat: "Denúncia > Servidor", priv: "Sigiloso" },
        { text: "Falta de médicos pediatras na UPA de Ceilândia durante o plantão noturno.", cat: "Reclamação > Saúde", priv: "Público" },
        { text: "A iluminação pública da quadra 302 do Sudoeste está apagada há 5 dias.", cat: "Solicitação > Iluminação", priv: "Público" },
        { text: "Gostaria de elogiar o atendimento recebido no Na Hora da Rodoviária.", cat: "Elogio > Atendimento", priv: "Público" },
        { text: "Solicito dados sobre os gastos com publicidade do governo no ano de 2024.", cat: "Acesso à Informação > Gastos", priv: "Público" },
        { text: "Denúncia anônima sobre descarte de entulho em área de proteção ambiental no Lago Norte.", cat: "Denúncia > Ambiental", priv: "Sigiloso" },
        { text: "Minha mãe idosa não consegue agendar consulta com cardiologista pelo sistema.", cat: "Reclamação > Saúde", priv: "Sigiloso" },
        { text: "Sugestão para criação de ciclofaixas na W3 Sul.", cat: "Sugestão > Mobilidade", priv: "Público" },
        { text: "O parquinho da SQN 105 está com brinquedos quebrados oferecendo risco.", cat: "Solicitação > Zeladoria", priv: "Público" },
        { text: "Gostaria de saber o status do meu processo SEI 123456789.", cat: "Solicitação > Processo", priv: "Sigiloso" }
    ];

    for (let i = 0; i < 100; i++) {
        const sample = samples[Math.floor(Math.random() * samples.length)];
        const isVariation = Math.random() > 0.5;

        // Add random variations to text to seem organic
        let finalText = sample.text;
        if (isVariation) finalText += ` (Protocolo Ref: ${Math.floor(Math.random() * 9999)})`;

        db.push({
            id: (20250000 + i).toString(),
            date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toLocaleString('pt-BR'), // Random date last 30 days
            text: finalText,
            type: 'Texto',
            category: sample.cat,
            privacy: sample.priv
        });
    }

    localStorage.setItem('participa_df_db', JSON.stringify(db));
    renderDashboard();
    renderSubmissions();
    alert("Importação da Amostra e-SIC concluída com sucesso! (100 registros processados)");
}

// Dashboard Events
if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
        renderDashboard();
        dashboardModal.classList.remove('hidden');
    });

    closeDashboardBtn.addEventListener('click', () => {
        dashboardModal.classList.add('hidden');
    });

    seedDataBtn.addEventListener('click', seedDatabase);
}

if (startCameraBtn) {
    startCameraBtn.addEventListener('click', async () => {
        try {
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoPreview.srcObject = videoStream;
            videoPreview.style.display = 'block';
            videoPlayback.style.display = 'none'; // Hide playback if restarting

            startCameraBtn.disabled = true;
            recordVideoBtn.disabled = false;
            videoStatus.innerHTML = '<span style="color: #28a745;">●</span> Câmera ativa';
        } catch (err) {
            console.error("Camera Error:", err);
            videoStatus.textContent = "Erro ao acessar câmera.";
        }
    });

    recordVideoBtn.addEventListener('click', () => {
        videoChunks = [];
        try {
            mediaRecorder = new MediaRecorder(videoStream);
        } catch (e) {
            console.error("MediaRecorder Error:", e);
            videoStatus.textContent = "Erro no MediaRecorder.";
            return;
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(videoChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(blob);
            videoPlayback.src = videoURL;

            // Switch to playback view
            videoPreview.style.display = 'none';
            videoPlayback.style.display = 'block';

            videoStatus.textContent = "Gravação finalizada.";

            // Stop all tracks to release camera
            videoStream.getTracks().forEach(track => track.stop());
            startCameraBtn.disabled = false;
            recordVideoBtn.disabled = true;
            stopVideoBtn.disabled = true;
        };

        mediaRecorder.start();
        recordVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
        videoStatus.innerHTML = '<span style="color: #dc3545;">●</span> Gravando vídeo...';
    });

    stopVideoBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    });
}
