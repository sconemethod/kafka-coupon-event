import { Kafka } from "kafkajs";
import { pool } from "./database";


// Kafka 인스턴스 생성
const kafka = new Kafka({
  clientId: "coupon-consumer",
  brokers: ["localhost:9092"], // Kafka 브로커 주소
});

const consumer = kafka.consumer({ groupId: "coupon-group" });

const run = async () => {
  await consumer.connect();
  console.log("✅ Kafka Consumer 연결 완료");

  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const userId = message.key?.toString();
      const content = message.value?.toString();

      console.log(`📥 메시지 수신: ${userId} - ${content}`);

      if (userId) {
        await saveCoupon(userId);
      }
    },
  });
};

// ✅ MySQL에 쿠폰 지급 데이터 저장 (수정됨)
// 2️⃣ 함수에서 connection 사용
async function saveCoupon(userId: string) {
  try {
    const connection = await pool.getConnection(); // ✅ getConnection() 사용
    try {
      const [result] = await connection.execute("INSERT INTO coupons (user_id) VALUES (?)", [userId]); // ✅ execute() 사용
      console.log(`🎟️ 쿠폰 지급 완료: ${userId}, Result:`, result);
    } finally {
      connection.release(); // ✅ 반드시 release() 호출
    }
  } catch (error) {
    console.error("❌ 쿠폰 지급 실패:", error);
  }
}





run().catch(console.error);
