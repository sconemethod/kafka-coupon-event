// 📁 kafka-coupon/backend/src/index.ts

import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express, { Application } from 'express';
import couponRouter from './routes/coupon.route';
import redisClient from './configs/redis.config';
import timeRouter from './routes/time.route';
import listEndpoints from 'express-list-endpoints';
import { Request, Response } from 'express';
import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import historyRouter from './routes/history';
import dotenv from 'dotenv';
import { loginHandler } from './controllers/login.controller';
dotenv.config();

const app: Application = express();
const PORT = 4000;

// 환경 변수에서 허용할 origin 목록 가져오기
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://3.39.86.157:3000',
  'http://3.39.86.157:3001',
  'http://3.39.86.157'
];

// 🔐 CORS 설정
app.use(cors({
  origin: function(origin, callback) {
    // origin이 없는 경우(같은 도메인) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 도메인인지 확인
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24시간
}));

// Cookie 설정
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());

// 🧾 요청 로그
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// 라우터 설정
app.use('/time', timeRouter);
app.use(historyRouter);
app.use('/coupon', couponRouter);
app.post('/login', loginHandler);

const routes = listEndpoints(app);
console.log('📍 등록된 라우터 목록:', routes);

// 🧠 Redis 연결 이벤트 핸들러
redisClient.on('connect', () => {
  console.log('🟢 Redis 연결됨');
});

// 🚀 서버 실행
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 백엔드 서버 실행 중: http://3.39.86.157:${PORT}`);
}); 