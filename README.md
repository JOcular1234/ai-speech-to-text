AI Speech-to-Text TranscriberA modern web application built with Next.js, Tailwind CSS, and the ElevenLabs API to transcribe audio files (MP3, WAV) into text using advanced AI technology. The application features a sleek, user-friendly interface with drag-and-drop file upload, transcription history, dark/light mode toggle, and a responsive header and footer.FeaturesAudio Transcription: Upload MP3 or WAV files to generate accurate transcriptions using the ElevenLabs speech-to-text API.
Drag-and-Drop Upload: Intuitive file upload with a cloud icon, supporting drag-and-drop and file selection.
Transcription History: Stores up to 10 recent transcriptions in local storage, with the ability to view and clear history.
Responsive Design: Fully responsive layout with a mobile-friendly hamburger menu and multi-column footer.
Dark/Light Mode: Toggle between dark and light themes, with preferences saved in local storage.
Header & Footer: Professional header with navigation (Home, About, API) and footer with About, Links, and Contact sections.
Error Handling: Robust error handling for missing audio files, API errors, and invalid data (e.g., language detection fallbacks).
Accessibility: ARIA labels, keyboard navigation, and high-contrast visuals for an inclusive user experience.

Tech StackFrontend: Next.js (React), Tailwind CSS, Heroicons, react-hot-toast
Backend: Next.js API routes, ElevenLabs speech-to-text API
Storage: Local storage for transcription history and theme preferences
Deployment: Node.js runtime (Next.js)

PrerequisitesNode.js (v16 or higher)
npm or Yarn
ElevenLabs API key (sign up at ElevenLabs to obtain one)

SetupClone the Repository:bash

git clone https://github.com/your-username/ai-speech-to-text-transcriber.git
cd ai-speech-to-text-transcriber

Install Dependencies:bash

npm install

Required packages:next
react
react-dom
@heroicons/react
react-hot-toast

Set Up Environment Variables:
Create a .env.local file in the root directory and add your ElevenLabs API key:env

ELEVENLABS_API_KEY=your-elevenlabs-api-key

Configure Tailwind CSS:
Ensure tailwind.config.js is set up for dark mode and custom animations:js

module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
};

Add Inter Font:
Include the Inter font in your index.html or CSS:html

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

Run the Development Server:bash

npm run dev

Open http://localhost:3000 in your browser.

UsageUpload an Audio File:Drag and drop an MP3 or WAV file into the upload area, or click "Select File" to browse.
Supported formats: MP3, WAV.

Transcribe Audio:Click the "Transcribe Audio" button to process the file.
A loading spinner will appear during transcription.

View Transcription:The transcription text, language, confidence, word count, and speaker count (if applicable) are displayed.
Download the full transcription as a JSON file by clicking "Download Transcription (JSON)".

Manage History:Recent transcriptions are shown in the "Transcription History" section.
Click "View Full Transcription" to revisit a transcription or "Clear History" to remove all entries.

Toggle Theme:Use the sun/moon icon in the header to switch between dark and light modes.

Navigation:Use the header links (Home, About, API) to navigate. On mobile, toggle the hamburger menu.

API IntegrationThe application uses the ElevenLabs speech-to-text API (scribe_v1 model) for transcription. The backend (/api/stt) handles:File uploads via FormData.
API requests with language detection and diarization enabled.
Fallbacks for missing language ("Unknown") and confidence ("N/A") to prevent errors.

To use a different API or model, update src/app/api/stt/route.jsx.Project Structure

ai-speech-to-text-transcriber/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── stt/
│   │   │       └── route.jsx  # Backend API route for transcription
│   │   ├── page.js           # Main page with UI
│   │   └── globals.css       # Tailwind CSS setup
├── tailwind.config.js        # Tailwind configuration
├── .env.local                # Environment variables (API key)
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation

TroubleshootingLanguage Not Detected or Confidence Shows NaN%:Ensure your ElevenLabs API key is valid and supports the scribe_v1 model.
Check the console logs for the API response (ElevenLabs API response) to verify language_code and language_probability.
Test with clear, longer audio files to improve language detection.

API Errors:Verify the API key in .env.local.
Ensure the audio file is a valid MP3 or WAV.

UI Issues:Confirm Tailwind CSS and Heroicons are installed.
Check for missing fonts (Inter) in your browser’s developer tools.

