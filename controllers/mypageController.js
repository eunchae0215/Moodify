const asyncHandler = require("express-async-handler");

//@desc Get mypage
//@route GET /mypage
const getMypage = asyncHandler(async (req, res) => {
    res.render("src/mypage", {
        username: req.user.username,
        userID: req.user.userID
    });
});

//@desc Get info page
//@route GET /info
const getInfo = asyncHandler(async (req, res) => {
    res.render("src/info", {
        username: req.user.username,
        userID: req.user.userID
    });
});

//@desc Get history page
//@route GET /history
const getHistory = asyncHandler(async (req, res) => {
    res.render("src/history", {
        username: req.user.username
    });
});

//@desc Get favorites page
//@route GET /favorites
const getFavorites = asyncHandler(async (req, res) => {
    res.render("src/favorites", {
        username: req.user.username
    });
});

//@desc Get settings page
//@route GET /settings
const getSettings = asyncHandler(async (req, res) => {
    res.render("src/settings", {
        username: req.user.username
    });
});

//@desc Get QnA page
//@route GET /qna
const getQna = asyncHandler(async (req, res) => {
    res.render("src/qna", {
        username: req.user.username
    });
});

module.exports = {
    getMypage,
    getInfo,
    getHistory,
    getFavorites,
    getSettings,
    getQna
};