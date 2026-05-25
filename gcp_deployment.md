# 🚀 StaffSync: Production Deployment Guide (GCP Cloud Run)

Follow this workflow every time you want to move your **local changes** to the **live website**.

---

## **Step 1: Local Computer (Push your code)**
Run these commands in your **VS Code** or **local terminal**:

```bash
git add .
git commit -m "Update: [Describe your changes here]"
git push origin main
```

---

## **Step 2: Google Cloud Shell (Update environment)**
Go to your **[Google Cloud Shell Terminal](https://console.cloud.google.com/home/dashboard?cloudshell=true)** and pull the new files:

```bash
cd ~/StaffSync_SP
git pull origin main
```

---

## **Step 3: Deploy to Production**
Depending on what you changed, run the appropriate deployment command. 

> [!TIP]
> Google Cloud Run handles process management (like PM2), scaling, and auto-restarts for you.

### **📦 Deploy Backend Changes**
Run this if you changed any files inside the `backend/` folder (API routes, database code, etc.):
```bash
gcloud run deploy staffsync-backend --source backend --region us-central1
```

### **🎨 Deploy Frontend Changes**
Run this if you changed any files inside the `frontend/` folder (UI, components, styles, etc.):
```bash
gcloud run deploy staffsync-frontend --source frontend --region us-central1
```

---

## **🚦 Pro-Tip: When to deploy which?**
- **Changed only CSS or UI?** ➡️ Deploy only `staffsync-frontend`.
- **Added a new API endpoint or DB table?** ➡️ Deploy `staffsync-backend`.
- **Both?** ➡️ Deploy **both** (Backend first, then Frontend).

---

## **🔗 Important URLs**
- **Backend API**: [https://staffsync-backend-174132084209.us-central1.run.app](https://staffsync-backend-174132084209.us-central1.run.app)
- **Frontend App**: [https://staffsync-frontend-174132084209.us-central1.run.app](https://staffsync-frontend-174132084209.us-central1.run.app)
