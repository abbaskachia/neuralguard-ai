import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Waves,
  Zap
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import "./style.css";

const API = "http://127.0.0.1:8000";

const styles = `
.ng-dashboard {
  color: #f5f5f5;
  min-height: 100vh;
  background: #090909;
  padding: 28px;
  font-family: Arial, sans-serif;
}
.ng-dashboard * { box-sizing: border-box; }
.ng-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.ng-brand { display: flex; align-items: center; gap: 12px; }
.ng-logo {
  width: 44px; height: 44px; display: grid;
  place-items: center; border-radius: 12px;
  background: #ffd700; color: #090909;
}
.ng-title { font-size: 24px; font-weight: 800; }
.ng-subtitle { color: #929292; font-size: 13px; margin-top: 5px; }
.ng-status {
  display: flex; align-items: center; gap: 8px;
  color: #65d69a; font-size: 13px;
  border: 1px solid #294b39; padding: 10px 14px;
  border-radius: 30px;
}
.ng-dot { width: 8px; height: 8px; background: #65d69a; border-radius: 50%; }
.ng-section-title { font-size: 17px; margin: 28px 0 15px; }
.ng-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
}
.ng-card {
  background: #151515; border: 1px solid #292929;
  border-radius: 14px; padding: 19px;
  min-width: 0;
}
.ng-card-label {
  color: #999; font-size: 12px; text-transform: uppercase;
  letter-spacing: .7px;
}
.ng-card-value { font-size: 27px; font-weight: 750; margin-top: 12px; }
.ng-card-note { color: #888; font-size: 12px; margin-top: 8px; }
.ng-icon { color: #ffd700; margin-bottom: 12px; }
.ng-panel-grid {
  display: grid; grid-template-columns: 1.5fr 1fr;
  gap: 15px;
}
.ng-chart { height: 290px; margin-top: 20px; }
.ng-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
.ng-table th, .ng-table td {
  text-align: left; padding: 12px 8px;
  border-bottom: 1px solid #303030; font-size: 13px;
}
.ng-table th { color: #999; font-weight: 500; }
.ng-table td { color: #eee; }
.ng-metric-bar {
  height: 6px; background: #333; border-radius: 10px;
  margin-top: 8px; overflow: hidden;
}
.ng-metric-fill { height: 100%; background: #ffd700; border-radius: 10px; }
.ng-confusion {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px; margin-top: 18px;
}
.ng-confusion-cell {
  padding: 18px 10px; text-align: center;
  background: #202020; border-radius: 10px;
}
.ng-confusion-number { font-size: 25px; font-weight: 750; margin-top: 8px; }
.ng-confusion-label { color: #aaa; font-size: 12px; }
.ng-button {
  border: 0; border-radius: 9px; padding: 11px 16px;
  background: #ffd700; color: #111; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center;
  justify-content: center; gap: 8px;
}
.ng-button:disabled { opacity: .5; cursor: not-allowed; }
.ng-button.secondary {
  color: #eee; background: #252525; border: 1px solid #444;
}
.ng-input-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin: 18px 0;
}
.ng-field label { display: block; color: #aaa; font-size: 12px; margin-bottom: 8px; }
.ng-field input {
  width: 100%; padding: 12px; border-radius: 8px;
  background: #090909; border: 1px solid #383838;
  color: white; outline: none;
}
.ng-result {
  margin-top: 18px; padding: 18px;
  background: #202020; border-radius: 12px;
}
.ng-warning {
  margin-top: 24px; padding: 15px;
  border: 1px solid #66551b; border-radius: 10px;
  background: #211c0b; color: #e5d28a;
  font-size: 12px; line-height: 1.7;
}
.ng-error { color: #ff8585; font-size: 13px; margin-top: 12px; }
.ng-muted { color: #999; font-size: 13px; }
.ng-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ng-recommendations { padding-left: 20px; color: #ddd; line-height: 1.8; }
.ng-risk-high { color: #ff7373; }
.ng-risk-medium { color: #ffd166; }
.ng-risk-low { color: #65d69a; }
@media(max-width: 900px) {
  .ng-grid { grid-template-columns: repeat(2, 1fr); }
  .ng-panel-grid { grid-template-columns: 1fr; }
}
@media(max-width: 600px) {
  .ng-dashboard { padding: 16px; }
  .ng-grid { grid-template-columns: 1fr 1fr; gap: 9px; }
  .ng-card { padding: 13px; }
  .ng-card-value { font-size: 21px; }
  .ng-input-grid { grid-template-columns: 1fr 1fr; }
  .ng-title { font-size: 20px; }
}
`;

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <div className="ng-card">
      <Icon className="ng-icon" size={22} />
      <div className="ng-card-label">{label}</div>
      <div className="ng-card-value">{value}</div>
      <div className="ng-card-note">{note}</div>
    </div>
  );
}

function App() {
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);

  const [sensor, setSensor] = useState({
    temperature: 95,
    vibration: 12,
    pressure: 20,
    rpm: 2800
  });

  async function loadDashboard() {
    try {
      const responses = await Promise.all([
        fetch(`${API}/api/metrics`),
        fetch(`${API}/api/summary`),
        fetch(`${API}/api/telemetry/history?limit=30`)
      ]);

      if (responses.some(response => !response.ok)) {
        throw new Error("Unable to retrieve dashboard information.");
      }

      const [metricData, summaryData, historyData] =
        await Promise.all(responses.map(response => response.json()));

      setMetrics(metricData);
      setSummary(summaryData);
      setHistory(historyData.reverse());
      setConnected(true);
      setError("");
    } catch (err) {
      setConnected(false);
      setError(err.message || "Backend connection failed.");
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

  async function simulateReading() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/simulate`, {
        method: "POST"
      });

      if (!response.ok) throw new Error("Simulation failed.");

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runPrediction(event) {
    event.preventDefault();
    setLoading(true);
    setPrediction(null);
    setError("");

    try {
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: Number(sensor.temperature),
          vibration: Number(sensor.vibration),
          pressure: Number(sensor.pressure),
          rpm: Number(sensor.rpm)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail?.[0]?.msg || "Prediction failed.");
      }

      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateSensor(event) {
    setSensor({
      ...sensor,
      [event.target.name]: event.target.value
    });
  }

  const metricItems = metrics ? [
    ["Accuracy", metrics.accuracy],
    ["Balanced accuracy", metrics.balanced_accuracy],
    ["Precision", metrics.precision],
    ["Recall", metrics.recall],
    ["F1 score", metrics.f1],
    ["ROC-AUC", metrics.roc_auc],
    ["PR-AUC", metrics.pr_auc]
  ] : [];

  const matrix = metrics?.confusion_matrix;

  // Give each chart point a unique reading number instead of a timestamp.
  const chartHistory = history.map((item, index) => ({
    ...item,
    reading_number: index + 1
  }));

  return (
    <>
      <style>{styles}</style>

      <main className="ng-dashboard">
        <header className="ng-header">
          <div className="ng-brand">
            <div className="ng-logo"><ShieldAlert size={25} /></div>
            <div>
              <div className="ng-title">NeuralGuard AI</div>
              <div className="ng-subtitle">
                AI-powered industrial predictive maintenance · FT-03
              </div>
            </div>
          </div>

          <div className="ng-status">
            <span className="ng-dot" />
            {connected ? "API Connected" : "API Disconnected"}
          </div>
        </header>

        {error && <div className="ng-error">{error}</div>}

        <div className="ng-actions">
          <button className="ng-button" onClick={simulateReading} disabled={loading}>
            <Zap size={16} />
            Generate sensor reading
          </button>

          <button className="ng-button secondary" onClick={loadDashboard}>
            <RefreshCw size={16} />
            Refresh dashboard
          </button>
        </div>

        <h2 className="ng-section-title">Equipment overview</h2>

        <section className="ng-grid">
          <MetricCard
            icon={Activity}
            label="Total readings"
            value={summary?.total_readings ?? "--"}
            note="Recorded sensor readings"
          />

          <MetricCard
            icon={AlertTriangle}
            label="High risk"
            value={summary?.high_risk ?? "--"}
            note="High model-estimated risk readings"
          />

          <MetricCard
            icon={Gauge}
            label="Medium risk"
            value={summary?.medium_risk ?? "--"}
            note="Moderate model-estimated risk readings"
          />

          <MetricCard
            icon={CheckCircle}
            label="Low risk"
            value={summary?.low_risk ?? "--"}
            note="Low model-estimated risk readings"
          />
        </section>

        <h2 className="ng-section-title">Model performance</h2>

        <section className="ng-grid">
          <MetricCard icon={Cpu} label="Accuracy"
            value={metrics ? percent(metrics.accuracy) : "--"}
            note="Overall correct predictions" />

          <MetricCard icon={Activity} label="Balanced accuracy"
            value={metrics ? percent(metrics.balanced_accuracy) : "--"}
            note="Average class accuracy" />

          <MetricCard icon={CheckCircle} label="Precision"
            value={metrics ? percent(metrics.precision) : "--"}
            note="Positive prediction correctness" />

          <MetricCard icon={AlertTriangle} label="Recall"
            value={metrics ? percent(metrics.recall) : "--"}
            note="Actual failures detected" />

          <MetricCard icon={Gauge} label="F1 score"
            value={metrics ? percent(metrics.f1) : "--"}
            note="Precision and recall balance" />

          <MetricCard icon={Activity} label="ROC-AUC"
            value={metrics ? percent(metrics.roc_auc) : "--"}
            note="Class discrimination" />

          <MetricCard icon={Activity} label="PR-AUC"
            value={metrics ? percent(metrics.pr_auc) : "--"}
            note="Precision-recall performance" />

          <MetricCard icon={Cpu} label="Brier score"
            value={metrics ? Number(metrics.brier_score).toFixed(4) : "--"}
            note="Lower probability error is better" />
        </section>

        <section className="ng-panel-grid" style={{ marginTop: 18 }}>
          <div className="ng-card">
            <h3>Failure risk trend</h3>
            <p className="ng-muted">Recent model-estimated failure scores</p>

            <div className="ng-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistory}>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="reading_number"
                    tickFormatter={value => `#${value}`}
                    interval="preserveStartEnd"
                    minTickGap={35}
                    stroke="#888"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={value => `${Math.round(value * 100)}%`}
                    stroke="#888"
                  />
                  <Tooltip
                    formatter={value => [percent(value), "Failure score"]}
                    labelFormatter={value => `Reading #${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="risk_score"
                    stroke="#ffd700"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ng-card">
            <h3>Confusion matrix</h3>
            <p className="ng-muted">
              Actual labels compared with model predictions
            </p>

            {matrix ? (
              <div className="ng-confusion">
                <div className="ng-confusion-cell">
                  <div className="ng-confusion-label">True negative</div>
                  <div className="ng-confusion-number">{matrix.true_negative}</div>
                </div>

                <div className="ng-confusion-cell">
                  <div className="ng-confusion-label">False positive</div>
                  <div className="ng-confusion-number">{matrix.false_positive}</div>
                </div>

                <div className="ng-confusion-cell">
                  <div className="ng-confusion-label">False negative</div>
                  <div className="ng-confusion-number">{matrix.false_negative}</div>
                </div>

                <div className="ng-confusion-cell">
                  <div className="ng-confusion-label">True positive</div>
                  <div className="ng-confusion-number">{matrix.true_positive}</div>
                </div>
              </div>
            ) : (
              <p className="ng-muted">Confusion matrix unavailable.</p>
            )}

            <p className="ng-card-note">
              False negatives are actual failures that the model missed.
            </p>
          </div>
        </section>

        <section className="ng-panel-grid" style={{ marginTop: 18 }}>
          <div className="ng-card">
            <h3>Evaluation details</h3>
            <p className="ng-muted">
              Model: {metrics?.model || "--"}
            </p>

            {metricItems.map(([label, value]) => (
              <div key={label} style={{ marginTop: 17 }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13
                }}>
                  <span>{label}</span>
                  <strong>{value == null ? "--" : percent(value)}</strong>
                </div>

                <div className="ng-metric-bar">
                  <div
                    className="ng-metric-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(value || 0) * 100))}%`
                    }}
                  />
                </div>
              </div>
            ))}

            <p className="ng-card-note">
              Training samples: {metrics?.train_samples ?? "--"} ·
              Test samples: {metrics?.test_samples ?? "--"}
            </p>
          </div>

          <div className="ng-card">
            <h3>Latest equipment reading</h3>

            {summary?.latest ? (
              <>
                <div className="ng-card-value">
                  {percent(summary.latest.risk_score)}
                </div>

                <div className={
                  summary.latest.risk_level === "HIGH"
                    ? "ng-risk-high"
                    : summary.latest.risk_level === "MEDIUM"
                    ? "ng-risk-medium"
                    : "ng-risk-low"
                }>
                  {summary.latest.risk_level} RISK
                </div>

                <table className="ng-table">
                  <tbody>
                    <tr><td>Temperature</td><td>{summary.latest.temperature} °C</td></tr>
                    <tr><td>Vibration</td><td>{summary.latest.vibration}</td></tr>
                    <tr><td>Pressure</td><td>{summary.latest.pressure}</td></tr>
                    <tr><td>RPM</td><td>{summary.latest.rpm}</td></tr>
                  </tbody>
                </table>
              </>
            ) : (
              <p className="ng-muted">Waiting for sensor readings...</p>
            )}
          </div>
        </section>

        <h2 className="ng-section-title">Manual equipment assessment</h2>

        <section className="ng-card">
          <p className="ng-muted">
            Enter sensor measurements to request a model prediction.
          </p>

          <form onSubmit={runPrediction}>
            <div className="ng-input-grid">
              <div className="ng-field">
                <label><Thermometer size={13} /> Temperature (°C)</label>
                <input
                  name="temperature"
                  type="number"
                  min="-20"
                  max="200"
                  step="any"
                  value={sensor.temperature}
                  onChange={updateSensor}
                  required
                />
              </div>

              <div className="ng-field">
                <label><Waves size={13} /> Vibration</label>
                <input
                  name="vibration"
                  type="number"
                  min="0"
                  max="50"
                  step="any"
                  value={sensor.vibration}
                  onChange={updateSensor}
                  required
                />
              </div>

              <div className="ng-field">
                <label>Pressure</label>
                <input
                  name="pressure"
                  type="number"
                  min="0"
                  max="200"
                  step="any"
                  value={sensor.pressure}
                  onChange={updateSensor}
                  required
                />
              </div>

              <div className="ng-field">
                <label>RPM</label>
                <input
                  name="rpm"
                  type="number"
                  min="0"
                  max="30000"
                  step="any"
                  value={sensor.rpm}
                  onChange={updateSensor}
                  required
                />
              </div>
            </div>

            <button className="ng-button" type="submit" disabled={loading}>
              <Activity size={16} />
              {loading ? "Analysing..." : "Analyse equipment"}
            </button>
          </form>

          {prediction && (
            <div className="ng-result">
              <h3>Prediction result</h3>

              <div className="ng-card-value">
                {percent(prediction.failure_probability)}
              </div>

              <div className={
                prediction.risk_level === "HIGH"
                  ? "ng-risk-high"
                  : prediction.risk_level === "MEDIUM"
                  ? "ng-risk-medium"
                  : "ng-risk-low"
              }>
                {prediction.risk_level} RISK
              </div>

              <p>
                Predicted class: <strong>{prediction.predicted_class}</strong>
              </p>

              <p>
                No-failure probability:{" "}
                <strong>{percent(prediction.no_failure_probability)}</strong>
              </p>

              <p className="ng-card-note">
                Prediction confidence: {percent(prediction.prediction_confidence)}
              </p>

              <h4>Recommendations</h4>

              <ul className="ng-recommendations">
                {prediction.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="ng-warning">
          <strong>Research demonstration only:</strong> This system currently
          uses synthetic training data and simulated sensor readings.
          Its model scores are not validated real-world equipment failure
          probabilities. The evaluation metrics describe performance on a
          synthetic holdout dataset. Do not use this prototype for safety-critical
          decisions or replace qualified equipment inspections with its output.
        </div>
      </main>
    </>
  );
}

export default App;