# 🌐 SocialSphere — Frontend Client

The frontend web client for **SocialSphere**, an X (Twitter) clone built with React 19, Vite, TypeScript, and pure Tailwind CSS.

For complete project documentation, full-stack setup, and deployment guides, refer to the [Root README.md](../README.md).

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8
- **Language**: TypeScript (TSX)
- **Styling**: Tailwind CSS 3.4 (Obsidian Dark palette)
- **Icons**: Lucide React
- **Routing**: React Router 7
- **HTTP**: Axios with automatic silent token refresh interceptors
- **Real-Time**: Socket.IO Client 4

---

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure `.env`**:
   Copy `.env.example` to `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
   VITE_GIPHY_API_KEY=your_giphy_key
   ```

3. **Start local dev server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```
