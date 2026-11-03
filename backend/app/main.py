from collections import deque
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .ml import (
    FEATURES,
    generate_dataset,
    train_model,
    classify_risk,
    make_recommendations,
)

BASE = Path(__file__).resolve().parents[1]
DATA_DIR = BASE / "data"
DATA_DIR.mkdir(exist_ok=True)
DATA_FILE = DATA_DIR / "machine_telemetry.csv"

if not DATA_FILE.exists():
    generate_dataset().to_csv(DATA_FILE, index=False)

model, model_metrics = train_model(pd.read_csv(DATA_FILE))

rng = np.random.default_rng(17)
readings = deque(maxlen=100)

app = FastAPI(
    title="NeuralGuard AI",
    description="FT-03 predictive maintenance demonstration API. Uses synthetic data.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SensorInput(BaseModel):
    temperature: float = Field(ge=-20, le=200)
    vibration: float = Field(ge=0, le=50)
    pressure: float = Field(ge=0, le=200)
    rpm: float = Field(ge=0, le=30000)


def random_reading():
    return {
        "temperature": round(float(np.clip(rng.normal(68, 14), 25, 115)), 1),
        "vibration": round(float(np.clip(rng.gamma(2.1, 1.35), 0.1, 16)), 2),
        "pressure": round(float(np.clip(rng.normal(48, 11), 12, 90)), 1),
        "rpm": int(np.clip(rng.normal(1500, 300), 400, 2800)),
    }


def estimate(values):
    row = [[values[name] for name in FEATURES]]
    return float(model.predict_proba(row)[0][1])


def record(values):
    score = estimate(values)

    item = {
        "id": int(datetime.now(timezone.utc).timestamp() * 1000),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **values,
        "risk_score": round(score, 4),
        "risk_level": classify_risk(score),
    }

    readings.appendleft(item)
    return item


for _ in range(25):
    record(random_reading())


@app.get("/")
def home():
    return {
        "name": "NeuralGuard AI",
        "challenge": "FT-03",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "data": "synthetic",
    }


@app.get("/api/metrics")
def metrics():
    return model_metrics


@app.get("/api/telemetry/latest")
def latest():
    return readings[0]


@app.get("/api/telemetry/history")
def history(limit: int = Query(30, ge=1, le=100)):
    return list(readings)[:limit]


@app.get("/api/summary")
def summary():
    rows = list(readings)

    counts = {
        level: sum(row["risk_level"] == level for row in rows)
        for level in ["HIGH", "MEDIUM", "LOW"]
    }

    return {
        "total_readings": len(rows),
        "high_risk": counts["HIGH"],
        "medium_risk": counts["MEDIUM"],
        "low_risk": counts["LOW"],
        "latest": rows[0],
    }


@app.post("/api/simulate")
def simulate():
    return record(random_reading())


@app.post("/api/predict")
def predict(payload: SensorInput):
    values = payload.model_dump()

    score = estimate(values)
    predicted_failure = score >= 0.5

    return {
        "risk_score": round(score, 4),
        "failure_probability": round(score, 4),
        "no_failure_probability": round(1 - score, 4),
        "risk_level": classify_risk(score),
        "predicted_failure": predicted_failure,
        "predicted_class": (
            "Potential failure"
            if predicted_failure
            else "No failure indicated"
        ),
        "prediction_confidence": round(max(score, 1 - score), 4),
        "recommendations": make_recommendations(values, score),
        "input": values,
    }
