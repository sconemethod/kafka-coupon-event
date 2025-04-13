# ✅ 파일 경로: kafka-coupon/backend/wait-for-schema.sh

#!/bin/bash

set -e

HOST=$1
PORT=$2

until curl -s "http://$HOST:$PORT" > /dev/null; do
  echo "⏳ Waiting for $HOST:$PORT..."
  sleep 2
done

echo "✅ $HOST:$PORT is available!"