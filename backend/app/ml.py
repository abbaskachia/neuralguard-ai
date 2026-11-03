
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    balanced_accuracy_score,
    average_precision_score,
    brier_score_loss,
)
from sklearn.model_selection import train_test_split

FEATURES = ["temperature", "vibration", "pressure", "rpm"]


def generate_dataset(size=5000, seed=42):
    rng = np.random.default_rng(seed)

    temperature = np.clip(rng.normal(67, 14, size), 25, 115)
    vibration = np.clip(rng.gamma(2.1, 1.3, size), 0.1, 16)
    pressure = np.clip(rng.normal(48, 11, size), 12, 90)
    rpm = np.clip(rng.normal(1500, 300, size), 400, 2800)

    signal = (
        0.055 * (temperature - 72)
        + 0.90 * (vibration - 4.0)
        + 0.045 * (32 - pressure)
        + 0.0010 * (rpm - 1700)
    )

    probability = 1 / (1 + np.exp(-signal))
    probability = np.clip(probability * 0.88 + 0.06, 0.01, 0.98)
    failure = rng.binomial(1, probability)

    return pd.DataFrame({
        "temperature": temperature.round(2),
        "vibration": vibration.round(2),
        "pressure": pressure.round(2),
        "rpm": rpm.round(0).astype(int),
        "failure": failure
    })


def train_model(dataframe=None):
    data = dataframe if dataframe is not None else generate_dataset()

    x_train, x_test, y_train, y_test = train_test_split(
        data[FEATURES],
        data["failure"].astype(int),
        test_size=0.2,
        random_state=42,
        stratify=data["failure"]
    )

    model = RandomForestClassifier(
        n_estimators=180,
        max_depth=10,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    model.fit(x_train, y_train)

    probabilities = model.predict_proba(x_test)[:, 1]
    predicted = (probabilities >= 0.5).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_test, predicted, labels=[0, 1]
    ).ravel()

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predicted)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_test, predicted)), 4),
        "precision": round(float(precision_score(y_test, predicted, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predicted, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predicted, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "pr_auc": round(float(average_precision_score(y_test, probabilities)), 4),
        "brier_score": round(float(brier_score_loss(y_test, probabilities)), 4),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp)
        },
        "train_samples": int(len(x_train)),
        "test_samples": int(len(x_test)),
        "model": "Random Forest",
        "data_type": "synthetic"
    }

    return model, metrics


def classify_risk(score):
    if score >= 0.70:
        return "HIGH"
    if score >= 0.40:
        return "MEDIUM"
    return "LOW"


def make_recommendations(reading, score):
    tips = []

    if reading["temperature"] > 80:
        tips.append(
            "Ask a qualified operator to inspect temperature, cooling, and lubrication."
        )

    if reading["vibration"] > 6:
        tips.append(
            "Review vibration trends and inspect alignment, mounting, and bearings."
        )

    if reading["pressure"] < 30:
        tips.append(
            "Check pressure trends and inspect for possible leaks or restrictions."
        )

    if reading["rpm"] > 2100:
        tips.append(
            "Verify rotational speed against the equipment manufacturer's rated range."
        )

    if not tips:
        tips.append(
            "Continue routine inspections and monitor subsequent readings."
        )

    if score >= 0.70:
        tips.insert(0, "High model-estimated risk: request prompt human review.")
    elif score >= 0.40:
        tips.insert(0, "Moderate model-estimated risk: review trends and consider inspection.")

    return tips
