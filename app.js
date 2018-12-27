// 加载依赖库，原来这个类库都封装在connect中，现在需地注单独加载
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const util = require('util');
const layouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');

// 加载路由控制
const router = require('./routes/index');
// 加载数据库的连接信息
const settings = require('./settings');
// 创建项目实例
const app = express();

// 定义EJS模板引擎和模板文件位置，也可以使用jade或其他模型引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride());
app.use(session({
  secret: settings.cookieSecret,
  store: new MongoStore({
    url: 'mongodb://localhost/' + settings.db,
    autoRemove: 'native' 
  })
}));

// 定义日志和输出级别
app.use(logger('dev'));
// 定义数据解析器
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 定义cookie解析器
app.use(cookieParser());
// 定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
// 定义模板文件
app.use(layouts);
app.use(flash());

//Express支持定义视图助手，本质其实就是给所有视图注册了全局变量，因此无需每次在调用模板引擎时传递数据对象
app.use(function(req, res, next){
  res.locals.inspect = function(obj) {
      return util.inspect(obj, true);
  };
  res.locals.headers = req.headers;
  res.locals.user = req.session.user;
  let error = req.flash('error');
  res.locals.error = error.length ? error : null;
  let success = req.flash('success');
  res.locals.success = success.length ? success : null;
  next();
});

// 匹配路径和路由
router(app);

// 404错误处理
app.use(function(req, res, next) {
  next(createError(404));
});

// 开发环境，500错误处理和错误堆栈跟踪
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
