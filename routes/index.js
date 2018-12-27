const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user.js');
const Post = require('../models/post.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    //调用模板引擎，并将其产生的页面直接返回给客户端
    //第一个是模板的名称，即 views 目录下的模板文件名，不包含文件的扩展名；第二个参数是传递给模板的数据，用于模板翻译
    res.render('index', { title: 'Express', items: [2018, 'MIMI Lee', 'express', 'Node.js'] });
});

router.get('/hello', function (req, res, next) {
    res.send('The time is ' + new Date().toString());
});

//Express 还支持动态路径匹配模式；
//Express 支持 REST(表征状态转移) 风格的请求方式
//根据 REST 设计模式，这4种方法通常分别用于实现以下功能。
//  GET：获取
//  POST：新增
//  PUT：更新
//  DELETE：删除


//把所有的请求方式绑定到同一个响应函数
router.all('/user/:username', function (req, res, next) {
    console.log('all methods captured');
    //回调函数的第三个参数next ，通过调用next() ，会将路由控制权转移给后面的规则,可以让我们轻易地实现中间件，而且还能提高代码的复用程度
    next();
});

//Express 在处理路由规则时，会优先匹配先定义的路由规则，因此后面相同的规则被屏蔽
router.get('/user/:username', function (req, res) {
    res.send('user: ' + req.params.username);
});

// exports.index = function(req, res){
//   res.render('index', {title: 'Express'});
// }

// exports.user = function(req, res){
//   res.render('error', {message: 'Express', error: {status: '01', stack: 'over stack'}, layout: false});
// }

module.exports = function (app) {
    app.get('/', function (req, res) {
        Post.get(null, function (err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: ' 首页',
                posts: posts,
            });
        });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', { title: '用户注册' });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        //检验用户两次输入的口令是否一致
        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('error', ' 两次输入的口令不一致');
            return res.redirect('/reg');
        }
        //生成口令的散列值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');
        var newUser = new User({
            username: req.body.username,
            password: password,
        });
        //检查用户名是否已经存在
        User.get(newUser.username, function (err, user) {
            if (user)
                err = 'Username already exists.';
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            //如果不存在则新增用户
            newUser.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success', ' 注册成功');
                res.redirect('/');
            });
        });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', { title: '用户登入' });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        //生成口令的散列值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');
        User.get(req.body.username, function (err, user) {
            if (!user) {
                req.flash('error', ' 用户不存在');
                return res.redirect('/login');
            }
            if (user.password != password) {
                req.flash('error', ' 用户口令错误');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', ' 登入成功');
            res.redirect('/');
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', ' 登出成功');
        res.redirect('/');
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user;
        var post = new Post(currentUser.username, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', ' 发表成功');
            res.redirect('/u/' + currentUser.username);
        });
    });


    app.get('/u/:user', function (req, res) {
        User.get(req.params.user, function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (!user) {
                req.flash('error', ' 用户不存在');
                return res.redirect('/');
            }
            Post.get(user.username, function (err, posts) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.username,
                    posts: posts,
                });
            });
        });
    });
}

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', ' 未登入');
        return res.redirect('/login');
    }
    next();
}
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', ' 已登入');
        return res.redirect('/');
    }
    next();
}
