const asyncHandler=require("express-async-handler");
const User=require("../models/User");
const bcrypt = require("bcrypt");
const jwt=require("jsonwebtoken");
const jwtSecret=process.env.JWT_SECRET;

//@desc Get login page
//@route GET /
const getlogin = (req, res)=>{
    res.render("src/login");
};

const loginUser=asyncHandler(async(req,res)=>{
    const{userID, password}=req.body;
    const user=await User.findOne({userID});
    if(!user){
        return res.status(401).json({message:"일치하는 사용자가 없습니다."});
    }
    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(401).json({message:"비밀번호가 일치하지 않습니다"});
    }
    const token=jwt.sign({
        userID: user.userID,
        username: user.username,
    }, jwtSecret);
    res.cookie("token",token,{httpOnly:true});
    res.status(200).json({redirectUrl:"/music"});
});

//@route GET /register
const getRegister = (req, res)=>{
    res.render("src/signup");
};

//@route POST /register
const registerUser = asyncHandler(async (req, res) => {
  const { username, userID, password, password2 } = req.body;
  if (password === password2) {
    // bcrypt를 사용해서 비밀번호를 암호화합니다.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 이름, 아이디와 암호화된 비밀번호를 사용해서 새 사용자를 만듭니다.
    const user = await User.create({ username, userID, password: hashedPassword });

    // 성공 메시지를 출력합니다.
    res.status(201).json({ message: "Register successful", user });
    
    // 로그인 페이지로 리다이렉트
    res.status(201).redirect("/");

  } else {
    res.send("Register Failed");
  }
});

const checkUserID = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  if (!userID) {
    return res.status(400).json({ message: "아이디를 입력해주세요" });
  }
  const user = await User.findOne({ userID });
  if (user) {
    return res.status(409).json({ message: "이미 사용 중인 아이디입니다" });
  }
  res.status(200).json({ message: "사용 가능한 아이디입니다" });
});

const logout=(req,res)=>{
  res.clearCookie("token");
  res.status(201).json({redirectUrl:"/login"});
};

module.exports = {getRegister, registerUser, getlogin, loginUser, checkUserID, logout};

