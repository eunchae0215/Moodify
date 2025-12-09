const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const jwtSecret = process.env.JWT_SECRET;

// 인증 필수 미들웨어
const requireAuth = asyncHandler(async (req, res, next) => {
  // 1. 쿠키에서 토큰 추출
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다.",
    });
  }

  try {
    // 2. 토큰 검증
    const decoded = jwt.verify(token, jwtSecret);

    // 3. req에 사용자 정보 저장 
    req.user = {
      id: decoded.id,
      userID: decoded.userID,
      username: decoded.username,
    };

    // 편의를 위해 개별 속성도 설정
    req.userId = decoded.id;
    req.userID = decoded.userID;
    req.username = decoded.username;

    console.log(`[Auth API] 인증 성공: ${req.username} (${req.userId})`);

    next();
  } catch (error) {
    console.error("[Auth API] 토큰 검증 실패:", error.message);

    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
});

// 선택적 인증 미들웨어
const optionalAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      id: decoded.id,
      userID: decoded.userID,
      username: decoded.username,
    };
    req.userId = decoded.id;
    req.userID = decoded.userID;
    req.username = decoded.username;
  } catch (error) {
    console.log("[Auth API] 토큰 검증 실패 (선택적 인증)");
  }

  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
};