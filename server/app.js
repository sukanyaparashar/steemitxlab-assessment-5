const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const config = require('./config/config');
require('dotenv').config();

const users = require('./routes/users');
const auth = require('./routes/auth');
const common = require('./routes/common');
const property = require('./routes/property');
const email = require('./routes/email');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  };

  app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'uploads')));

  app.get('/', (req, res) => {
    res.status(200).send('Success');
  });

  app.use('/api/user', users);
  app.use('/api/auth', auth);
  app.use('/api/common', common);
  app.use('/api/property', property);
  app.use('/api/email', email);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

async function connectDatabase() {
  if (process.env.SKIP_DB === 'true') return;

  const mongoUri = process.env.MONGODB_URI || config.localDB;
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
}

async function startServer(port = process.env.PORT || 5001) {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { createApp, connectDatabase, startServer };
