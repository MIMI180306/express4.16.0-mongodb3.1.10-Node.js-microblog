const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const setting = require('../settings');
const url = 'mongodb://' +setting.host+ ':27017';

function Post(username, post, time) {
    this.user = username;
    this.post = post;
    if (time) {
        this.time = time;
    } else {
        this.time = new Date();
    }
};
module.exports = Post;

Post.prototype.save = function save(callback) {
    // 存入 Mongodb 的文档
    var post = {
        user: this.user,
        post: this.post,
        time: this.time,
    };
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        assert.equal(null, err);
        assert.ok(db != null);
        // 读取 posts 集合
        db.db(setting.db).collection('posts').insertOne(post, function(err, r) {
            assert.equal(null, err);
            assert.equal(1, r.insertedCount);
            db.close();
            callback(err, post);
        });
    });
};

Post.get = function get(username, callback) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        assert.equal(null, err);
        assert.ok(db != null);
        // 读取 posts 集合
        let query = {};
        if (username) {
            query.user = username;
        }
        db.db(setting.db).collection('posts').find(query).sort({time: -1}).toArray(function(err, docs) {
            assert.equal(null, err);
            assert.ok(db != null);
            // 查找 user 属性为  username 的文档，如果 username 是 null 则匹配全部
            db.close();
            // 封装 posts 为  Post 对象
            let posts = [];
            docs.forEach(function (doc, index) {
                let post = new Post(doc.user, doc.post, doc.time);
                posts.push(post);
            });
            callback(null, posts);
        });
    });
};