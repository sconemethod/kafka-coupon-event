#!/bin/bash
cd /home/ubuntu/kafka-coupon/kafka-connect-plugins/kafka-connect-plugins
docker-compose down
docker-compose up -d

# Wait for Kafka Connect to be ready
echo "⌛ Kafka Connect 기다리는 중..."
sleep 15

# Check if connector already exists
EXISTS=$(curl -s http://localhost:8083/connectors | grep "mysql-sink-connector")
if [ -z "$EXISTS" ]; then
  echo "✅ 커넥터 등록 중..."
  curl -X POST http://localhost:8083/connectors \
    -H "Content-Type: application/json" \
    --data @register-mysql-sink.json
else
  echo "⚠️ 이미 커넥터가 등록되어 있음. 등록 생략함."
fi

