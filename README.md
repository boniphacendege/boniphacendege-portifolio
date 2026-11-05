# Boniphace Ndege — Official Portfolio & Bookstore

A modern, high-performance web application showcasing the creative design, web development, digital content, published books, and visual branding portfolio of **Ev Dr. Boniphace J. Ndege**.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion
- **PWA & Offline**: Vite Plugin PWA, Service Worker offline caching, Web App Manifest
- **Storage & Auth**: Firebase Firestore (reactive real-time sync with localStorage resilience), Firebase Auth, Firebase Storage
- **Production Server**: Node.js 22 + Express production static server with health checks (`/healthz`), SPA routing, security headers, and reverse proxy trust
- **Containerization**: Multi-stage Dockerfile optimized for Google Cloud Run
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) & Google Cloud Build (`cloudbuild.yaml`)

---

## 🛠️ Local Development

### Prerequisites

- Node.js 20 or 22+
- npm (v10+)

### 1. Clone the repository

```bash
git clone https://github.com/boniphacendege/Boniphace-Ndege---Admin-Portfolio.git
cd Boniphace-Ndege---Admin-Portfolio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Testing

### Type-checking & Linting

```bash
npm test
# or
npm run lint
```

### Building the static bundle

```bash
npm run build
```

This generates optimized production assets in the `dist/` directory.

### Running the production server locally

```bash
npm start
```

The production server starts on `http://0.0.0.0:8080` (or `PORT` defined in your environment) and serves the `dist/` bundle with Cloud Run health check support.

To preview via Vite's preview tool:
```bash
npm run preview
```

---

## ☁️ Google Cloud Run Deployment

### Option A: Using Google Cloud Build (Automated)

1. Connect your GitHub repository to Google Cloud Build.
2. Cloud Build automatically uses `cloudbuild.yaml` to build the container image and deploy it to Cloud Run.

### Option B: Deploy directly with gcloud CLI

Make sure you are authenticated with Google Cloud:

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

Deploy directly from source using Google Cloud Run:

```bash
gcloud run deploy boniphace-portfolio \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

Or build and submit the container image via Google Cloud Build:

```bash
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/boniphace-portfolio:latest
gcloud run deploy boniphace-portfolio \
  --image gcr.io/YOUR_GCP_PROJECT_ID/boniphace-portfolio:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## 🌐 Cloudflare Custom Domain Integration

To route your custom domain (e.g. `boniphacendege.com` or `www.boniphacendege.com`) through Cloudflare to Google Cloud Run:

### 1. Cloud Run Domain Mapping
1. In the Google Cloud Console, navigate to **Cloud Run** > **Custom Domains**.
2. Select your `boniphace-portfolio` service and add your domain (e.g., `boniphacendege.com` or `www.boniphacendege.com`).
3. Google Cloud will provide the DNS target (either a `ghs.googlehosted.com` CNAME record or specific Google Anycast IPs).

### 2. Cloudflare DNS Configuration
In your Cloudflare Dashboard:
- Add a **CNAME** record:
  - **Name**: `@` (or `www`)
  - **Target**: `ghs.googlehosted.com` (or your Cloud Run custom domain target)
  - **Proxy status**: **Proxied** (Orange cloud icon enabled)

### 3. Cloudflare SSL/TLS Settings
- Set SSL/TLS encryption mode to **Full (strict)** or **Full**.
- Enable **Always Use HTTPS**.
- Enable **HTTP/2** and **HTTP/3 (with QUIC)** for peak performance.

### 4. Cloudflare Caching & Edge Optimization
- Cloudflare will cache static assets in `/assets/*` at its global edge.
- The included `server/index.js` sends `Cache-Control: public, max-age=31536000, immutable` for hashed assets and `must-revalidate` for `index.html` and service workers, ensuring seamless instant PWA updates.

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` to customize settings.

| Variable | Description | Default |
|---|---|---|
| `PORT` | Production HTTP server port | `8080` |
| `HOST` | Host binding interface | `0.0.0.0` |
| `NODE_ENV` | Environment mode (`production` / `development`) | `production` |
| `VITE_FIREBASE_API_KEY` | Firebase API Key (optional override) | Local config fallback |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Local config fallback |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Local config fallback |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Firestore Database ID | Local config fallback |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Local config fallback |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Local config fallback |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | Local config fallback |

---

## 🛡️ Health Check & Monitoring

The production server includes built-in container health checks:

- `GET /healthz` -> Returns `200 OK` with JSON `{ "status": "healthy", "uptime": ..., "timestamp": ... }`
- Used by Docker container `HEALTHCHECK` and Cloud Run service startup probes.

---

## 📄 License

Apache-2.0
