# Chat Application

A real-time 1-to-1 chat app with WhatsApp-style UI, audio/video calling, and message delivery/seen status.

## Features
- 1-to-1 messaging with media (images/documents)
- WhatsApp-style delivered/seen ticks
- Voice + Video calls (WebRTC)
- TURN support (Twilio NTS) for real networks
- Notification sound + call ringtone
- Unread badges and last message preview in sidebar
- Online status indicator
- Responsive UI (desktop/tablet/mobile)

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Socket.io-client
- Backend: Node.js + Express + Socket.io + MongoDB/Mongoose
- Calls: WebRTC + TURN
- Storage: Firebase Storage
- Deployment: Vercel (frontend), Render (backend)

## Getting Started (Local)

### 1. Clone
```bash
git clone <your-repo-url>
cd chatApplication
```

### 2. Backend setup
```bash
cd backend
npm install
npm start
```

Create a `.env` file in `backend/`:

```env
PORT=5001
MONGO_URI=your_mongodb_uri
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

Create a `.env` file in `frontend/`:

```env
VITE_BACKEND_URL=http://localhost:5001
```

### 4. Media Sounds
Place files in:
```
frontend/public/sound.mp3
frontend/public/ringtone.mp3
```

## Deployment
- Frontend (Vercel): set `VITE_BACKEND_URL` to your backend URL
- Backend (Render): set all env vars (`MONGO_URI`, `TWILIO_*`)

## Status Ticks
- ✓ Sent
- ✓✓ Delivered (gray)
- ✓✓ Seen (blue)

---

If you'd like, I can also add screenshots, badges, or a short demo GIF.
