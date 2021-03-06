
//获取微博和保存微博
var mongodb = require('./db');

function Post(username, post, time) {
    this.user = username;//用户名
    this.post = post;//发布内容
    if (time) {
        this.time = time;//发布时间
    }
    else {
        var now=new Date();
        this.time =now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate()+" "+now.getHours()+":"+now.getSeconds();
    }
}
module.exports = Post;
//保存新发布的微博到数据库
Post.prototype.save = function save(callback) {
    var post = {
        user: this.user,
        post: this.post,
        time: this.time
    };
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //添加索引
            collection.ensureIndex('user');
            //写入posts表中
            collection.insert(post, {safe: true}, function (err, post) {
                mongodb.close();
                callback(err, post);
            });
        });
    });
};
//获取全部或指定用户的微博记录
Post.get = function get(username, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查找user属性为username的微博记录，如果username为null则查找全部记录
            var query = {};
            if (username) {
                query.user = username;
            }
            //查找符合条件的记录，并按时间顺序排列
            collection.find(query).sort({time: -1}).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                var posts = [];
                docs.forEach(function (doc, index) {        
                    var post = new Post(doc.user, doc.post, doc.time);
                    posts.push(post);
                });
                callback(null, posts);
            });
        });
    });
};