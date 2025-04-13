# ✅ 0. Kafka Connect 기반 이미지
FROM confluentinc/cp-kafka-connect:7.5.0

# 🔑 1. 루트 권한으로 변경
USER root

# ✅ 2. JDBC Sink Connector 먼저 설치
RUN confluent-hub install --no-prompt confluentinc/kafka-connect-jdbc:10.7.4

# ✅ 3. MySQL 드라이버 설치 및 올바른 위치에 복사
RUN microdnf update -y && \
    microdnf install -y curl tar gzip && \
    curl -L https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-j-8.2.0.tar.gz -o /tmp/mysql-connector.tar.gz && \
    tar -xzf /tmp/mysql-connector.tar.gz -C /tmp && \
    cp /tmp/mysql-connector-j-8.2.0/mysql-connector-j-8.2.0.jar \
       /usr/share/confluent-hub-components/confluentinc-kafka-connect-jdbc/

# ✅ 4. 기본 USER로 복귀
USER appuser

