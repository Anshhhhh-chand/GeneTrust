# 5-Day GitHub Push Plan

This document provides step-by-step instructions and commands to push the `genetrust-react-fastapi` codebase to your GitHub repository in logical fragments over 5 days.

## Prerequisites
Before you start, make sure you are in the root directory of your project (`genetrust-react-fastapi`).

```bash
# Initialize the git repository (Run this once)
git init
git remote add origin https://github.com/Anshhhhh-chand/GeneTrust.git
```

---

## Day 1: Project Skeleton & Configuration
Establish the foundational infrastructure and configuration files.

```bash
# 1. Stage core configuration files
git add README.md
git add backend/.env*
git add backend/requirements.txt
git add backend/.pyrefly.toml
git add frontend/package.json
git add frontend/package-lock.json
git add frontend/tsconfig.*
git add frontend/vite.config.ts
git add frontend/index.html
git add frontend/public/
git add frontend/.gitignore
git add backend/.gitignore

# 2. Commit the changes
git commit -m "chore: initial setup and project configuration"

# 3. Push to GitHub
git push -u origin main
```

---

## Day 2: Backend Core (Database, Models, Auth)
Introduce the core backend structure, database connection, schema models, and authentication logic.

```bash
# 1. Stage the backend core files
git add backend/app/__init__.py
git add backend/app/database.py
git add backend/app/models.py
git add backend/app/auth.py
git add backend/app/main.py

# 2. Commit the changes
git commit -m "feat: backend core with database, models, and authentication setup"

# 3. Push to GitHub
git push origin main
```

---

## Day 3: Backend AI & Biological Services
Push the heavy-lifting logic of the backend: the DNABERT-2 ML service, AI chat service, and NCBI integration.

```bash
# 1. Stage the service files
git add backend/app/ml_service.py
git add backend/app/ai_chat.py
git add backend/app/ncbi_service.py

# 2. Commit the changes
git commit -m "feat: implement ML, AI chat, and NCBI gene services"

# 3. Push to GitHub
git push origin main
```

---

## Day 4: Frontend Core & Authentication UI
Establish the React frontend foundation, routing, styling, and the login/signup interface.

```bash
# 1. Stage frontend setup and base components
git add frontend/src/main.tsx
git add frontend/src/App.tsx
git add frontend/src/index.css
git add frontend/src/assets/
git add frontend/src/components/Auth.tsx
git add frontend/src/api/
git add frontend/src/components/Dashboard.tsx

# 2. Commit the changes
git commit -m "feat: frontend foundation, routing, and authentication UI"

# 3. Push to GitHub
git push origin main
```

---

## Day 5: Frontend Advanced Features & Polish
Push the advanced biological analysis components, AI assistant interface, and final project polish.

```bash
# 1. Stage the remaining advanced frontend components
git add frontend/src/components/AIAssistant.tsx
git add frontend/src/components/BatchAnalysis.tsx
git add frontend/src/components/CompareSequences.tsx
git add frontend/src/components/OffTargetPanel.tsx

# 2. Stage any remaining uncommitted files (catch-all)
git add .

# 3. Commit the changes
git commit -m "feat: advanced biological analysis components and final polish"

# 4. Push to GitHub
git push origin main
```

> **Note**: For day 5, `git add .` ensures any miscellaneous scripts or tweaks made along the way are included in the final push.
