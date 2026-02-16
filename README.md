# 🌿 Switch-On Diet Recipe Generator

A premium, AI-powered "Wellness Journal" application designed to guide users through the 4-week **Switch-On Diet** program. Generate program-compliant recipes using state-of-the-art AI, track your favorites, and achieve your health goals with ease.

---

## ✨ Features

- **AI Recipe Generation**: Leverage **Gemini 2.5 Pro** to create delicious, diet-compliant recipes in seconds.
- **Smart Ingredient Input**: Modern tag-based entry system for your available groceries.
- **"Chef, up to you"**: Instant recipe generation based entirely on weekly program phase rules.
- **Phase-Specific Logic**: Automated Retrieval-Augmented Generation (RAG) ensures recipes match the exact restrictions of your current week (Weeks 1-4).
- **Multilingual Support**: Fully localized in **English** and **Korean**.
- **User Accounts**: Secure Google SSO authentication to save favorites and persist your ingredient lists.
- **Export to PDF**: Generate print-friendly PDF versions of your recipes for offline use.
- **Social Sharing**: Share your culinary successes on X (Twitter).
- **Premium Design**: A sophisticated "Wellness Journal" aesthetic with smooth transitions and responsive layouts.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18+](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Localization**: [i18next](https://www.i18next.com/)
- **Utilities**: `jsPDF`, `html2canvas`

### Backend
- **Platform**: [Firebase](https://firebase.google.com/) (Functions, Auth, Firestore, Hosting)
- **Functions Engine**: Python 3.11+
- **Database**: Cloud Firestore
- **Security**: Firebase App Check (reCAPTCHA v3)

### AI
- **Model**: Google Gemini 2.5 Pro (via Google AI Studio / `google-generativeai`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.11+ (for backend functions)
- Firebase CLI (`npm install -g firebase-tools`)
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/samtaitai/diet-recipe-maker.git
   cd switchon-recipe-maker
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd functions
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory and add your Firebase and Gemini credentials:
   ```env
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."
   VITE_RECAPTCHA_SITE_KEY="..."
   ```

---

## 💻 Local Development

### Running the App
```bash
# Start the Vite development server
npm run dev
```

### Running Backend Emulators
```bash
# Start Firebase emulators (Functions, Firestore, Auth)
firebase emulators:start
```

### Running Tests
```bash
# Backend tests
cd functions
pytest

# E2E tests (if configured)
npx playwright test
```

---

## 🎨 Design Philosophy: "Wellness Journal"
The application is crafted with a high-end, editorial feel:
- **Serif Typography**: Premium headers (e.g., *Merriweather*) for a classic journal look.
- **Soft Palette**: Off-white/beige backgrounds with charcoal text and vibrant nutrition accents.
- **Micro-Animations**: Smooth transitions between views and interactive nutrition cards.

---

## ⚖️ License
This project is private. Please contact the owner for licensing inquiries.

---
*Made with 💚 for your well-being.*
