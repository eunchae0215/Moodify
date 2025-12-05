const express = require('express');
const dbConnect = require('./config/dbConnect');
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const path = require('path');
const app = express();
const PORT = 3000;

dbConnect();

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 쿠키 파서
app.use(cookieParser());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// method-override 미들웨어 등록(PUT, DELETE 처리) 
app.use(methodOverride("_method"));

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/", require("./routes/loginRoutes"));
app.use("/", require("./routes/mainRoutes"));
app.use("/", require("./routes/mypageRoutes")); 

app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

app.listen(PORT, () => {
  console.log(`서버 실행 중`);
});