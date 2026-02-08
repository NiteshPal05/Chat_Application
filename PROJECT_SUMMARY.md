# ChatApplication Project Summary

## Overview
- Real-time 1-to-1 chat application with WhatsApp-like UX.
- Supports text, media, audio calls, and video calls.
- WebRTC for peer-to-peer calls with TURN for NAT traversal.
- Socket.io used for real-time messaging and signaling.
- Firebase Storage used for file uploads.
- Deployed with frontend on Vercel and backend on Render.

## Core Features
- User authentication with Firebase.
- One-to-one chat with typing and file attachments.
- Image preview (modal) and document link preview.
- Real-time unread badges and sidebar message previews.
- Online status indicator for users (green dot).
- Notification sound for new incoming messages.
- Call notifications with ringtone when receiving calls.
- Separate scrollable sidebar and chat area.
- Responsive layout for mobile/tablet (WhatsApp-style layout).

## Messaging Flow
- Messages stored in MongoDB via Mongoose.
- Real-time delivery using Socket.io `sendMessage` / `receiveMessage`.
- Message status tracking:
  - Sent (single tick)
  - Delivered (double gray tick)
  - Seen (double blue tick)
- Delivered status is emitted when receiver gets message.
- Seen status is emitted when receiver opens the chat and the app is focused.

## Audio & Video Calling
- 1-to-1 WebRTC calls with audio and video.
- TURN support (Twilio NTS) for calls across different networks.
- ICE candidate queuing until remote description is set.
- Stream handling via `ontrack` and safe playback re-tries.
- Call controls: start, accept, reject, hang up.
- Auto-cleanup of tracks and peer connection on end.

## UI / UX Highlights
- WhatsApp-inspired layout and call button placement.
- Separate scrollable chat list and message pane.
- Link and long text wrapping in message bubbles.
- Chat bubbles styled with sender context.
- Last message preview under user name in sidebar.
- “Scroll to latest” floating button when user scrolls up.

## Notifications
- Message notification sound (from `public/sound.mp3`).
- Call ringtone (from `public/ringtone.mp3`).
- Unread indicator dot and count in sidebar.
- Socket connectivity indicator in sidebar.

## Deployment
- Frontend (Vite + React + Tailwind) deployed to Vercel.
- Backend (Express + Socket.io + MongoDB) deployed to Render.
- TURN credentials fetched from backend `/api/turn` endpoint.

## File Structure (Key Files)
- `frontend/src/pages/ChatDashboard.jsx`
  - Main chat UI, messaging, calling, notifications.
- `frontend/src/index.css`
  - Scrollbars, responsive layout.
- `backend/server.js`
  - Socket.io signaling, delivery/seen events, TURN endpoint.
- `backend/models/Message.js`
  - Message schema with delivery status fields.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Socket.io-client.
- Backend: Node.js, Express, Socket.io, MongoDB/Mongoose.
- Real-time: WebRTC + TURN (Twilio).
- Storage: Firebase Storage.
- Deployment: Vercel + Render.

## Current Status
- Messaging + media fully functional.
- Calls stable across different networks.
- UI responsive on desktop, tablet, and mobile.
- Delivered/Seen indicators active.

