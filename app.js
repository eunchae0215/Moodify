const express = require('express');
const dbConnect=require('./config/dbConnect');

const path = require('path');
const app = express();
const PORT = 3000;

dbConnect();

// JSON 파싱 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 메인 페이지
app.get('/index', (req, res) => {
  res.render('src/index');
});

// 로그인 페이지
app.get('/login', (req, res) => {
  res.render('src/login');
});

// 회원가입 페이지
app.get('/signup', (req, res) => {
  res.render('src/signup');
});

// 음악재생 페이지
app.get('/music', (req, res) => {
  res.render('src/music_card');
});

// 마이페이지
app.get('/mypage', (req, res) => {
  res.render('src/mypage');
});

// 내정보수정
app.get('/info', (req, res) => {
  res.render('src/info');
});

// 히스토리
app.get('/history', (req, res) => {
  res.render('src/history');
});

// 저장한 음악
app.get('/favorites', (req, res) => {
  res.render('src/favorites');
});

app.get('/musiclist', (req, res) => {
  const mood = req.query.mood || 'happy';
  
  // 나중에 DB에서 해당 감정의 음악 리스트 가져오기
  // const musicList = await getMusicByMood(mood);
  
  res.render('src/favorites_music', {
    mood: mood
    // musicList: musicList  // DB 연결 후 추가
  });
});

// 설정
app.get('/settings', (req, res) => {
  res.render('src/settings');
});

// q&A
app.get('/qna', (req, res) => {
  res.render('src/qna');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행 중`);
});