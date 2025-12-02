const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// JSON 파싱 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 메인 페이지
app.get('/', (req, res) => {
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

// 음악재생 페이지 - 카드
app.get('/music', (req, res) => {
  res.render('src/music_card');
});

// 음악재생 페이지 - 리스트
app.get('/list', (req, res) => {
  res.render('src/music_list');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행 중`);
});