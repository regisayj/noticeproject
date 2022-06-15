const fs = require('fs');
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const FileStore = require('session-file-store')(session); // 세션을 파일에 저장
const cookieParser = require('cookie-parser');
const res = require('express/lib/response');

// express 설정 1
const app = express();

// db 연결 2
const client = mysql.createConnection({

    user : 'root',
    password : 'Rladydgns(1',
    database : 'notice'

});

// 정적 파일 설정 (미들웨어) 3
app.use(express.static(path.join(__dirname,'/public')));

// ejs 설정 4
app.set('views', __dirname + '/views');
app.set('view engine','ejs');

// 정제 (미들웨어) 5
app.use(bodyParser.urlencoded({extended:false}));

// 세션 (미들웨어) 6
app.use(session({
    secret: 'blackzat', // 데이터를 암호화 하기 위해 필요한 옵션
    resave: false, // 요청이 왔을때 세션을 수정하지 않더라도 다시 저장소에 저장되도록
    saveUninitialized: true, // 세션이 필요하면 세션을 실행시칸다(서버에 부담을 줄이기 위해)
    store : new FileStore() // 세션이 데이터를 저장하는 곳
}));

app.listen(3005,()=>{
    console.log('3005 port running...');
});

app.get('/',(req,res)=>{
    console.log('メインページ起動');
    
    //로그인이 되있다면 name을 세션유지 시키는 코딩
    if(req.session.is_logined == true){
        res.render('index',{
            is_logined : req.session.is_logined,
            name : req.session.name
        });
    }else{
        res.render('index',{
            is_logined : false
        });
    }
    
});

app.get('/register',(req,res)=>{

    console.log('新規登録 ページ')
    res.render('register');

});

app.post('/register',(req,res)=>{

    console.log('新規登録中')
    const body = req.body;
    const id = body.id;
    const password = body.password;
    const name = body.name;
    const email = body.email;

    console.log(name);
    console.log(id);
    console.log(password);
    console.log(email);


    client.query('select * from notice.user where id=?',[id],(err,data) =>{
        if(data.length == 0){
            console.log('新規登録完了');
            client.query('insert into notice.user(name, id, password, email) values(?,?,?,?)',[
                name, id, password, email
            ]);

            res.redirect('/');

        } 
    })
})

app.get('/login',(req,res)=>{
    console.log('ログインページ');
    res.render('login');
});

app.post('/login',(req,res)=>{
    const body = req.body;
    const id = body.id;
    const password = body.password;
    const name = body.name;
    const email = body.email;

    client.query('select * from notice.user where id=?',[id],(err,data)=>{
        // 로그인 확인
        console.log("data[0]:"+data[0]);
        console.log("data[0].id:"+data[0].id);
        console.log("data[0].pw:"+data[0].password);
        console.log("data[0].name:"+data[0].name);
        console.log("data[0].email:"+data[0].email);

        if(id == data[0].id || password == data[0].password){
            console.log('ログイン成功');
            // 세션에 추가
            req.session.is_logined = true;
            req.session.name = data.name;
            req.session.id = data.id;
            req.session.password = data.password;
            req.session.email = data.email;

            req.session.save(function login(){ // 세션 스토어에 적용하는 작업
                res.render('index',{ // 정보전달
                    name : data[0].name,
                    id : data[0].id,
                    email : data[0].email,
                    is_logined : true
                });
            });

        }else{
            console.log('ログイン失敗');
            
            res.redirect('index');
        }
        
    });
    
});

app.get('/logout',(req,res)=>{
    console.log('ログアウト');
    req.session.destroy(function(err){
        // 세션 파괴후 할 것들
        res.redirect('/');
    });
});

//게시판 조회
app.get('/noticeview',(req,res)=>{
    
    console.log('掲示板表示');
    const body = req.body;
    const board_num = req.board_num;
    const title = body.title;
    const contents = body.contents;
    const name = body.name;

    console.log(name);

    client.query('select * from notice.insert where board_num',(err,data) =>{

        req.session.board_num = data.board_num;
        req.session.title = data.title;
        req.session.contents = data.contents;
        req.session.regdate = data.regdate;
        req.session.data = data;

        req.session.save(function (){ // 세션 스토어에 적용하는 작업
            res.render('noticeview',{ // 정보전달
                board_num : data.board_num,
                title : data.title,
                contents : data.contents,
                regdata : data.regdate,
                data : data
            });
            console.log(data);
            })
        })
    })

app.get('/write',(req,res)=>{
    console.log('掲示板作成ページ');
    console.log(req.get);
    res.render('write');
    
});

//게시글 작성
app.post('/insert',(req,res)=>{
    
    console.log('内容作成中')
    const body = req.body;
    const title = body.title;
    const contents = body.contents;
    const writer = body.writer;
    
    console.log(title);
    console.log(contents);
    console.log(writer);

    client.query('select * from notice.insert where title=?',[title],(err,data) =>{
        if(data.length == 0){
            console.log('作成完了');
            client.query('insert into notice.insert(title, contents, writer) values(?,?,?)',[
                title, contents, writer
            ]);

            res.redirect('/noticeview');

        } 
    })
})

app.get('/contentspage',(req,res)=>{

    console.log('内容物照会');

    const body = req.body;
    const board_num = req.board_num;
    const title = body.title;
    const contents = body.contents;
    const writer = body.writer;

    client.query('select * from notice.insert',(err,data) =>{

        req.session.board_num = data[0].board_num;
        req.session.title = data[0].title;
        req.session.contents = data[0].contents;
        req.session.writer = data[0].writer;
        req.session.regdate = data[0].regdate;
        req.session.data = data[0];
        console.log("req.sessiopn.data:"+req.session.title);
            
            req.session.save(function(){ // 세션 스토어에 적용하는 작업
                res.render('contentspage',{ // 정보전달
                    board_num : data[0].board_num,
                    title : data[0].title,
                    contents : data[0].contents,
                    writer : data[0].writer,
                    regdata : data[0].regdate,
                    data : data[0]
                });
            })     


        })
});

app.post('/update',(req,res)=>{

    console.log('内容修正中');
    const body = req.body;
    const board_num = body.board_num;
    const title = body.title;
    const contents = body.contents;

    console.log(title);
    console.log(contents);
    console.log(board_num);

    client.query('UPDATE notice.insert SET title=?, contents=? WHERE board_num = ?', [title, contents, board_num], function (error, results, fields) {


        if (error) throw error;

        console.log('修正完了')

      });

    res.redirect('/noticeview');

})





