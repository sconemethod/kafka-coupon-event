import mysql from "mysql2/promise";  // ✅ 반드시 "mysql2/promise"로 가져오기

export const pool = mysql.createPool({
//  host: "172.17.0.2",  // ✅ localhost 대신 변경
  host: "localhost",  // ✅ localhost 대신 변경
  user: "root",
  password: "05070604",
  database: "coupon_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL 연결 성공!", connection); // ✅ 객체 출력해서 확인
    connection.release();
  } catch (error) {
    console.error("❌ MySQL 연결 실패:", error);
  }
}

testConnection();
