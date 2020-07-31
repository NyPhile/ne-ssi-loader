# ne-ssi-loader

🏈Webpack SSI loader for NETEASE

一个简单的Webpack SSI loader，在cms项目中使用。比其他ssi-loader相比，可以设置远程include的charset设置。

## 支持语法

```html
<!-- 远程路径 -->
<!--#include virtual="/special/f2e/cn_head_static.html"-->

<!-- 本地路径 -->
<!--#include file="inc/head_static.html"-->

<!-- 别名路径，使用webpack的别名('@'' means root of the project)  -->
<!--# include virtual="@/head.html" -->
```

目前只支持绝对路径读取线上资源，相对路径读取本地资源不支持路径中包含变量的情况

## 设置

```js
// webpack.dev.config.js

module: {
  rules: [{
    test: /\.html?$/,
    use: [
      {
        loader: 'html-loader' // Used to output as html
      },
      {
        loader: 'ne-ssi-loader',
        options: {
          remote: {
            locations: 'https://news.163.com/',
            charset: 'GBK'
          },
          local: {
            charset: ''
          },
          build: 'src' // 是否替换资源。'src'只替换本地SSI，适合production模式，'build'只替换远程SSI。默认全部替换，适合dev模式。
        }
      }
    ]
  }]
}
```

## LICENSE

[WTFPL](http://www.wtfpl.net/)

## 基于ssi-loader修改

[ssi-loader](https://www.npmjs.com/package/ssi-loader)
