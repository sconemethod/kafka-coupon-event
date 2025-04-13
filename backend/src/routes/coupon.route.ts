import { Router } from 'express';
import { issueCoupon } from '../controllers/coupon.controller';
import { initializeCouponStock } from '../services/coupon.service';
import { logger } from '../configs/logger';

const router = Router();

// 서버 시작 시 쿠폰 수량 초기화
initializeCouponStock().catch(error => {
  logger.error('쿠폰 수량 초기화 실패:', error);
});

router.post('/issue', issueCoupon);

export default router; 