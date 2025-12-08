const jwt=require("jsonwebtoken");
require("dotenv").config();
const jwtSecret=process.env.JWT_SECRET;

const checkLogin = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
    id: decoded.id,  
    userID: decoded.userID,
    username: decoded.username
};
    next();
  } catch (error) {
    console.error('토큰 검증 실패:', error.message);
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

module.exports = checkLogin;