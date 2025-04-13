import { Router, RequestHandler } from 'express';
import db from '../configs/db'; // ✅ 이 줄이 중요해요! db 커넥션 import

const router = Router();

const historyHandler: RequestHandler = async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    res.status(401).json({ message: '로그인 필요' });
    return;
  }

  try {
    const [rows] = await db.query(
      `
      SELECT c.coupon_code, cu.issued_at
      FROM coupon_user cu
      JOIN coupons c ON cu.coupon_id = c.coupon_id
      WHERE cu.user_id = ?
      ORDER BY cu.issued_at DESC
      `,
      [userId]
    );

    res.json({ history: rows });
  } catch (err) {
    console.error('🧼 발급 이력 조회 실패:', err);
    res.status(500).json({ message: '서버 오류 발생 😢' });
  }
};

router.get('/coupon/history', historyHandler);

export default router;
