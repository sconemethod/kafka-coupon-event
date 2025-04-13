#!/bin/sh
echo "🌸 [Init-Connector] 커넥터 등록을 시작할게요~ 기다려주세요! 🌸"

# Kafka Connect가 준비될 때까지 대기하기
until curl -s http://kafka-connect:8083/connectors; do
  echo "⏳ Kafka Connect 대기 중...";
  sleep 2;
done

echo "✨ Kafka Connect 준비 완료! 환경 변수 치환 중~ ✨"

# 템플릿 파일을 실제 JSON 파일로 변환 (envsubst 사용)
envsubst < /connectors/user-login-sink.template.json > /connectors/user-login-sink.json

echo "🔌 치환 완료! 이제 커넥터를 등록할게요~"

# 커넥터 등록하기
curl -X POST -H "Content-Type: application/json" --data @/connectors/user-login-sink.json http://kafka-connect:8083/connectors

echo "💖 모든 커넥터 등록 완료~! 즐겁게 사용하세요~"
