# ✅ 파일 경로: kafka-coupon/backend/Dockerfile

FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 🧪 스키마 레지스트리 기다리는 쉘 스크립트 복사
COPY wait-for-schema.sh /app/wait-for-schema.sh
RUN chmod +x /app/wait-for-schema.sh

EXPOSE 4000

# ⏱️ schema-registry 준비되면 백엔드 실행
CMD ["/bin/bash", "-c", "/app/wait-for-schema.sh schema-registry 8081 && npx ts-node src/index.ts"]
