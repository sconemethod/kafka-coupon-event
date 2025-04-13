import { Kafka, Partitioners } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const kafkaBrokers = process.env.KAFKA_BROKERS || 'kafka:9092';
const schemaRegistryUrl = process.env.SCHEMA_REGISTRY_URL || 'http://schema-registry:8081';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'coupon-service',
  brokers: kafkaBrokers.split(','),
});

const registry = new SchemaRegistry({ host: schemaRegistryUrl });

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

// Avro 스키마 로드
const couponSchema = JSON.parse(
  readFileSync(join(__dirname, '../../init-schema/coupon-issue.avsc'), 'utf-8')
);

let schemaId: number;

// Avro 메시지 전송
export async function sendAvroCouponMessage(topic: string, payload: any): Promise<void> {
  try {
    if (!schemaId) {
      const { id } = await registry.register(couponSchema);
      schemaId = id;
    }

    const encodedValue = await registry.encode(schemaId, payload);
    
    await producer.send({
      topic,
      messages: [{ value: encodedValue }]
    });

    console.log('💌 쿠폰 발급 메시지 전송 완료');
  } catch (error) {
    console.error('❌ 메시지 전송 실패:', error);
    throw error;
  }
}

// Kafka 연결
(async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka producer 연결 완료');
  } catch (err) {
    console.error('❌ Kafka producer 연결 실패:', err);
  }
})();

// 종료 시 정리
process.on('SIGTERM', async () => {
  try {
    await producer.disconnect();
    console.log('🔌 Kafka producer 연결 종료');
  } catch (error) {
    console.error('❌ Kafka producer 연결 종료 실패:', error);
  }
});

export { producer };
