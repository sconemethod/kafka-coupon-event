// 📁 login.controller.ts
import { RequestHandler } from 'express';
import { kafkaService } from '../services/kafkaProducer.service';

export const loginHandler: RequestHandler = async (req, res) => {
  const { username } = req.body;
  const userId = `user-${username}`;

  /*
  res.cookie('userId', userId, {
    httpOnly: false,  // 프론트엔드에서 접근 가능하도록 설정
    sameSite: 'none', // CORS 요청 허용
    secure: true,     // HTTPS 필요
    path: '/',        // 모든 경로에서 접근 가능
    maxAge: 24 * 60 * 60 * 1000 // 24시간 유효
  });
  */
  res.cookie('userId', userId, {
    httpOnly: false,  // 프론트에서 접근 가능
    sameSite: 'lax',  // 로컬 개발 환경에선 lax 권장
    secure: false,    // ✅ 반드시 false로 변경!
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  });
  const avroPayload = {
    user_id: userId,
    username,
    email: `${username}@example.com`,
  };

  try {
    const schemaId = await kafkaService.getLatestSchemaId('user-login-value');

    const safeBuffer = await kafkaService.sendAvroMessage('user-login', userId, avroPayload, schemaId);
    console.log('📦 Final Buffer tag:', Object.prototype.toString.call(safeBuffer)); // ✅ '[object Buffer]'
    console.log('📦 Buffer hex:', safeBuffer.toString('hex')); // ✅ '00...' 로 시작해야 함
    
    res.status(200).json({ userId });
  } catch (error) {
    console.error('❌ Kafka Avro 메시지 전송 실패:', error);
    res.status(500).json({ error: 'Kafka 메시지 전송 실패' });
  }
}; 