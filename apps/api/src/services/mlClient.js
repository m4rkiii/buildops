const http = require('http');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function predictDelayRisk(payload) {
  try {
    const url = new URL('/predict/delay-risk', ML_SERVICE_URL);
    const bodyData = JSON.stringify(payload);

    return new Promise((resolve) => {
      const req = http.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData)
        },
        timeout: 3000
      }, (res) => {
        let rawData = '';
        res.on('data', chunk => { rawData += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(rawData);
              resolve(parsed);
            } catch (e) {
              resolve(getFallbackPrediction(payload));
            }
          } else {
            resolve(getFallbackPrediction(payload));
          }
        });
      });

      req.on('error', () => {
        resolve(getFallbackPrediction(payload));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(getFallbackPrediction(payload));
      });

      req.write(bodyData);
      req.end();
    });
  } catch (err) {
    return getFallbackPrediction(payload);
  }
}

function getFallbackPrediction(payload) {
  const delayDays = payload.current_delay_days || 0;
  const duration = payload.planned_duration_days || 365;
  const delayRatio = delayDays / Math.max(duration, 1);

  let prob = Math.min(Math.max(0.12 + (delayRatio * 1.4), 0.05), 0.95);
  prob = Math.round(prob * 10000) / 10000;

  let riskLevel = 'LOW';
  if (prob >= 0.65) riskLevel = 'HIGH';
  else if (prob >= 0.35) riskLevel = 'MEDIUM';

  return {
    delay_risk_prob: prob,
    risk_level: riskLevel,
    model_version: 'delay-xgb-v1.0.0-fallback',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  predictDelayRisk
};
