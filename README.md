# ne-ssi-loader

Webpack SSI loader for NETEASE

一个简单的Webpack SSI loader，在cms项目中使用。比其他ssi-loader相比，可以设置远程include的charset设置。

## Support

Currently only  **include** directives are supported:

```
<!-- absolute path (webpack-config location.include is needed) -->
<!--# include virtual="/includes/new/pre/async" -->

<!-- relative path -->
<!--# include virtual="./includes/new/pre/async" -->

<!-- relative path  ('@'' means root of the project)  -->
<!--# include virtual="@/includes/new/pre/async" -->
```

## Config

Inside your **webpack.dev.config.js** file just add the reference to ssi-loader:

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
        loader: 'ssi-loader',
        options: {
          locations: {
            "include": "https://github.com/Jogiter/ssi-loader",
          }
        }
      }
    ]
  }]
}
```

This will replace all SSI directives with the actual include content.
The ssi-loader only handles the server side includes, in order to return
a valid webpack source you can use the **html-loader** like shown in the
previous example.

## to-think

ssi-loader，会将 ssi 内的内容替换掉页面的注释语法 。而实际上，希望 ssi 更新后可以实时更新，在产品模式不使用ssi-loader，只在在生产模式使用。

>html-webpack-plugin 最新版不支持 3.x webpack

ssi-loader bugs:

- [x] 支持本地 & 远程 ssi
- [x] 开发时，无法监控实时更新（随意修改本地的，会重新拉取远程或者本地的数据）
- [x] 目前仅支持 webpack 3.x，不支持 4.x

## LICENSE

[WTFPL](http://www.wtfpl.net/)
