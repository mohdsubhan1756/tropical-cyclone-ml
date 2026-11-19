# Cyclone Frontend

This directory contains the React 19 and Vite frontend for the Tropical Cyclone Pattern Analysis and Intensity Prediction project.

## Requirements

- Node.js with npm
- The FastAPI backend running at `http://127.0.0.1:8000`

## Setup

From this directory:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Keep the backend running in a separate terminal:

```powershell
Set-Location ..\backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run Oxlint |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build |

## Pages

- **Dashboard:** backend status and horizon metrics
- **Pattern Analysis:** K-Means and DBSCAN clustering
- **Intensity Prediction:** regression and classification
- **Model Performance:** saved evaluation metrics and charts

## API Configuration

The frontend calls `http://127.0.0.1:8000`. The backend permits Vite origins `http://localhost:5173` and `http://127.0.0.1:5173`.
