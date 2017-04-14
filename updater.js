#!/usr/local/bin/node

const fs = require('fs')

const request = require('request')
const cheerio = require('cheerio')

let url = 'https://github.com/shadowsocksr/ShadowsocksX-NG/releases'

// tweak the print function
let print = console.log

let proxy = process.argv[2] || '-y'
let server = process.argv[3] || '127.0.0.1'
let port = process.argv[4] || '1087'
// print({'proxy': proxy + ':' + port})
let r

if (proxy === '-n') {
  r = request
  print('Not Using Proxy')
} else {
  r = request.defaults({'proxy': 'http://' + server + ':' + port})
  print('Using Proxy: ' + 'http://' + server + ':' + port)
}

r({
  followAllRedirects: true,
  url
}, function (error, response, html) {
  if (error) {
    print('ERROR: ' + error)
  } else if (!error && response.statusCode === 200) {
    let $ = cheerio.load(html)
    const dmgURL = 'https://github.com' + $('.release-timeline .release-body .release-downloads a').attr('href')
    const sigURL = dmgURL + '.sig'
    const splitURL = dmgURL.split('/')
    const version = splitURL[splitURL.length - 2]
    print('Start Downloading: ' + version)
    // downloadURL = 'https://nodejs.org/api/process.html#process_process_cwd'
    // dmg
    r(dmgURL, function (err) {
      if (err) {
        print('ERROR: ' + err)
      } else {
        print('Download Successful: ' + process.cwd() + '/ShadowsocksX-NG-R8_' + version + '.dmg\n')
      }
    }).pipe(fs.createWriteStream('./ShadowsocksX-NG-R8' + version + '.dmg'))
    // sig
    // r(sigURL, function (err) {
    //   if (err) {
    //     print('ERROR: ' + err)
    //   } else {
    //     print('Download Successful: ' + process.cwd() + '/ShadowsocksX-NG-R8_' + version + '.dmg.sig\n')
    //   }
    // }).pipe(fs.createWriteStream('./ShadowsocksX-NG-R8' + version + '.dmg.sig'))
  }
})
