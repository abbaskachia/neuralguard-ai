from pathlib import Path
import pandas as pd
from app.ml import generate_dataset, train_model

base = Path(__file__).resolve().parent
data_dir = base / "data"
data_dir.mkdir(exist_ok=True)
csv_path = data_dir / "machine_telemetry.csv"

dataset = generate_dataset(size=5000, seed=42)
dataset.to_csv(csv_path, index=False)
_, metrics = train_model(dataset)

print(f"Dataset saved to: {csv_path}")
print("Holdout evaluation metrics (synthetic data):")
for key, value in metrics.items():
    print(f"{key}: {value}")
