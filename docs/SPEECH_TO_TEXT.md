# Speech-to-Text Feature Documentation

## Overview

The AI Attire application now includes **free, lightweight speech-to-text functionality** using the Web Speech API. Users can speak their occasion description instead of typing it.

## Features

- **Zero cost** - Uses browser's built-in Web Speech API
- **No additional APIs** - No OpenAI, Google, or other paid services required
- **Real-time transcription** - See your words appear as you speak
- **Multi-language support** - Currently configured for English (en-US), easily configurable
- **Visual feedback** - Animated microphone button shows listening state
- **Error handling** - Clear error messages for common issues

## Browser Support

### Supported Browsers
- ✅ **Google Chrome** (Desktop & Android)
- ✅ **Microsoft Edge** (Chromium-based)
- ✅ **Safari** (macOS & iOS - limited support)
- ✅ **Opera** (Chromium-based)

### Not Supported
- ❌ **Firefox** (no Web Speech API support)
- ❌ **Internet Explorer**

For unsupported browsers, the microphone button is automatically hidden.

## How It Works

### User Flow

1. User clicks the **🎤 microphone button** next to the occasion textarea
2. Browser requests microphone permission (first time only)
3. Microphone button turns **red and pulses** while listening
4. User speaks their occasion description
5. Text appears in real-time in the textarea
6. When done, user clicks the button again to stop, or wait for auto-stop
7. User can edit the transcribed text if needed

### Technical Implementation

**Location**: `public/app.js` (lines 344-429)

**Key Components**:

```javascript
// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
recognition = new SpeechRecognition();
recognition.continuous = false;      // Stop after one utterance
recognition.interimResults = true;   // Show results as user speaks
recognition.lang = 'en-US';          // Language setting
```

**Event Handlers**:
- `onstart`: Show listening state
- `onresult`: Update textarea with transcribed text
- `onerror`: Handle errors with user-friendly messages
- `onend`: Return to normal state

## File Changes

### 1. `public/index.html`
Added microphone button and speech status indicator:

```html
<div class="occasion-input-wrapper">
    <textarea id="occasionInput" ...></textarea>
    <button id="micBtn" class="mic-btn" type="button" title="Use voice input">
        🎤
    </button>
</div>
<p id="speechStatus" class="speech-status hidden"></p>
```

### 2. `public/app.js`
Added speech recognition logic (~85 lines):
- Feature detection for browser support
- Event handlers for speech recognition
- Error handling and user feedback
- Toggle listening state

### 3. `public/styles.css`
Added styles for:
- `.occasion-input-wrapper` - Flex layout for textarea + mic button
- `.mic-btn` - Microphone button styling
- `.mic-btn.listening` - Pulsing red animation when active
- `.speech-status` - Status message styling

## Usage Examples

### Example 1: Quick Occasion Input
**User says**: "Business meeting in Tokyo"
**Result**: Textarea populated with "business meeting in Tokyo"

### Example 2: Detailed Description
**User says**: "I'm going to a beach wedding in Thailand next month. It's a casual event but I want to look elegant. The weather will be hot and humid."
**Result**: Full text transcribed, ready to analyze

### Example 3: Multi-language (Configurable)
To change language, modify `app.js`:

```javascript
recognition.lang = 'es-ES';  // Spanish
recognition.lang = 'fr-FR';  // French
recognition.lang = 'ja-JP';  // Japanese
```

## Error Handling

The system provides clear error messages for common issues:

| Error | User Message | Solution |
|-------|-------------|----------|
| `no-speech` | "No speech detected. Please try again." | Speak louder or check microphone |
| `not-allowed` | "Microphone access denied. Please enable microphone permissions." | Grant browser microphone access |
| `network` | "Network error. Please check your connection." | Check internet connection |
| Other | Generic error message | Try again or type manually |

## Configuration Options

### Modify Speech Settings (app.js)

```javascript
// Current settings
recognition.continuous = false;      // Change to true for continuous listening
recognition.interimResults = true;   // Change to false to only show final results
recognition.lang = 'en-US';          // Change language code

// Additional optional settings
recognition.maxAlternatives = 1;     // Number of alternative transcriptions
```

### Customize Appearance (styles.css)

```css
/* Microphone button size */
.mic-btn {
    width: 3.5rem;    /* Adjust size */
    height: 3.5rem;
    font-size: 1.5rem; /* Adjust emoji size */
}

/* Listening animation */
.mic-btn.listening {
    background: var(--error-color); /* Change color */
    animation: pulse 1.5s infinite;  /* Adjust timing */
}
```

## Advantages Over Other Solutions

### vs. OpenAI Whisper API
- ✅ **Free** (Whisper costs ~$0.006/minute)
- ✅ **No API keys needed**
- ✅ **Instant response** (no network latency)
- ❌ Less accurate for complex phrases
- ❌ Browser-dependent

### vs. Local Whisper Models (whisper.cpp)
- ✅ **No installation required**
- ✅ **No model downloads** (saves bandwidth)
- ✅ **No backend processing** (saves server resources)
- ❌ Browser-dependent
- ❌ Requires internet connection (for some browsers)

### vs. Cloud Speech Services (Google, Azure)
- ✅ **Completely free**
- ✅ **No vendor lock-in**
- ✅ **Privacy-friendly** (processed locally in Chrome)
- ❌ Limited to supported browsers

## Privacy Considerations

### Chrome/Edge
- Speech processing happens **locally** in the browser
- Audio is **not sent to external servers**
- Most privacy-friendly option

### Safari
- May send audio to Apple servers for processing
- Subject to Apple's privacy policy

## Testing Checklist

- [ ] Microphone button appears in supported browsers
- [ ] Microphone button hidden in unsupported browsers (Firefox)
- [ ] Browser requests microphone permission on first use
- [ ] Button turns red and pulses while listening
- [ ] Speech transcription appears in textarea in real-time
- [ ] User can edit transcribed text
- [ ] Error messages display correctly
- [ ] Works with different accents and speaking speeds
- [ ] Analyze button enables when transcription completes

## Troubleshooting

### Button Doesn't Appear
- **Check browser**: Firefox is not supported
- **Check console**: Look for "Speech recognition not supported" warning

### Permission Denied Error
- **Chrome**: Click padlock icon in address bar → Site settings → Microphone → Allow
- **Safari**: System Preferences → Security & Privacy → Privacy → Microphone → Enable browser

### No Transcription Appearing
- **Check microphone**: Verify system microphone works in other apps
- **Check browser permissions**: Ensure microphone access is granted
- **Speak clearly**: Enunciate words clearly, avoid background noise

### Inaccurate Transcription
- **Speak slower**: Give browser time to process
- **Reduce background noise**: Use in quiet environment
- **Edit manually**: Transcription is editable - correct any mistakes

## Future Enhancements

Potential improvements for future versions:

1. **Language Auto-Detection** - Detect user's language automatically
2. **Accent Selection** - Allow users to select their accent for better accuracy
3. **Custom Commands** - Voice commands like "clear text" or "submit"
4. **Continuous Mode** - Keep listening for multiple sentences
5. **Confidence Indicator** - Show transcription confidence score
6. **Offline Mode** - Use local speech models when internet unavailable

## API Integration

No backend changes are required! The speech-to-text feature is **frontend-only** and integrates seamlessly with the existing API:

```javascript
// Frontend: Speech recognition populates occasionInput
recognition.onresult = (event) => {
    occasionInput.value = transcript; // Populate textarea
};

// Existing API call remains unchanged
formData.append('occasion', occasionInput.value.trim());
```

The backend API (`/analyze` endpoint) receives the transcribed text as if it were typed manually.

## Cost Analysis

### Current Implementation (Web Speech API)
- **Cost**: $0
- **Limits**: Browser-dependent
- **Accuracy**: Good for clear speech

### Alternative: OpenAI Whisper API
- **Cost**: ~$0.006 per minute
- **For 100 users @ 30 seconds each**: $3
- **For 1000 users @ 30 seconds each**: $30

### Savings
By using Web Speech API, the application saves significant costs while maintaining good user experience.

## Conclusion

The speech-to-text feature adds significant value to the AI Attire application:

- ✅ **Free and lightweight**
- ✅ **Easy to use**
- ✅ **No additional infrastructure**
- ✅ **Enhances accessibility**
- ✅ **Saves user time**

Users can now simply speak their occasion description, making the application faster and more convenient to use.
