"use strict"; // 엄격 모드 / 디버깅이 쉬워지고 발생 가능한 에러들을 예방한다.

const express = require("express");
const router = express.Router();

router.get("/", function(request,response){
  response.render("home/index");
});

router.get("/login", function(request, response){
  response.render("home/login");
});

module.exports = router;