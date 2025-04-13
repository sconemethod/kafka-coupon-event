import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import couponRouter from './routes/coupon.route';
import timeRouter from './routes/time.route';
import historyRouter from './routes/history';
import { logger } from './configs/logger';
import { loginHandler } from './controllers/login.controller';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS 설정
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://3.39.86.157:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Routes
app.use('/api/coupons', couponRouter);
app.use('/api/time', timeRouter);
app.use('/api/history', historyRouter);
app.post('/api/login', loginHandler);

// Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('서버 에러', { error: err });
  res.status(500).json({ 
    success: false, 
    message: '서버 내부 오류가 발생했습니다.' 
  });
});

// Server Start
app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행중입니다.`);
});

export default app; 