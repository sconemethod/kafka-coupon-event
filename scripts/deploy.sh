#!/bin/bash

echo "✅ CodeDeploy 스크립트 시작!"

APP_DIR="/home/ubuntu/kafka-coupon"

cd $APP_DIR

echo "📦 npm install 시작"
npm install

echo "🚫 앱 중단 (있다면)"
pm2 stop all || true

echo "🚀 앱 재시작"
pm2 start npm -- start

echo "🎉 배포 완료!"

