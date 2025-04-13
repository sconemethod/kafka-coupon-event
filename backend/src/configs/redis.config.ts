import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

// Redis 이벤트 핸들러
redisClient.on('error', (err: Error) => {
  console.error('❌ Redis 에러:', err);
});

redisClient.on('connect', () => {
  console.log('🟢 Redis 연결됨');
});

redisClient.on('ready', () => {
  console.log('✨ Redis 사용 준비 완료');
});

// 쿠폰 재고 관련 함수들
export async function initializeCouponStock(totalStock: number): Promise<void> {
  try {
    await redisClient.set('coupon_stock', totalStock.toString());
    console.log(`🎫 쿠폰 재고 초기화: ${totalStock}개`);
  } catch (error) {
    console.error('❌ 쿠폰 재고 초기화 실패:', error);
    throw error;
  }
}

export async function getCouponStock(): Promise<number> {
  try {
    const stock = await redisClient.get('coupon_stock');
    return stock ? parseInt(stock) : 0;
  } catch (error) {
    console.error('❌ 쿠폰 재고 조회 실패:', error);
    throw error;
  }
}

export async function deductCouponStock(): Promise<boolean> {
  try {
    // Lua 스크립트를 사용하여 원자적 연산 수행
    const script = `
      local stock = redis.call('get', 'coupon_stock')
      if stock and tonumber(stock) > 0 then
        return redis.call('decr', 'coupon_stock')
      end
      return -1
    `;
    
    const result = await redisClient.eval(script, 0) as number;
    return result >= 0;
  } catch (error) {
    console.error('❌ 쿠폰 재고 차감 실패:', error);
    throw error;
  }
}

// 초기화 함수
export async function initializeRedis(): Promise<void> {
  try {
    // Redis 연결 확인
    await redisClient.ping();
    
    // 초기 쿠폰 수량 설정
    const initialStock = parseInt(process.env.INITIAL_COUPON_STOCK || '100');
    await initializeCouponStock(initialStock);
    
    console.log('✅ Redis 초기화 완료');
  } catch (error) {
    console.error('❌ Redis 초기화 실패:', error);
    throw error;
  }
}

// 애플리케이션 종료 시 정리
process.on('SIGTERM', async () => {
  try {
    await redisClient.quit();
    console.log('🔌 Redis 연결 종료');
  } catch (error) {
    console.error('❌ Redis 연결 종료 실패:', error);
  }
});

export default redisClient; 