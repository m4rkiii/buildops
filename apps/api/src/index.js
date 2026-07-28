const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'buildops-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes (FR01)
app.use('/auth', authRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[BuildOps API] Server running on port ${PORT}`);
  });
}

module.exports = app;
