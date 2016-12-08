## gulp-upload-manifest
如果你有自己的资源上传接口，开发前端页面的时候最终需要引用上传之后的资源(如：cdn)，上传并替换资源的工作可以通过该插件完成
## 安装
```bash
npm install gulp-upload-manifest
```
## 使用
假设你有上传文件的接口如下：
```bash
Request URL:http://mysite.com/upload
Request Method:POST

Content-Type:multipart/form-data

## 接口需要prefix字段
Content-Disposition: form-data; name="prefix"
## 上传的文件的name为 resource
Content-Disposition: form-data; name="resource"; filename="app.js"
Content-Type: text/javascript
```
假设该接口返回的内容如下：
```
{
    url: 'http://mysite.com/autoupload/app.js',
    success: true,
}
```
新建的app工程目录如下：
```
app
├── app.html
└── asset
    ├── a.css
    ├── a.js
    └── b.js
```
app.html文件内容如下：
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>my app test</title>
    <!-- build:css src/a.css -->
    <link rel="stylesheet" href="asset/a.css">
    <!-- endbuild -->
</head>
<body>
    
</body>
<!-- build:js src/combined.js -->
<script src="asset/a.js"></script>
<script src="asset/b.js"></script>
<!-- endbuild -->
</html>
```
gulpfile.js 如下
```javascript
const gulp = require('gulp');
const useref = require('gulp-useref');
const uploadManifest = requier('gulp-upload-manifest')
var revReplace = require("gulp-rev-replace");
const filter = require('gulp-filter')
gulp.task('upload', function(){
    var options = {
        url: "http://mysite.com/upload",
        formData: {
            prefix: '1'
        },
        uploadName: 'resource',
        rspFun: function(rsp){
          if(rsp.success){
            return rsp.url;
          } else{
            return null;
          }
        }
    }
    
    var exceptHtmlFilter = filter(['**/*', '!**/*.html'], {restore: true});
    var dist_path = 'dist';
    gulp.src('./app/app.html')
      .pipe(useref())
      .pipe(gulp.dest(dist_path))
      .pipe(exceptHtmlFilter)
      .pipe(uploadManifest(weiyi_options))
      .pipe(gulp.dest(dist_path))
      .on('finish', function() {
        var manifest = gulp.src("./"+dist_path+"/upload-manifest.json");
        gulp.src('./'+dist_path+'/app.html')
            .pipe(debug())
            .pipe(revReplace({manifest: manifest}))
            .pipe(gulp.dest('dist'))
      })
})
```
执行完`upload`任务后将会在`dist`目录下生成`upload-manifest.json`文件，该文件表示本地的资源文件同上传到服务器的资源文件的映射，并且`dist/app.html`中的资源将被替换成如下（app.html）：
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>my app test</title>
    <link rel="stylesheet" href="http://mysite.com/autoupload/a.css">
</head>
<body>
    
</body>
<script src="http://mysite.com/autoupload/combined.js"></script>
</html>
```
## API
### uploadManifest(options)
### options
以下字段都不许在调用接口的时候设置
#### options.url
type:  string
上传文件的接口地址
#### options.formData
type:  string
default: {}
上传文件的接口需要的额外参数，参考[formData](https://github.com/request/request#forms)
#### options.uploadName
type: string
上传文件接口中要上传文件对应的name
#### options.rspFun
type:  function
return type: string
调用上传文件之后的回调函数, 第一个参数为返回的内容，该函数需要返回最终的url地址(即你的html页面中引用的地址)，如果失败返回`null`
```javascript
options.rspFun = function(response) {
    if(response.success) return response.url;
    else return null
}
```