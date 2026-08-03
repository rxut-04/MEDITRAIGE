/** Lightweight i18n — no external library. */

export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
]

const STRINGS = {
  en: {
    greeting:
      "Welcome to MediTriage. I'm your AI Clinical Liaison. Tell me what's going on — when you're ready, describe your symptoms and I'll ask clear follow-ups.",
    newAssessment: 'New assessment',
    recent: 'Recent conversations',
    howCanHelp: 'How can I help today?',
    helpSub:
      'Chat naturally about what you feel. MediTriage asks clinical follow-ups when needed, then shows a clear urgency recommendation.',
    placeholder: 'Describe what you are feeling...',
    secureClinical: 'Secure clinical conversation',
    clinicalIntelligence: 'Clinical intelligence',
    emergencyFooter:
      'For emergencies, contact your local emergency services immediately.',
    urgencyTitle: 'Urgency assessment',
    protocolEscalated: 'Safety protocol escalated this result',
    careNearby: 'Nearby care options',
    careLocate: 'Use my location',
    careLocating: 'Finding nearby care…',
    careDenied: 'Location unavailable — showing regional care directory.',
    shareClinic: 'Share with clinic',
    shared: 'Shared with clinic',
    signInSync: 'Sign in to sync history',
    openAvatar: 'Open',
    exportAssessment: 'Export',
    clinicDashboard: 'Clinic',
    language: 'Language',
  },
  hi: {
    greeting:
      'मेडिट्राइएज में आपका स्वागत है। मैं आपका एआई क्लिनिकल सहायक हूँ। बताएँ क्या समस्या है — जब तैयार हों, लक्षण लिखें और मैं स्पष्ट फॉलो-अप पूछूँगा।',
    newAssessment: 'नया आकलन',
    recent: 'हाल की बातचीत',
    howCanHelp: 'आज मैं कैसे मदद करूँ?',
    helpSub:
      'अपने लक्षण स्वाभाविक रूप से बताएँ। ज़रूरत पड़ने पर मेडिट्राइएज क्लिनिकल प्रश्न पूछेगा, फिर स्पष्ट तात्कालिकता दिखाएगा।',
    placeholder: 'आपको कैसा महसूस हो रहा है...',
    secureClinical: 'सुरक्षित क्लिनिकल बातचीत',
    clinicalIntelligence: 'क्लिनिकल इंटेलिजेंस',
    emergencyFooter:
      'आपातकाल में तुरंत स्थानीय आपातकालीन सेवाओं से संपर्क करें।',
    urgencyTitle: 'तात्कालिकता आकलन',
    protocolEscalated: 'सुरक्षा प्रोटोकॉल ने इस परिणाम को बढ़ाया',
    careNearby: 'पास के देखभाल विकल्प',
    careLocate: 'मेरा स्थान उपयोग करें',
    careLocating: 'पास की सुविधाएँ खोज रहे हैं…',
    careDenied: 'स्थान उपलब्ध नहीं — क्षेत्रीय निर्देशिका दिखा रहे हैं।',
    shareClinic: 'क्लिनिक से साझा करें',
    shared: 'क्लिनिक से साझा किया गया',
    signInSync: 'इतिहास सिंक के लिए साइन इन करें',
    openAvatar: 'खोलें',
    exportAssessment: 'निर्यात',
    clinicDashboard: 'क्लिनिक',
    language: 'भाषा',
  },
}

export function t(locale, key) {
  const pack = STRINGS[locale] || STRINGS.en
  return pack[key] || STRINGS.en[key] || key
}

export function normalizeLocale(value) {
  const code = String(value || 'en').toLowerCase().slice(0, 2)
  return LOCALES.some((item) => item.code === code) ? code : 'en'
}
