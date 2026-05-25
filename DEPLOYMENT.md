# MitigatePlus Deployment Guide

Recommended defense setup:

- Frontend/admin dashboard: Vercel
- Backend/API: Render or Railway
- Database: MongoDB Atlas
- Mobile app: Expo/EAS Android APK
- Domain: `mitigateplus.app`

## 1. Buy The Domain

Recommended domain: `mitigateplus.app`

Use these DNS names:

- `mitigateplus.app` for the web dashboard
- `api.mitigateplus.app` for the backend

Good student-friendly fallback:

- `mitigateplus.me` if you can claim a free Namecheap/GitHub Student domain
- `mitigateplus.org` if you want a civic/public-service tone

## 2. Prepare GitHub

Before pushing, confirm secret files are ignored:

```powershell
git check-ignore -v backend/.env web-app/.env
```

Then push the repo to GitHub. Do not commit real `.env` files.

## 3. Deploy MongoDB Atlas

1. Create or open a MongoDB Atlas project.
2. Create a database cluster.
3. Create a database user.
4. Allow network access from your hosting provider. For a defense demo, `0.0.0.0/0` is the fastest setup, but restrict it later.
5. Copy the connection string into `MONGO_URI`.

## 4. Deploy Backend

Deploy the `backend` folder as a Node.js web service.

Settings:

```text
Root directory: backend
Build command: npm install
Start command: npm start
```

Environment variables:

```text
PORT=5000
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
EMAIL_USER=<Gmail or SMTP user>
EMAIL_PASS=<app password or SMTP password>
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary key>
CLOUDINARY_API_SECRET=<Cloudinary secret>
GEMINI_API_KEY=<Gemini key>
ORS_API_KEY=<OpenRouteService key>
CLIENT_URL=https://mitigateplus.app
SEED_SECRET=<long random secret>
```

After deploy, test:

```text
https://<backend-host>/
```

It should return:

```json
{"message":"MitigatePlus API is running"}
```

After adding the custom domain, the backend should be:

```text
https://api.mitigateplus.app
```

## 5. Deploy Web App

Deploy the `web-app` folder as a Create React App frontend.

Settings:

```text
Root directory: web-app
Build command: npm run build
Output directory: build
```

Environment variables:

```text
REACT_APP_API_URL=https://api.mitigateplus.app/api
REACT_APP_SOCKET_URL=https://api.mitigateplus.app
```

After deploy, add the custom domain:

```text
mitigateplus.app
www.mitigateplus.app
```

## 6. Connect DNS

In your domain registrar DNS settings:

```text
mitigateplus.app       -> Vercel frontend
www.mitigateplus.app   -> Vercel frontend
api.mitigateplus.app   -> backend host
```

Use the exact DNS records shown by Vercel and the backend host dashboard.

## 7. Build Mobile APK

In `mobile-app-sdk50`, create a production env file:

```text
EXPO_PUBLIC_API_URL=https://api.mitigateplus.app/api
```

Then build an Android APK with EAS:

```powershell
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build -p android --profile preview
```

Share the APK link or create a QR code for panelists.

## 8. Defense Day Checklist

- Open `https://mitigateplus.app` on panel laptop.
- Install/test APK on at least one Android phone.
- Login with admin and official accounts.
- Submit one sample mobile report.
- Confirm it appears in the web dashboard.
- Confirm map, report validation, email, and PDF features work.
- Keep backend dashboard open so you can wake/redeploy it quickly.
