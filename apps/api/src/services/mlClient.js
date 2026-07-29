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
              resolve(getFallbackDelayPrediction(payload));
            }
          } else {
            resolve(getFallbackDelayPrediction(payload));
          }
        });
      });

      req.on('error', () => {
        resolve(getFallbackDelayPrediction(payload));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(getFallbackDelayPrediction(payload));
      });

      req.write(bodyData);
      req.end();
    });
  } catch (err) {
    return getFallbackDelayPrediction(payload);
  }
}

async function predictCostOverrun(payload) {
  try {
    const url = new URL('/predict/cost-overrun', ML_SERVICE_URL);
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
              resolve(getFallbackCostPrediction(payload));
            }
          } else {
            resolve(getFallbackCostPrediction(payload));
          }
        });
      });

      req.on('error', () => {
        resolve(getFallbackCostPrediction(payload));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(getFallbackCostPrediction(payload));
      });

      req.write(bodyData);
      req.end();
    });
  } catch (err) {
    return getFallbackCostPrediction(payload);
  }
}

async function generateAIDigest(payload) {
  try {
    const url = new URL('/predict/ai-digest', ML_SERVICE_URL);
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
              resolve(getFallbackDigest(payload));
            }
          } else {
            resolve(getFallbackDigest(payload));
          }
        });
      });

      req.on('error', () => {
        resolve(getFallbackDigest(payload));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(getFallbackDigest(payload));
      });

      req.write(bodyData);
      req.end();
    });
  } catch (err) {
    return getFallbackDigest(payload);
  }
}

function getFallbackDelayPrediction(payload) {
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

function getFallbackCostPrediction(payload) {
  const delayDays = payload.current_delay_days || 0;
  const duration = payload.planned_duration_days || 365;
  const budget = payload.budget_ksh || 10000000.0;
  const delayRatio = delayDays / Math.max(duration, 1);

  let costOverrunPct = delayDays > 0 ? Math.round((12.5 + (delayRatio * 25.0)) * 100) / 100 : 1.25;
  const estimatedOverrunKsh = Math.round(budget * (costOverrunPct / 100.0) * 100) / 100;

  return {
    cost_overrun_pct: costOverrunPct,
    estimated_overrun_ksh: estimatedOverrunKsh,
    model_version: 'cost-lgbm-v1.0.0-fallback',
    timestamp: new Date().toISOString()
  };
}

function getFallbackDigest(payload) {
  const pName = payload.project_name || 'Construction Project';
  const pType = payload.project_type || 'Commercial';
  const county = payload.county || 'Nairobi';
  const budget = payload.budget_ksh || 10000000.0;
  const delayDays = payload.current_delay_days || 0;
  const costPct = payload.cost_overrun_pct || 2.5;

  return {
    executive_summary: `Project '${pName}' (${pType}, ${county}) with valuation KSh ${budget.toLocaleString()} maintains active progress tracking.`,
    schedule_variance_analysis: delayDays > 0 ? `Project exhibits schedule delay of ${delayDays} days.` : 'Schedule remains on track.',
    financial_overrun_forecast: `Projected cost overrun is estimated at +${costPct}%.`,
    key_risk_drivers: [delayDays > 0 ? `Schedule slippage of ${delayDays} days.` : 'Initial stage milestone lead times.'],
    recommended_mitigations: ['Accelerate critical path milestone delivery', 'Maintain strict cost control audits.'],
    model_version: 'digest-nlp-v1.0.0-fallback',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  predictDelayRisk,
  predictCostOverrun,
  generateAIDigest
};
