const express = require('express');
const dbConnect = require('./config/dbConnect');
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const { spawn } = require('child_process');
require("dotenv").config();

const path = require('path');
const app = express();
const PORT = 3000;

// Python 추천 서버 프로세스
let pythonProcess = null;

// Python 추천 서버 시작
function startPythonServer() {
  console.log('='.repeat(60));
  console.log('='.repeat(60));

  const pythonScriptPath = path.join(__dirname, 'utils', 'recommendation_service.py');

  // Python 프로세스 실행
  pythonProcess = spawn('python', [pythonScriptPath]);

  // Python 서버 출력 (stdout)
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python Server] ${data.toString().trim()}`);
  });

  // Python 서버 에러 (stderr)
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Server Error] ${data.toString().trim()}`);
  });

  // Python 서버 종료
  pythonProcess.on('close', (code) => {
    pythonProcess = null;
  });
}

// Python 서버 중지
function stopPythonServer() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Node.js 종료 시 Python 서버도 종료
process.on('SIGINT', () => {
  stopPythonServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopPythonServer();
  process.exit(0);
});

// Python 서버 시작
startPythonServer();

dbConnect();

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// JSON 파싱 미들웨어
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 쿠키 파서
app.use(cookieParser());

// method-override 미들웨어 등록
app.use(methodOverride("_method"));

app.use("/", require("./routes/loginRoutes"));
app.use("/", require("./routes/mainRoutes"));
app.use("/", require("./routes/mypageRoutes"));

app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

app.listen(PORT, () => {
  console.log(`서버 실행 중`);
});