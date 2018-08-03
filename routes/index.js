var express = require('express');
var router = express.Router();
var crypto = require('crypto');//加载生成MD5值依赖模块
var User = require('../models/user.js');
var Post = require("../models/post.js");

/* GET home page. */

//首页
router.get('/', function (req, res) {
    //读取所有的用户微博
    Post.get(null, function (err, posts) {
        if (err) {
            posts = [];
        }
        res.render('index', {title: '首页', posts: posts});
    });
});

//用户首页
router.get('/u/:user', function (req, res) {//路由规则
    User.get(req.params.user, function (err, user) {
        //判断用户是否存在
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/');
        }
        //从数据库获取该用户的微博信息
        Post.get(user.name, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts
            });
        });
    });
});
//发表信息
router.post('/post', checkLogin);//页面权限控制
router.post('/post', function (req, res) {
    var currentUser = req.session.user;  //获取当前用户信息
        if(req.body.post == ""){  //发布信息不能为空
        req.flash('error', '内容不能为空！');
        return res.redirect('/u/' + currentUser.name);
    }
   var post = new Post(currentUser.name, req.body.post);//req.body.post获取用户发表的内容
    //保存到数据库
    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('sucess', '发表成功');
        res.redirect('/u/' + currentUser.name);
    });
});
//注册
router.get('/reg', checkNotLogin);//页面权限控制，注册功能只对未登录用户可用
router.get('/reg', function (req, res) {
    res.render('reg', {title: '用户注册'});
});
router.post('/reg', checkNotLogin);
router.post('/reg', function (req, res) {
    //用户名密码不能为空
    if (req.body.username == "" || req.body.userpwd == "" || req.body.pwdrepeat == "") {
        //使用req.body.username获取提交请求的用户名，username为input的name
        req.flash('error', "输入框不能为空！");//保存信息到error中，然后通过视图交互传递提示信息
        return res.redirect('/reg');
    }
    //两次输入密码如果不一致，提示信息
    if (req.body['pwdrepeat'] !== req.body['userpwd']) {
        req.flash("error", '两次输入密码不一致！');//保存信息到error中，用于界面显示提示信息
        return res.redirect('/reg');
    }
    //把密码转换为MD5值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.userpwd).digest('base64');

    //存储新注册用户
    var newUser = new User({
        name: req.body.username,
        password: password,
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
        if (user) {//用户名存在
            err = 'Username already exists.';
        }
        if (err) {
            req.flash('error', err);
            return res.redirect('/reg');
        }

        newUser.save(function (err) {//用户名不存在时，保存记录到数据库
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            req.session.user = newUser;//保存用户信息，用于判断用户是否已登录
            req.flash('success', req.session.user.name + '注册成功');
            res.redirect('/');
        });
    });
});
//登陆
router.get('/login', checkNotLogin);//登陆功能只对未登录用户可使用
router.get('/login', function (req, res) {
    res.render('login', {title: '用户登录'});
});
router.post('/login', checkNotLogin);
router.post('/login', function (req, res) {
//密码用md5值表示
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.userpwd).digest('base64');
    //判断用户名和密码是否存在和正确
    User.get(req.body.username, function (err, user) {
        if (!user) {
            req.flash('error', '用户名不存在');
            return res.redirect('/login');
        }
        if (user.password !== password) {
            req.flash('error', '用户密码不存在');
            return res.redirect('/login');
        }
        req.session.user = user;//保存用户信息
        req.flash('success', '登陆成功！');
        res.redirect('/');
    });
});
//退出
router.get('/logout', checkLogin);//退出功能只对已登陆的用户可用
router.get('/logout', function (req, res) {
    req.session.user = null;//清空session
    req.flash('sucess', '退出成功！');
    res.redirect('/');
});

router.post('/users', function (req, res) {
    console.log("admin refresh");
    res.send(200);
});
function checkNotLogin(req, res, next) {
    if (req.session.user)//用户存在
    {
        req.flash('error', '已登录');
        return res.redirect('/');
    }
    next();
}
function checkLogin(req, res, next) {
    if (!req.session.user) //用户不存在
    {   //未登录跳转到登陆界面
        req.flash('error', '未登录');
        return res.redirect('/login');
    }
    next();
}
module.exports = router;
