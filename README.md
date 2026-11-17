# 🌐 SocialSphere

<div align="center">

![SocialSphere Banner](https://img.shields.io/badge/SocialSphere-Obsidian%20Dark-1d9bf0?style=for-the-badge&logoColor=white)

**A modern, production-grade social communication and network platform built with React 19, Express 5, TypeScript, Prisma 7, and Neon PostgreSQL.**

[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express 5](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.x-2d3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00e599?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0c2340?style=flat-square&logo=razorpay&logoColor=3395ff)](https://razorpay.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI%20Suggest-6366f1?style=flat-square&logo=openai&logoColor=white)](https://openrouter.ai/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Rich Post Composer](#1-rich-post-composer)
  - [AI Post Assistant](#2-ai-post-assistant-openrouter-llm)
  - [Monetization & Plans](#3-monetization--plans-razorpay)
  - [Real-Time Messaging & Notifications](#4-real-time-messaging--notifications)
  - [Privacy & Social Graph](#5-privacy--social-graph)
  - [Authentication & Security](#6-authentication--security)
- [Design System](#-design-system)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Environment Variables](#-environment-variables)
- [Deployment on Render](#-deployment-on-render)
- [Testing](#-testing)
- [License](#-license)

---

## 🌟 Overview

**SocialSphere** is a full-featured, responsive next-generation social communication platform. It combines real-time communication, rich media handling, tiered subscription billing, and real LLM AI suggestions into a cohesive Obsidian Dark aesthetic.

Engineered with modern architecture principles:
- **No TanStack Query / External Cache Bloat**: Fast, reliable React state management with Axios interceptors, silent token refresh, and manual state synchronization.
- **Pure Tailwind CSS**: Clean utility-first styling with zero legacy CSS dependencies.
- **Type Safety**: End-to-end TypeScript from Neon PostgreSQL schema to React 19 UI components.

---

## ✨ Key Features

### 1. Rich Post Composer
- **Multi-Media Grid Layouts**: Adaptive 1-image (full width), 2-image (2 columns), 3-image (1 + 2 stacked), and 4-image ($2 \times 2$ grid) displays with standard aspect ratios.
- **Emoji Picker**: Integrated popover picker (`emoji-picker-react`) with cursor-position insertion, search, and category navigation.
- **GIPHY Integration**: Search and embed trending GIFs directly into posts with lightweight previews and provider attribution.
- **Cloudinary Uploads**: High-speed image and video processing with server-side signature validation and format verification.
- **Threads & Engagements**: In-line replies, nested thread tree views, reposts, quote posts, likes, and bookmarks.

### 2. AI Post Assistant (OpenRouter LLM)
Powered by server-side OpenRouter API integration:
- **Improve Post**: Rewrites drafts for engagement and clarity while preserving tone.
- **Grammar & Spell Check**: Fixes punctuation and syntax instantly.
- **Tone Variations**: Switch between Professional, Casual, Friendly, Humorous, Engaging, and Viral styles.
- **Smart Expansion**: Expands bullet points or thoughts into detailed, well-structured posts.
- **Hashtag Recommendation**: Generates trending, context-aware hashtags.
- **Credit-Gated Quotas**: Enforces plan-based AI credit limits with monthly auto-resets.

### 3. Monetization & Plans (Razorpay)
- **Tiered Plans**:
  - **Free (₹0/mo)**: 20 AI credits, 280 characters/post, basic suggestions.
  - **Plus (₹199/mo)**: 300 AI credits, 2,000 characters/post, verified blue badge, advanced AI tones.
  - **Pro (₹499/mo)**: 1,000 AI credits, 10,000 characters/post, verified badge, full AI suite & expansion.
- **Dual-Mode Razorpay Integration**:
  - Automatically handles standard **Checkout Orders (`/v1/orders`)** for test/standard accounts (UPI, Cards, Netbanking, Wallets).
  - Supports **Recurring Subscriptions (`/v1/subscriptions`)** when mandate plans are configured.
  - HMAC-SHA256 signature verification, webhook reconciliation, and automated entitlement updates.
- **Billing Dashboard**: Track current cycle dates, credit consumption gauges, and detailed transaction receipts.

### 4. Real-Time Messaging & Notifications
- **Direct Messaging (DMs)**: 1-on-1 private messaging powered by **Socket.IO** with live typing indicators and instant unread count sync.
- **Access Control**: Strict mutual-follow permission checks prevent unsolicited DMs.
- **Instant Alerts**: Real-time notification badges for likes, reposts, replies, mentions, and follow requests.

### 5. Privacy & Social Graph
- **Public vs. Private Profiles**: Toggle account privacy to require manual review for incoming follow requests.
- **Follow Request Workflow**: Pending requests panel to accept or decline followers.
- **Blocking & Protection**: Instant transactional cleanup when blocking users (removes follow links, hides posts and conversations).

### 6. Authentication & Security
- **Dual Auth Providers**: Email/Password (salted bcrypt hashes) and Google Sign-In (Firebase Admin).
- **JWT Architecture**: Short-lived access tokens with HTTP-only, secure refresh token rotation cookies.
- **Reverse Proxy Ready**: Configured with `trust proxy` and cross-site CORS for seamless production deployment behind cloud proxies.

---

## 🎨 Design System

SocialSphere uses an **Obsidian Dark** color identity:

| Element | Color Hex | Tailwind Class |
|---|---|---|
| **Background** | `#000000` | `bg-black` |
| **Primary Surface** | `#13171f` | `bg-surface-primary` |
| **Secondary Surface** | `#1e2430` | `bg-surface-secondary` |
| **Surface Hover** | `#283040` | `bg-surface-hover` |
| **Primary Accent (Brand Blue)** | `#1d9bf0` | `text-accent-blue` / `bg-accent-blue` |
| **Premium Accent (Violet)** | `#c084fc` | `text-premium-violet` / `bg-premium-violet` |
| **Primary Text** | `#ffffff` | `text-text-primary` |
| **Secondary Text** | `#94a3b8` | `text-text-secondary` |
| **Border Dark** | `#242b35` | `border-border-dark` |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Language**: TypeScript 5.x
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **State Management**: React State (`useState`, `useEffect`) + React Context + Redux Toolkit (for Socket.IO real-time slice)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/) with automated refresh token interceptor

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Server Framework**: [Express 5](https://expressjs.com/)
- **Language**: TypeScript 7.x
- **Database & ORM**: [PostgreSQL (Neon)](https://neon.tech/) with [Prisma ORM 7](https://www.prisma.io/) and `@prisma/adapter-pg`
- **Real-Time WebSockets**: [Socket.IO 4](https://socket.io/)
- **Authentication**: JWT (`jsonwebtoken`) + bcryptjs + Firebase Admin SDK
- **File Uploads**: Multer + [Cloudinary SDK](https://cloudinary.com/)
- **Payments**: [Razorpay](https://razorpay.com/) (Standard Orders + Subscriptions + Webhooks)
- **AI Engine**: [OpenRouter API](https://openrouter.ai/) (Chat Completions)

---

## 📂 Project Architecture

```
Socialsphere/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── api/                # Axios instance, baseURL normalization, refresh interceptors
│   │   ├── components/         # Composer, TweetCard, Sidebars, Modals, EmojiPicker
│   │   ├── features/           # Auth, Socket, and Tweet feature slices/hooks
│   │   ├── pages/              # Feed, Profile, Plans, Billing, Messages, Notifications
│   │   ├── types/              # Global TypeScript interfaces & Razorpay window types
│   │   ├── App.tsx             # Route definitions & layout shell
│   │   └── main.tsx            # App mounting & context providers
│   ├── tailwind.config.js      # Obsidian Dark palette & typography tokens
│   └── package.json
│
├── server/                     # Backend API (Express 5 + Prisma 7)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (Users, Tweets, Billing, Messages)
│   ├── src/
│   │   ├── controllers/        # Auth, Tweet, User, Billing, AI, Media, Message controllers
│   │   ├── lib/                # JWT, Prisma adapter, Cloudinary, Razorpay, OpenRouter, Firebase
│   │   ├── middleware/         # Auth verification, Multer validation, error handlers
│   │   ├── routes/             # Express API & Webhook route modules
│   │   ├── socket.ts           # Socket.IO connection handlers & private rooms
│   │   └── index.ts            # Server entry point, CORS, reverse proxy configuration
│   └── package.json
│
├── render.yaml                 # Infrastructure Blueprint for 1-click deployment on Render
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **PostgreSQL Database**: Free cloud database from [Neon](https://neon.tech/)
- **Cloudinary Account**: Free tier from [Cloudinary](https://cloudinary.com/)
- **Razorpay Account**: Test mode keys from [Razorpay Dashboard](https://dashboard.razorpay.com/)
- **OpenRouter Account**: API key from [OpenRouter](https://openrouter.ai/)

---

### 1. Backend Setup

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in `server/` (refer to `server/.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
   JWT_SECRET="your_jwt_access_secret_min_32_characters"
   JWT_REFRESH_SECRET="your_jwt_refresh_secret_min_32_characters"
   CLIENT_URL="http://localhost:5173"
   OPENROUTER_API_KEY="your_openrouter_api_key"
   OPENROUTER_MODEL="openrouter/free"
   RAZORPAY_KEY_ID="rzp_test_your_key_id"
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
   CLOUDINARY_API_KEY="your_cloudinary_api_key"
   CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
   ```

4. **Sync the database schema**:
   ```bash
   npx prisma db push
   ```

5. **Generate the Prisma client**:
   ```bash
   npx prisma generate
   ```

6. **Start the backend development server**:
   ```bash
   npm run dev
   ```
   The API will be live at `http://localhost:5000`.

---

### 2. Frontend Setup

1. **Navigate to the client directory**:
   ```bash
   cd ../client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in `client/` (refer to `client/.env.example`):
   ```env
   VITE_API_URL="http://localhost:5000/api"
   VITE_SOCKET_URL="http://localhost:5000"
   VITE_RAZORPAY_KEY_ID="rzp_test_your_key_id"
   VITE_GIPHY_API_KEY="your_giphy_api_key"
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🔑 Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Local server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://...@neon.tech/db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing access tokens (min 32 chars) | Random 64-char hex string |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | Random 64-char hex string |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS and cookies | `http://localhost:5173` or `https://app.onrender.com` |
| `OPENROUTER_API_KEY` | OpenRouter LLM API key | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | AI model identifier | `openrouter/free` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `S57j1...` |
| `RAZORPAY_WEBHOOK_SECRET` | Optional webhook verification secret | Webhook secret from dashboard |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `secret_...` |

### Frontend (`client/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL (with or without `/api`) | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public Key ID | `rzp_test_...` |
| `VITE_GIPHY_API_KEY` | GIPHY public API key | `sXpGF...` |

---

## ☁️ Deployment on Render

SocialSphere includes a ready-to-use [`render.yaml`](./render.yaml) specification to deploy both frontend and backend separately on [Render](https://render.com).

### Manual Dashboard Deployment

#### Backend (Web Service)
* **Root Directory**: `server`
* **Runtime**: `Node`
* **Build Command**: `npm install --include=dev && npm run build`
* **Start Command**: `npm start`
* **Health Check Path**: `/health`
* **Environment Variables**: Add all variables from the backend table above.

#### Frontend (Static Site)
* **Root Directory**: `client`
* **Build Command**: `npm install --include=dev && npm run build`
* **Publish Directory**: `dist`
* **Redirects/Rewrites**:
  * **Source**: `/*`
  * **Destination**: `/index.html`
  * **Action**: `Rewrite`
* **Environment Variables**: Set `VITE_API_URL` to your backend URL + `/api`.

> [!TIP]
> After deploying both services, remember to set `CLIENT_URL` in your backend environment to your live frontend URL (e.g. `https://socialsphere-web.onrender.com`).

---

## 🧪 Testing

The backend includes comprehensive automated unit and integration tests:

```bash
cd server

# Test billing primitives, INR paise conversion, grapheme limits & HMAC signatures
npm run test:billing-unit

# Test authentication & token refresh
npm run test:auth

# Test post threads, replies & quote posts
npm run test:tweets

# Test direct message real-time delivery & access control
npm run test:dm

# Run the complete test suite
npm run test
```

---

## 📄 License

This project is licensed under the **ISC License**. Feel free to use and adapt it for learning or personal projects.

---

<div align="center">
  <sub>Built with ❤️ by Vansh Nagpal & contributors.</sub>
</div>
