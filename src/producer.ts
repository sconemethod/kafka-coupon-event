import { Kafka } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';

const kafka = new Kafka({ clientId: 'coupon-service', brokers: ['localhost:9092'] });
const producer = kafka.producer();

// 🔧 Schema Registry 주소 설정
const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

const run = async () => {
  await producer.connect();

  // 📦 등록할 Avro 스키마 정의
  const schema = {
    type: 'record',
    name: 'Coupon',
    fields: [
      { name: 'couponId', type: 'string' },
      { name: 'userId', type: 'string' },
      { name: 'createdAt', type: 'string' },
    ]
  };

  // 📝 스키마 등록 후 id 반환
  const { id } = await registry.register({ type: SchemaType.AVRO, schema: JSON.stringify(schema) });

  // 📨 메시지 직렬화 (Avro + Schema ID 포함)
  const payload = { couponId: 'CPN-123', userId: 'user-456', createdAt: new Date().toISOString() };
  const encodedValue = await registry.encode(id, payload);

  // 🛫 Kafka로 메시지 전송
  await producer.send({
    topic: 'coupon-topic',
    messages: [{ value: encodedValue }]
  });

  console.log('✅ 메시지 전송 완료!');
  await producer.disconnect();
};

run().catch(console.error);
