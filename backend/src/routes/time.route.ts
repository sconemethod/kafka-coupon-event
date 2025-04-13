// kafka-coupon/backend/src/routes/time.routes.ts
import { Router } from 'express';
import dayjs from 'dayjs';

const router = Router();

router.get('/now', (req, res) => {
  const now = dayjs().format(); // 서버 시간 ISO 형식
  res.json({ now });
});

export default router;
