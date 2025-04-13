// kafka-coupon/frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://3.39.86.157:4000';
// 이벤트 시작 시간을 현재 시간으로 설정
const EVENT_START_TIME = new Date().toISOString(); // 현재 시간부터 시작

console.log('현재 이벤트 시작 시간:', EVENT_START_TIME);
console.log('현재 시간:', new Date().toISOString());

// CORS 설정
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [isStarted, setIsStarted] = useState(false);         
  const [isEnded, setIsEnded] = useState(false);             
  const [isLoading, setIsLoading] = useState(false);         
  const [userId, setUserId] = useState<string | null>(null); 
  const [usernameInput, setUsernameInput] = useState('');
  const [serverTimeChecked, setServerTimeChecked] = useState(false); 
  const [history, setHistory] = useState<{ coupon_code: string; issued_at: string }[]>([]); // ✅ 발급 이력 상태 추가

  // 쿠키에서 userId 읽기
  useEffect(() => {
    const getUserIdFromCookie = () => {
      const cookies = document.cookie.split(';');
      const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
      if (userIdCookie) {
        return userIdCookie.split('=')[1];
      }
      return null;
    };

    const savedUserId = getUserIdFromCookie();
    if (savedUserId) {
      setUserId(savedUserId);
      console.log('Loaded userId from cookie:', savedUserId);
    }
  }, []);

  // ⏰ 이벤트 시작 여부 판단
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/time/now`);
        const serverNow = dayjs((res.data as { now: string }).now);
        const eventTime = dayjs(EVENT_START_TIME);

        setIsStarted(serverNow.isAfter(eventTime));
        setServerTimeChecked(true);
      } catch (err) {
        console.error('❌ 서버 시간 불러오기 실패:', err);
      }
    };

    fetchServerTime();
    const interval = setInterval(fetchServerTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ 로그인 후 이력 불러오기
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/coupon/history`);
        setHistory((res.data as { history: { coupon_code: string; issued_at: string }[] }).history);
      } catch (err) {
        console.error('이력 불러오기 실패:', err);
      }
    };
    if (userId) fetchHistory();
  }, [userId]);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { username: usernameInput });
      const newUserId = (res.data as { userId: string }).userId;
      setUserId(newUserId);
      console.log('Login successful, userId:', newUserId);
      
      // 쿠키 설정 확인
      console.log('Current cookies:', document.cookie);
    } catch (err) {
      console.error('로그인 실패:', err);
      alert('로그인에 실패했어요 💦');
    }
  };

  const handleClick = async () => {
    if (!isStarted || isEnded || isLoading || !userId) return;

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/coupon/issue`, {
        userId,
        couponId: 1,
        issuedAt: new Date().toISOString()
      });

      const msg = (res.data as { message: string }).message;

      if (msg.includes('소진')) {
        setIsEnded(true);
        alert('❌ 쿠폰이 모두 소진되었어요!');
      } else if (msg.includes('이미')) {
        setIsEnded(true);
        alert('📌 이미 발급받은 유저예요!');
      } else {
        alert('🎉 쿠폰 발급 성공!');
      }
    } catch (err: any) {
      console.error('요청 실패:', err);
      if (err?.response?.status === 403) {
        alert('🚫 이벤트 시간이 아니에요!');
      } else {
        alert('😢 오류가 발생했어요');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>🎯 선착순 쿠폰 이벤트</h1>

      {!userId && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="이름을 입력하세요 ☁️"
            style={{
              padding: '0.5em',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginRight: '0.5em'
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              backgroundColor: '#FFC0CB',
              color: '#fff',
              padding: '0.5em 1em',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            로그인 💡
          </button>
        </div>
      )}

      <p>👤 사용자 ID: {userId || '로그인 필요'}</p>

      <button
        onClick={handleClick}
        disabled={!isStarted || isEnded || isLoading || !userId || !serverTimeChecked}
        style={{
          backgroundColor: !isStarted || isEnded || !userId ? '#ccc' : '#4CAF50',
          color: 'white',
          padding: '1em 2em',
          fontSize: '1.2rem',
          border: 'none',
          borderRadius: '10px',
          cursor: !isStarted || isEnded || !userId ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease',
        }}
      >
        {(() => {
          if (!serverTimeChecked) return '🌀 시간 확인 중...';
          if (!userId) return '👤 로그인 먼저 해주세요!';
          if (!isStarted) return '⏳ 이벤트 대기 중...';
          if (isEnded) return '❌ 이벤트 종료';
          if (isLoading) return '⏳ 요청 중...';
          return '🎁 쿠폰 받기!';
        })()}
      </button>

      {/* ✅ 발급 이력 표시 */}
      {history.length > 0 && (
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          <h3>📜 발급 내역</h3>
          <ul>
            {history.map((item, idx) => (
              <li key={idx}>
                ✅ <strong>{item.coupon_code}</strong> | 🕒 {dayjs(item.issued_at).format('YYYY-MM-DD HH:mm:ss')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
