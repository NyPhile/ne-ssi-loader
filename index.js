const loaderUtils = require('loader-utils')
const request = require('request')
const path = require('path')
const fs = require('fs')
const iconv = require('iconv-lite')

let includeBase = ''
let remoteCharset = ''
let localCharset = ''
let build = '' // 替换模式， 'src' 'remote' 'all'

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
      let param = {
        url: `${includeBase}${match.location}`
      }
      if (remoteCharset) {
        param.encoding = null
      }
      request(param, (err, response, body) => {
        if (err) return reject(err)
        let content = remoteCharset ? iconv.decode(body, remoteCharset).toString() : body
        return resolve({
          part: match.part,
          content,
          statusCode: response.statusCode
        })
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

module.exports = function(source) {
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
