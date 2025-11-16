// State management
let currentMode = 'upload'; // 'upload' or 'webcam'
let selectedImage = null;
let webcamStream = null;

// DOM Elements
const uploadModeBtn = document.getElementById('uploadModeBtn');
const webcamModeBtn = document.getElementById('webcamModeBtn');
const uploadMode = document.getElementById('uploadMode');
const webcamMode = document.getElementById('webcamMode');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const uploadedImage = document.getElementById('uploadedImage');
const removeUpload = document.getElementById('removeUpload');
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const startWebcam = document.getElementById('startWebcam');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const webcamPreview = document.getElementById('webcamPreview');
const capturedImage = document.getElementById('capturedImage');
const occasionInput = document.getElementById('occasionInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const micBtn = document.getElementById('micBtn');
const speechStatus = document.getElementById('speechStatus');

// Mode switching
uploadModeBtn.addEventListener('click', () => switchMode('upload'));
webcamModeBtn.addEventListener('click', () => switchMode('webcam'));

function switchMode(mode) {
    currentMode = mode;

    if (mode === 'upload') {
        uploadModeBtn.classList.add('active');
        webcamModeBtn.classList.remove('active');
        uploadMode.classList.add('active');
        webcamMode.classList.remove('active');
        stopWebcam();
    } else {
        webcamModeBtn.classList.add('active');
        uploadModeBtn.classList.remove('active');
        webcamMode.classList.add('active');
        uploadMode.classList.remove('active');
        selectedImage = null;
    }

    checkFormValidity();
}

// File Upload handling
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

function handleFileSelect(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file (JPG, PNG, or GIF)');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }

    selectedImage = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage.src = e.target.result;
        uploadArea.style.display = 'none';
        uploadPreview.classList.remove('hidden');
        checkFormValidity();
    };
    reader.readAsDataURL(file);
}

removeUpload.addEventListener('click', () => {
    selectedImage = null;
    fileInput.value = '';
    uploadedImage.src = '';
    uploadPreview.classList.add('hidden');
    uploadArea.style.display = 'block';
    checkFormValidity();
});

// Webcam handling
startWebcam.addEventListener('click', async () => {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        webcam.srcObject = webcamStream;
        webcam.style.display = 'block';
        startWebcam.classList.add('hidden');
        captureBtn.classList.remove('hidden');
    } catch (error) {
        showError('Could not access camera. Please check permissions.');
        console.error('Webcam error:', error);
    }
});

captureBtn.addEventListener('click', () => {
    // Set canvas dimensions to match video
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcam, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
        selectedImage = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });

        // Show preview
        capturedImage.src = canvas.toDataURL('image/jpeg');
        webcam.style.display = 'none';
        webcamPreview.classList.remove('hidden');
        captureBtn.classList.add('hidden');
        retakeBtn.classList.remove('hidden');

        stopWebcam();
        checkFormValidity();
    }, 'image/jpeg', 0.9);
});

retakeBtn.addEventListener('click', () => {
    selectedImage = null;
    capturedImage.src = '';
    webcamPreview.classList.add('hidden');
    webcam.style.display = 'block';
    retakeBtn.classList.add('hidden');
    startWebcam.click();
    checkFormValidity();
});

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        webcam.srcObject = null;
        webcam.style.display = 'none';
        captureBtn.classList.add('hidden');
        startWebcam.classList.remove('hidden');
    }
}

// Form validation
occasionInput.addEventListener('input', checkFormValidity);

function checkFormValidity() {
    const hasImage = selectedImage !== null;
    const hasOccasion = occasionInput.value.trim().length > 0;

    analyzeBtn.disabled = !(hasImage && hasOccasion);
}

// Analyze button
analyzeBtn.addEventListener('click', async () => {
    // Hide previous results/errors
    resultsSection.classList.add('hidden');
    errorState.classList.add('hidden');

    // Show loading state
    loadingState.classList.remove('hidden');
    analyzeBtn.disabled = true;

    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('occasion', occasionInput.value.trim());

        // Call API
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze image');
        }

        // Display results
        displayResults(data);

    } catch (error) {
        showError(error.message || 'Something went wrong. Please try again.');
        console.error('Analysis error:', error);
    } finally {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
});

// Display results
function displayResults(data) {
    // Occasion details
    const occasionDetails = document.getElementById('occasionDetails');
    occasionDetails.innerHTML = `
        <p><strong>Occasion:</strong> ${data.occasion || 'Not specified'}</p>
        <p><strong>Location:</strong> ${data.location || 'Not specified'}</p>
        <p><strong>Formality:</strong> ${data.formality || 'Not specified'}</p>
    `;

    // Wardrobe analysis
    const wardrobeAnalysis = document.getElementById('wardrobeAnalysis');
    if (data.clothingAnalysis) {
        const items = data.clothingAnalysis.items || [];
        wardrobeAnalysis.innerHTML = `
            <p><strong>Overall Style:</strong> ${data.clothingAnalysis.overallStyle || 'Not analyzed'}</p>
            <p><strong>Colors Found:</strong> ${data.clothingAnalysis.colorPalette?.join(', ') || 'Not analyzed'}</p>
            ${items.length > 0 ? `
                <details>
                    <summary>View detected items (${items.length})</summary>
                    <ul>
                        ${items.map(item => `
                            <li>${item.type} - ${item.color}</li>
                        `).join('')}
                    </ul>
                </details>
            ` : ''}
        `;
    } else {
        wardrobeAnalysis.innerHTML = '<p>No analysis available</p>';
    }

    // Recommendations
    const recommendations = document.getElementById('recommendations');
    if (data.recommendations && data.recommendations.length > 0) {
        recommendations.innerHTML = `
            <ul>
                ${data.recommendations.map((rec, idx) => `<li><strong>Outfit ${idx + 1}:</strong> ${rec}</li>`).join('')}
            </ul>
        `;
    } else if (data.analysis) {
        recommendations.innerHTML = `<p>${data.analysis}</p>`;
    } else {
        recommendations.innerHTML = '<p>No recommendations available</p>';
    }

    // Cultural tips
    const culturalTipsCard = document.getElementById('culturalTipsCard');
    const culturalTips = document.getElementById('culturalTips');
    if (data.culturalTips && data.culturalTips.length > 0) {
        culturalTips.innerHTML = `
            <ul>
                ${data.culturalTips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
        culturalTipsCard.style.display = 'block';
    } else {
        culturalTipsCard.style.display = 'none';
    }

    // Shopping suggestions
    const shoppingCard = document.getElementById('shoppingCard');
    const shoppingSuggestions = document.getElementById('shoppingSuggestions');
    if (data.shoppingSuggestions && data.shoppingSuggestions.length > 0) {
        shoppingSuggestions.innerHTML = `
            <ul>
                ${data.shoppingSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        `;
        shoppingCard.style.display = 'block';
    } else {
        shoppingCard.style.display = 'none';
    }

    // Show results section
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
    loadingState.classList.add('hidden');
}

retryBtn.addEventListener('click', () => {
    errorState.classList.add('hidden');
});

newAnalysisBtn.addEventListener('click', () => {
    // Reset form
    resultsSection.classList.add('hidden');
    selectedImage = null;
    occasionInput.value = '';
    fileInput.value = '';
    uploadedImage.src = '';
    capturedImage.src = '';
    uploadPreview.classList.add('hidden');
    webcamPreview.classList.add('hidden');
    uploadArea.style.display = 'block';
    checkFormValidity();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Speech Recognition
let recognition = null;
let isListening = false;

// Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        speechStatus.textContent = '🎤 Listening... Speak now!';
        speechStatus.classList.remove('hidden');
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        // Update textarea with transcribed text
        occasionInput.value = transcript;
        checkFormValidity();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        micBtn.classList.remove('listening');

        let errorMsg = 'Speech recognition error';
        switch(event.error) {
            case 'no-speech':
                errorMsg = '⚠️ No speech detected. Please try again.';
                break;
            case 'not-allowed':
                errorMsg = '⚠️ Microphone access denied. Please enable microphone permissions.';
                break;
            case 'network':
                errorMsg = '⚠️ Network error. Please check your connection.';
                break;
            default:
                errorMsg = `⚠️ ${event.error}`;
        }

        speechStatus.textContent = errorMsg;
        setTimeout(() => {
            speechStatus.classList.add('hidden');
        }, 3000);
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        speechStatus.textContent = '✓ Done! You can edit the text or speak again.';
        setTimeout(() => {
            speechStatus.classList.add('hidden');
        }, 3000);
    };

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                showError('Could not start speech recognition. Please try again.');
            }
        }
    });
} else {
    // Browser doesn't support speech recognition
    micBtn.style.display = 'none';
    console.warn('Speech recognition not supported in this browser');
}

// Initialize
checkFormValidity();
