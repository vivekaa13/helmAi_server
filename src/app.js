const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const voiceRoutes = require('./routes/voice');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/voice', voiceRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Helm AI Server API',
    version: '1.0.0',
    endpoints: [
      'POST /api/voice/prompt - Voice prompt processing'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at: http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});

module.exports = app;
