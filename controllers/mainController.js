const asyncHandler = require("express-async-handler");

//@desc Get index page
//@route GET /index
const getIndex = (req, res) => {
    res.render("src/index");
};

//@desc Get music page
//@route GET /music
const getMusic = asyncHandler(async (req, res) => {
    res.render("src/music_card", {
        username: req.user.username
    });
});

//@desc Get music list page
//@route GET /musiclist
const getMusicList = asyncHandler(async (req, res) => {
    const mood = req.query.mood || 'happy';
    
    // 나중에 DB에서 해당 감정의 음악 리스트 가져오기
    // const musicList = await getMusicByMood(mood);
    
    res.render("src/favorites_music", {
        mood: mood,
        username: req.user.username
        // musicList: musicList  // DB 연결 후 추가
    });
});

module.exports = {
    getIndex,
    getMusic,
    getMusicList
};