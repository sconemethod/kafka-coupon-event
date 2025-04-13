// 📁 backend/src/services/coupon.service.ts

import redisClient from '../configs/redis.config';
import { producer } from '../configs/kafka.config';
import { SchemaRegistry } from '@kafkajs/schema-registry';

const registry = new SchemaRegistry({ host: process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081' });

interface CouponIssuePayload {
  user_id: string;
  coupon_id: string;
  issued_at: string;
}

// Redis + Lua 스크립트 기반 중복 검사 + 재고 차감 (Atomic)
export async function tryIssueCoupon(userId: string): Promise<boolean> {
  const luaScript = `
    local stock_key = KEYS[1]
    local issued_users_key = KEYS[2]
    local user_id = ARGV[1]

    if redis.call("SISMEMBER", issued_users_key, user_id) == 1 then
      return -1
    end

    local stock = tonumber(redis.call("GET", stock_key))
    if not stock or stock <= 0 then
      return -2
    end

    redis.call("DECR", stock_key)
    redis.call("SADD", issued_users_key, user_id)

    return 1
  `;

  const result = await redisClient.eval(luaScript, {
    keys: ['coupon_stock', 'issued_users'],
    arguments: [userId],
  });

  if (result === -1) throw new Error('이미 발급된 유저입니다 💥');
  if (result === -2) throw new Error('쿠폰이 모두 소진되었습니다 😭');
  return true;
}

// Kafka 메시지 전송 (변경 없음)
export async function sendCouponMessage(userId: string, couponId: string): Promise<void> {
  const avroPayload: CouponIssuePayload = {
    user_id: userId,
    coupon_id: couponId,
    issued_at: new Date().toISOString()
  };

  const schemaId = 1;
  const encoded = await registry.encode(schemaId, avroPayload);

  await producer.send({
    topic: 'coupon-issue',
    messages: [{ key: userId, value: encoded }]
  });
}
