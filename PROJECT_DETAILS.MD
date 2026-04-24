MediTriage: Technical Solution Document
1. Project Overview
MediTriage is a high-fidelity AI medical triage assistant designed to provide structural precision in symptom analysis. It combines generative AI logic with a lifelike video avatar to create a trusted clinical-grade user experience.

2. Core Architectural Pillars
A. AI Logic & reasoning (Flowise AI)
The application uses a Flowise AI backend to process natural language clinical descriptions.
Endpoint: Integrated with the 682517ef-8bf4-487c-916b-b72028e7d739 prediction API.
Session Management: Each session is uniquely identified using cryptographically secure UUIDs to maintain context during the diagnostic journey.
Structured Triage: The AI parses responses into four risk categories: Self-Care, 48h Follow-up, Hospital Admission, and Emergency.

B. Interactive Avatar (Beyond Presence)
The Beyond Presence platform provides the interactive clinical liaison.
Seamless TTS (Text-to-Speech): Implemented a postMessage bridge between the React frontend and the Beyond Presence iframe. When the chatbot generates a diagnosis, the text is automatically fed into the avatar's speech engine using bp_speak and SAY_TEXT commands.
Portrait Optimization: Applied aggressive CSS cropping and scaling (scale[1.35], origin-center) within the AIVideoAvatar.jsx component to ensure a "Portrait Mode" view, focusing on the upper body and hiding platform UI elements.
Engagement States: Added a visual "speaking" state with animated audio waveforms and a status toast ("AI Clinical Liaison is on the way...") to improve user feedback loops.


C. Visual Identity & Design

Built with a "Senior Color Architect" approach using a high-contrast clinical theme:
Palette: Obsidian (#171717), Vibrant Accent (#f2572b), and Pure White (#FFFFFF).
Typography: Inter (UI) and JetBrains Mono (Technical data) for a balance of approachability and precision.
Animations: Orchestrated with motion/react for route transitions and interactive elements.


3. Key Technical Implementations
iFrame Communication Bridge
code
JavaScript
// Implementation in Triage.jsx
const triggerAvatarSpeech = (text) => {
  const avatarIframe = document.getElementById('beyond-presence-iframe')
  if (avatarIframe && avatarIframe.contentWindow) {
    const targetOrigin = "https://bey.chat"
    // Remove structural triage tags before speaking
    const speechText = text.replace(/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/g, '').trim()
    
    avatarIframe.contentWindow.postMessage({
      type: 'bp_speak',
      text: speechText
    }, targetOrigin)
  }
}


Deployment & Routing Fixes
The Node.js/Express backend (server.ts) was hardened to handle modern path-to-regexp requirements for SPA deployments, specifically updating the catch-all route to app.get('*all', ...) to prevent startup crashes.



4. Compliance & Permissions
Frame Permissions: Configured metadata.json to explicitly request camera and microphone permissions to allow the Beyond Presence avatar to interact fully with user hardware.
Security: The chat interface identifies itself as HIPAA-compliant and Non-Diagnostic AI to manage clinical expectations.
