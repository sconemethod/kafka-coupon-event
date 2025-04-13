// 📁 backend/src/controllers/coupon.controller.ts

import { Request, Response } from 'express';
import { logger } from '../configs/logger';
import { sendCouponMessage, tryIssueCoupon } from '../services/coupon.service';

export const issueCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.cookies?.userId || req.body?.userId;
    const { couponId } = req.body;

    logger.info('쿠폰 발급 요청 받음', { userId, couponId, body: req.body, origin: req.headers.origin });

    if (!userId || !couponId) {
      res.status(400).json({
        success: false,
        message: '사용자 ID와 쿠폰 ID는 필수입니다.',
        debug: { userId, couponId, body: req.body, cookies: req.cookies }
      });
      return;
    }

    // ✅ Atomic하게 수량 차감 + 중복 검사
    try {
      await tryIssueCoupon(userId);
    } catch (err: any) {
      const message = err.message || '쿠폰 발급 중 오류 발생';
      logger.warn('쿠폰 발급 실패', { message, userId, couponId });
      res.status(400).json({ success: false, message });
      return;
    }

    // Kafka 메시지 발행
    await sendCouponMessage(userId, couponId);

    logger.info('쿠폰 발급 요청 성공', { userId, couponId, origin: req.headers.origin });

    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.headers.origin) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
    }

    res.status(202).json({
      success: true,
      message: '쿠폰 발급이 요청되었습니다.',
      data: {
        userId,
        couponId,
        requestedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ 쿠폰 발급 처리 중 에러 발생', { error, origin: req.headers.origin, cookies: req.cookies });

    // ❗ 심각한 예외만 처리 (Lua에서는 롤백 필요 없음)
    res.status(500).json({
      success: false,
      message: '쿠폰 발급 처리 중 서버 오류가 발생했습니다.'
    });
  }
};
