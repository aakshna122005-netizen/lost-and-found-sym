const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for the public demo to avoid Vercel preview URL mismatches
    if (!origin || process.env.FRONTEND_URL === '*' || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
  res.send("API RUNNING");
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Item Routes
const itemRoutes = require('./routes/items');
app.use('/api/items', itemRoutes);

// Match Routes
const matchRoutes = require('./routes/matches');
app.use('/api/matches', matchRoutes);

// Claim Routes
const claimRoutes = require('./routes/claims');
app.use('/api/claims', claimRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Image Access Routes
const imageRoutes = require('./routes/images');
app.use('/api/images', imageRoutes);

// Chat Routes
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Notification Routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ DATABASE CONNECTED (Localhost)');
    app.listen(PORT, () => {
      console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
    });
  } catch (err) {
    console.error('❌ DATABASE FAILURE:', err.message);
    app.listen(PORT, () => {
      console.log(`⚠️  SERVER STARTED (Port ${PORT})`);
    });
  }
};

startServer();
