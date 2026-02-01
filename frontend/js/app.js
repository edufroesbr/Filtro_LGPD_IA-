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
// Button elements
const submitBtn = document.getElementById('submit-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiKeyInput = document.getElementById('api-key-input');

let latestRedactedText = "";
let lastClassificationResult = null; // Store last server classification result

// --- Database Logic (Server-Side Only) ---
async function saveSubmission(data) {
    // 1. Send to server for permanent CSV logging
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao salvar no servidor');

        const result = await response.json();
        // Use server-returned ID or original
        const finalId = result.id || data.id;

        // Success UI
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '✅ Enviado com sucesso!';
        submitBtn.style.background = '#28a745';
        submitBtn.disabled = true;

        // Show confirmation modal with server UUID (first 8 chars for readability)
        // Show confirmation modal with server UUID (first 8 chars for readability)
        const displayId = finalId.length > 8 ? finalId.substring(0, 8) : finalId;

        let privacyMessageHTML = '';
        if (data.privacy === 'Sigiloso') {
            privacyMessageHTML = `
                <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.95rem; text-align: left; border: 1px solid #ffeeba;">
                    <strong>⚠️ Atenção:</strong><br>
                    Como sua manifestação possui dados sensíveis, ela foi classificada como <strong>Sigiloso</strong> para proteção da sua identidade.
                </div>
            `;
        } else {
            privacyMessageHTML = `
                <p style="color: #666; margin-bottom: 25px;">Status de privacidade: <strong style="color: #28a745;">${data.privacy}</strong></p>
            `;
        }

        const confirmationHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px);">
                <div style="background: white; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #28a745; margin-bottom: 15px;">Manifestação Enviada!</h2>
                    <p style="color: #666; margin-bottom: 10px; font-size: 1.1rem;">Seu protocolo é:</p>
                    <p style="font-size: 2rem; font-weight: bold; color: #003366; margin-bottom: 20px;">#${displayId}</p>
                    ${privacyMessageHTML}
                    <button onclick="this.closest('div').parentElement.remove(); location.reload();" style="background: #003366; color: white; border: none; padding: 15px 40px; border-radius: 50px; font-size: 1.1rem; font-weight: bold; cursor: pointer;">OK, Entendi</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);

        // Reset form after a delay is handled by location.reload() above, 
        // but let's keep it safe if user doesn't reload
        setTimeout(() => {
            if (document.getElementById('submit-btn')) {
                document.getElementById('submit-btn').textContent = originalText;
                document.getElementById('submit-btn').style.background = '';
                document.getElementById('submit-btn').disabled = false;
            }
        }, 3000);

    } catch (e) {
        console.error('Submission error:', e);
        alert('❌ Ocorreu um erro ao enviar sua manifestação para o servidor: ' + e.message);
    }
}

async function renderSubmissions() {
    submissionsList.innerHTML = '<p style="text-align: center; color: #888; margin-top: 50px;">Carregando...</p>';

    try {
        // Fetch from server API (unified data source - CSV only)
        const response = await fetch('/api/submissions');
        if (!response.ok) throw new Error('Falha ao buscar manifestações');

        const data = await response.json();
        const submissions = data.submissions || [];

        submissionsList.innerHTML = '';

        if (submissions.length === 0) {
            submissionsList.innerHTML = '<p style="text-align: center; color: #888; margin-top: 50px;">Nenhuma manifestação registrada ainda.</p>';
            return;
        }

        // Render server data (from CSV)
        submissions.forEach(item => {
            const div = document.createElement('div');
            div.className = 'submission-item';

            const privacyClass = item.privacy === 'Sigiloso' ? 'badge-sensitive' : 'badge-public';

            div.innerHTML = `
                <div class="submission-header">
                    <span class="submission-protocol">#${item.id}</span>
                    <span class="submission-date">${item.date}</span>
                </div>
                <div class="submission-badges">
                    <span class="submission-badge badge-type">${item.type}</span>
                    <span class="submission-badge ${privacyClass}">${item.privacy}</span>
                    <span class="submission-badge badge-category">${item.category}</span>
                </div>
                <div class="submission-body">${item.text}</div>
            `;
            submissionsList.appendChild(div);
        });

    } catch (error) {
        console.error('Error fetching submissions:', error);
        submissionsList.innerHTML = '<p style="text-align: center; color: #dc3545; margin-top: 50px;">⚠️ Erro ao carregar manifestações do servidor. Verifique se o backend está rodando.</p>';
    }
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
        alert('⚠️ Esta funcionalidade requer acesso administrativo ao servidor para limpar o arquivo CSV.');
    });
}

// Dashboard Button logic is now handled by direct link in index.html

// Settings Modal Logic
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        // Load latest key from storage
        const key = localStorage.getItem('gemini_api_key');
        if (key && apiKeyInput) apiKeyInput.value = key;
        loadPIIFilters();
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        const newKey = apiKeyInput.value.trim();
        localStorage.setItem('gemini_api_key', newKey);

        // Save PII Preferences
        const filters = {};
        document.querySelectorAll('.pii-filter').forEach(checkbox => {
            filters[checkbox.dataset.piiType] = checkbox.checked;
        });
        localStorage.setItem('pii_filters', JSON.stringify(filters));

        settingsModal.classList.add('hidden');
        alert('Configurações salvas localmente!');
    });
}
// Hook into Submit Button
// Using ID for selector safety
document.getElementById('submit-btn').addEventListener('click', async () => {
    const text = textInput.value;
    if (!text) { alert('Por favor, descreva sua manifestação.'); return; }

    // Check if classification is complete or failed
    let submissionResult = lastClassificationResult;

    if (!submissionResult) {
        // Fallback flow: Allow user to bypass the wait if it's stuck or failed
        const proceed = confirm('⏳ A análise de privacidade ainda não foi concluída ou falhou.\n\nDeseja enviar assim mesmo? (Será classificado como "Geral/Público" até revisão posterior)');
        if (!proceed) return;

        // Create a default fallback result
        submissionResult = {
            id: 'manual-' + Date.now(),
            is_sensitive: false,
            privacy_status: 'Público',
            reason: 'Envio forçado pelo usuário (Análise incompleta)',
            category: 'Geral',
            detected_pii: []
        };
    }

    // Use the server classification result (or fallback)
    // Use the server classification result (or fallback)
    // CRITICAL: Re-check local PII to ensure we don't send "Público" if local regex caught something
    const localCheck = checkLocalPII(text);
    const isActuallySensitive = (submissionResult && submissionResult.is_sensitive) || localCheck.hasPII;
    const finalPrivacyStatus = isActuallySensitive ? 'Sigiloso' : 'Público';

    const submission = {
        id: submissionResult.id || 'unknown',
        text: text,
        type: 'Texto',
        category: (submissionResult && submissionResult.category)
            ? submissionResult.category
            : (isActuallySensitive ? "Dados Pessoais" : "Público"), // Fallback to Macro Categories
        privacy: finalPrivacyStatus,
        reason: submissionResult.reason || (localCheck.hasPII ? "Detectado Localmente" : "")
    };

    await saveSubmission(submission);
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

// Helper to check PII synchronously (Logic Only)
function checkLocalPII(text) {
    if (!text) return { hasPII: false, detected: [] };

    let hasPII = false;
    let detected = [];

    // Always Run Regex
    const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}[\s-]?\d{4}/g;
    // Enhanced DF Address Regex (Supports QNN, QNM, QSA, Setor, etc.)
    const addressRegex = /\b(?:S[A-Z]{2,4}|Q[A-Z]{1,3}|QI|QL|CA|SMPW|SMDB|Park Way|Arniqueiras|Setor|Área|AE|Quadra|Q\.|Rua|Av\.|Avenida|Alameda|Travessa|Lote|Conjunto|Cj\.)\s+[A-Za-z0-9\s,.-]+|Bloco\s+[A-Z0-9]/i;

    if (cpfRegex.test(text)) { hasPII = true; detected.push('CPF'); }
    if (emailRegex.test(text)) { hasPII = true; detected.push('Email'); }
    if (phoneRegex.test(text)) { hasPII = true; detected.push('Telefone'); }
    if (addressRegex.test(text)) { hasPII = true; detected.push('Endereço'); }

    return { hasPII, detected };
}

// PII Detection Logic (UI Wrapper)
async function detectAndRedactPII(text) {
    if (!text) return { hasPII: false, curatedText: text };

    let { hasPII, detected } = checkLocalPII(text);
    let curatedText = text;

    // Apply Redaction locally for visualization
    const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}[\s-]?\d{4}/g;

    if (hasPII) {
        curatedText = curatedText.replace(cpfRegex, '[CPF]')
            .replace(emailRegex, '[EMAIL]')
            .replace(phoneRegex, '[TEL]');
    }

    // 1. Real AI Check (if Key exists)
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey) {
        const prompt = `Analise o texto abaixo procurando por dados pessoais (CPF, RG, Email, Telefone, Endereço completo). Substitua APENAS os dados pessoais por [DADO PESSOAL]. Mantenha o resto do texto inalterado. Texto: "${text}"`;
        const result = await callGemini(prompt);

        if (result && result.includes('[DADO PESSOAL]')) {
            hasPII = true;
            curatedText = result; // Use AI's smarter redaction
        }
    }

    latestRedactedText = curatedText;
    return { hasPIi: hasPII, curatedText };
}

// Consolidated UI Update
function updatePrivacyUI(isSensitive, statusLabel) {
    if (!aiCategory) return;

    // Privacy Pill (The result badge) - Always show result
    if (privacyPill) {
        privacyPill.classList.remove('hidden');

        if (isSensitive) {
            // SENSITIVE -> Red, Padlock
            privacyPill.style.background = "#f8d7da";
            privacyPill.style.color = "#721c24";
            privacyPill.style.borderColor = "#f5c6cb";
            privacyPill.innerHTML = `<span style="font-size: 1.2rem;">🔒</span> <span id="privacy-status">Sigiloso</span>`;

            // Robot (aiFeedback) -> SHOW logic
            if (aiFeedback) {
                aiFeedback.classList.remove('hidden');
                // You can update the text inside the robot pill if desired, or leave as is
                // For now, let's make the robot say "Opa!" or "Atenção"
                if (aiCategory) aiCategory.textContent = "Atenção!";
            }

            if (piiWarning) piiWarning.classList.remove('hidden');
            if (viewRedactedBtn) viewRedactedBtn.classList.remove('hidden');

        } else {
            // PUBLIC -> Green, Shield
            privacyPill.style.background = "#d4edda";
            privacyPill.style.color = "#155724";
            privacyPill.style.borderColor = "#c3e6cb";
            privacyPill.innerHTML = `<span style="font-size: 1.2rem;">🛡️</span> <span id="privacy-status">Público</span>`;

            // Robot (aiFeedback) -> HIDE logic
            if (aiFeedback) {
                aiFeedback.classList.add('hidden');
            }

            if (piiWarning) piiWarning.classList.add('hidden');
            if (viewRedactedBtn) viewRedactedBtn.classList.add('hidden');
        }
    }
}

// Global PII Check Debounce
let debounceTimer; // Fix: Declare debounceTimer
let piiDebounceTimer;
let localPIIDetected = false;
textInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    clearTimeout(piiDebounceTimer);

    // Categorize
    debounceTimer = setTimeout(() => categorize(e.target.value), 1000);

    // PII Check
    piiDebounceTimer = setTimeout(async () => {
        const { hasPII } = await detectAndRedactPII(e.target.value);
        localPIIDetected = hasPII;
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

    // 1. Synchronous Local Check (Safety First - Immediate)
    const localCheck = checkLocalPII(text);
    // const localIsSensitive = localCheck.hasPII; // unused

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
            // result = { id, is_sensitive, privacy_status, reason, detected_detected_pii }

            // Store result globally for submit button to use
            lastClassificationResult = result;

            // Merge server result with local detection (Safety First)
            // We RE-RUN local check here to be 100% sure we are using the current text state
            // and not relying on any async race condition vars
            const { hasPII: localHasPII, detected: localDetected } = checkLocalPII(text);

            const finalIsSensitive = result.is_sensitive || localHasPII;
            const finalStatus = finalIsSensitive ? (result.is_sensitive ? result.privacy_status : "Sigiloso") : "Público";

            // Update Privacy UI (Consolidated function)
            updatePrivacyUI(finalIsSensitive, finalStatus);
        }
    } catch (e) {
        console.error("API Error:", e);
        aiCategory.textContent = "Erro na análise";
        lastClassificationResult = null;
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


// Load saved key
const savedKey = localStorage.getItem('gemini_api_key');
if (savedKey && apiKeyInput) apiKeyInput.value = savedKey;



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

// --- Dashboard Logic handled by /admin dedicated page ---

async function seedDatabase() {
    if (!confirm("Isso carregará registros reais da amostra e-SIC para o servidor (Simulação de 20 casos). Continuar?")) return;

    seedDataBtn.disabled = true;
    seedDataBtn.textContent = "Simulando...";

    try {
        // Load real simulation data
        const simResponse = await fetch('js/simulation_data.json');
        if (!simResponse.ok) throw new Error('Falha ao carregar amostras');
        const simulationData = await simResponse.json();

        let count = 0;
        const totalToSubmit = 20;

        for (let i = 0; i < totalToSubmit; i++) {
            // Pick a random sample from the 400+ samples
            const sample = simulationData[Math.floor(Math.random() * simulationData.length)];

            // 1. Classify
            const classResponse = await fetch('/api/classify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: sample.text })
            });

            if (!classResponse.ok) continue;
            const classResult = await classResponse.json();

            // 2. Submit
            await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: classResult.id,
                    text: sample.text,
                    category: classResult.category || "Geral",
                    privacy: classResult.privacy_status || "Público",
                    reason: classResult.reason || ""
                })
            });

            count++;
            seedDataBtn.textContent = `Enviando (${count}/${totalToSubmit})...`;
        }

        alert(`Simulação concluída! ${count} registros da amostra e-SIC foram enviados com sucesso.`);
    } catch (e) {
        console.error("Seed Error:", e);
        alert("Erro na simulação: " + e.message);
    } finally {
        seedDataBtn.disabled = false;
        seedDataBtn.textContent = "⚡ Simular Dados (e-SIC)";
        renderDashboard(); // Refresh
        if (typeof updateDashboardBadge === 'function') updateDashboardBadge();
    }
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
