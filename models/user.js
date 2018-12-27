const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const setting = require('../settings');
const url = 'mongodb://' +setting.host+ ':27017';

function User(user) {
    this.username = user.username;
    this.password = user.password;
};

module.exports = User;
User.prototype.save = function save(callback) {
    // 存入 Mongodb 的文档
    var user = {
        username: this.username,
        password: this.password,
    };
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        assert.equal(null, err);
        assert.ok(db != null);
        // 为  name 属性添加索引
        //collection.createIndex('name', { unique: true });
        // 写入 user 文档
        db.db(setting.db).collection('users').insertOne(user, function(err, r) {
            assert.equal(null, err);
            assert.equal(1, r.insertedCount);
            db.close();
            callback(err, user);
        });
    });
};
User.get = function get(username, callback) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        assert.equal(null, err);
        assert.ok(db != null);
        // 查找 name 属性为 username 的文档
        db.db(setting.db).collection('users').findOne({username: username}, function (err, doc) {
            db.close();
            if (doc) {
                callback(err, doc);
            } else {
                callback(err, null);
            }
        });
    });
};