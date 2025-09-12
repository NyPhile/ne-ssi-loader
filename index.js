const loaderUtils = require('loader-utils')
const request = require('request')
const path = require('path')
const fs = require('fs')
const iconv = require('iconv-lite')

let includeBase = ''
let remoteCharset = ''
let localCharset = ''
let build = '' // 替换模式， 'src' 'remote' 'all'
// 添加缓存对象
const contentCache = {}

function getMatches(source) {
  let reg = /<!--\s*#\s?include\s+(?:virtual|file)="([^"]+)"(?:\s+stub="(\w+)")?\s*-->/gi
  let res
  let matches = []
  while ((res = reg.exec(source)) != null) {
    matches.push({
      part: res[0],
      location: res[1]
    })
  }
  return matches
}

function getRemoteFile(match, context) {
  return new Promise((resolve, reject) => {
    let url
    if (path.isAbsolute(match.location)) {
      if (build === 'src') {
        // 不替换远程文件
        return resolve({
          part: match.part,
          content: match.part,
          statusCode: 200
        })
      }

      // 构建缓存键
      const cacheKey = `${includeBase}${match.location}`

      // 检查缓存中是否有有效内容
      if (contentCache[cacheKey]) {
        console.log(`使用缓存内容: ${cacheKey}`)
        return resolve({
          part: match.part,
          content: contentCache[cacheKey],
          statusCode: 200
        })
      }

      let param = {
        url: `${includeBase}${match.location}`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Encoding': 'identity',
          'encoding': null
        }
      }
      request(param, (err, response, body) => {
        if (err) {
          console.log(err.message || "请求出错")
          return reject(err)
        }
        let content = remoteCharset ? iconv.decode(body, remoteCharset).toString() : body.toString()

        // 检测内容中是否包含乱码字符"�"，如果有则重新请求（最多重试3次）
        let retryCount = 0;
        const maxRetries = 3;

        function tryRequest() {
          if (content.includes('�') && retryCount < maxRetries) {
            console.log(`检测到乱码字符，正在重新请求 (${retryCount + 1}/${maxRetries})...`);
            retryCount++;
            request(param, (retryErr, retryResponse, retryBody) => {
              if (retryErr) {
                console.log(retryErr.message || "重试请求出错");
                return resolve({
                  part: match.part,
                  content,
                  statusCode: response.statusCode
                });
              }
              content = remoteCharset ? iconv.decode(retryBody, remoteCharset).toString() : retryBody;
              tryRequest(); // 递归检查结果
            });
          } else {
            // 如果内容没有乱码，则缓存它
            if (!content.includes('�')) {
              contentCache[cacheKey] = content
              console.log(`缓存内容: ${cacheKey}`)
            }

            return resolve({
              part: match.part,
              content,
              statusCode: response.statusCode
            });
          }
        }

        tryRequest();
      })
    } else {
      if (build === 'remote') {
        // 不替换本地文件
        return resolve({
          part: match.part,
          content: match.part,
          statusCode: 200
        })
      }
      if (match.location.indexOf('@' === 0)) {
        url = path.join(context._compiler.context, match.location.slice(1))
      } else {
        url = path.join(path.dirname(context.resourcePath), match.location)
      }
      fs.readFile(
        url,
        {
          encoding: localCharset ? localCharset : 'utf-8'
        },
        (err, data) => {
          if (err) return reject(err)
          return resolve({
            part: match.part,
            content: data,
            statusCode: 200
          })
        }
      )
    }
  })
}

module.exports = function (source) {
  let callback = this.async()
  const options = loaderUtils.getOptions(this)

  if (options.remote) {
    includeBase = options.remote.locations
    remoteCharset = options.remote.charset
  }

  if (options.build) {
    build = options.build
  }

  if (options.local) {
    localCharset = options.local.charset
  }

  if (!includeBase) {
    return callback(null, source)
  }

  let matches = getMatches(source)

  Promise.all(matches.map(match => getRemoteFile(match, this)))
    .then(res => {
      let output = source
      for (let piece of res) {
        if (piece.statusCode === 200) {
          output = output.replace(piece.part, piece.content)
        }
      }
      callback(null, output)
    })
    .catch(e => {
      callback(e)
    })
}
