import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import progressRoutes from './routes/progress';
import subscriptionRoutes from './routes/subscription';
import referralRoutes from './routes/referral';
import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    // eslint-disable-next-line no-undef
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    // eslint-disable-next-line no-undef
    console.log(`📡 Frontend origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
