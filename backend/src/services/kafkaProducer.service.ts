// 📁 kafkaProducer.service.ts
import { Kafka, Producer } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import avro from 'avsc';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'coupon-service';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'coupon-issue';
const SCHEMA_REGISTRY_URL = process.env.SCHEMA_REGISTRY_URL || 'http://schema-registry:8081';

// Avro 스키마 정의
const couponIssueSchema = {
  type: 'record',
  name: 'CouponIssue',
  namespace: 'com.coupon.avro',
  fields: [
    { name: 'user_id', type: 'string' },
    { name: 'coupon_id', type: 'int' },
    { name: 'issued_at', type: 'string' }
  ]
};

class KafkaService {
  private producer: Producer;
  private registry: SchemaRegistry;
  private isConnected: boolean = false;
  private static instance: KafkaService;

  private constructor() {
    const kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS,
    });

    this.producer = kafka.producer();
    this.registry = new SchemaRegistry({ host: SCHEMA_REGISTRY_URL });
  }

  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        console.log('✅ Kafka producer connected successfully');
      } catch (error) {
        console.error('❌ Kafka producer connection failed:', error);
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log('✅ Kafka producer disconnected successfully');
      } catch (error) {
        console.error('❌ Kafka producer disconnection failed:', error);
        throw error;
      }
    }
  }

  public async sendMessage(userId: string, couponId: number): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Avro 형식의 메시지 페이로드
      const messagePayload = {
        user_id: userId,
        coupon_id: couponId,
        issued_at: new Date().toISOString()
      };

      // 스키마 ID 가져오기 (없으면 등록)
      let schemaId: number;
      try {
        schemaId = await this.getLatestSchemaId('coupon-issue-value');
      } catch (error) {
        // 스키마가 없으면 등록
        const { id } = await this.registry.register(
          { type: SchemaType.AVRO, schema: JSON.stringify(couponIssueSchema) },
          { subject: 'coupon-issue-value' }
        );
        schemaId = id;
      }

      // Confluent Wire Format으로 메시지 인코딩
      const encodedMessage = await this.registry.encode(schemaId, messagePayload);

      await this.producer.send({
        topic: KAFKA_TOPIC,
        messages: [
          {
            value: encodedMessage,  // 이미 매직 바이트와 스키마 ID가 포함된 인코딩된 메시지
            key: userId,
          },
        ],
      });

      console.log('✅ Avro Kafka message sent successfully:', messagePayload);
    } catch (error) {
      console.error('❌ Failed to send Avro Kafka message:', error);
      throw error;
    }
  }

  public async sendAvroMessage(topic: string, key: string, payload: object, schemaId: number): Promise<Buffer> {
    await this.connect();

    const encodedMessage = await this.registry.encode(schemaId, payload);

    await this.producer.send({
      topic,
      messages: [{ key, value: encodedMessage }],
    });

    console.log(`📦 Avro Kafka 메시지 전송 완료 (topic=${topic})`, payload);
    return encodedMessage;
  }

  public async getLatestSchemaId(subject: string): Promise<number> {
    return await this.registry.getLatestSchemaId(subject);
  }
}

export const kafkaService = KafkaService.getInstance();

process.on('SIGTERM', async () => {
  await kafkaService.disconnect();
});

export const sendCouponMessage = async (userId: string, couponId: number): Promise<void> => {
  await kafkaService.sendMessage(userId, couponId);
};
