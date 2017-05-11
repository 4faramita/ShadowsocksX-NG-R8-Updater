#!/usr/local/bin/node

const fs = require('fs')
const child_process = require('child_process')
const readline = require('readline')

const request = require('request')
const cheerio = require('cheerio')

let url = 'https://github.com/shadowsocksr/ShadowsocksX-NG/releases'

// tweak the print function
let print = console.log

let proxy = process.argv[2] || '-y'
let server = process.argv[3] || '127.0.0.1'
let port = process.argv[4] || '1087'
let r

function readSyncByRl (tips) {
  tips = tips || '> '

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(tips, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function fsExistsSync (path) {
  try {
    fs.accessSync(path, fs.F_OK)
  } catch (e) {
    return false
  }
  return true
}

if (proxy === '-n') {
  r = request
  print('Not Using Proxy')
} else {
  r = request.defaults({
    'proxy': 'http://' + server + ':' + port
  })
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
    const appURL = 'https://github.com' + $('.release-timeline .release-body .release-downloads a').attr('href')
    print(appURL)
    const sigURL = appURL + '.sig'
    const splitURL = appURL.split('/')
    const version = splitURL[splitURL.length - 2]
    const fileName = splitURL[splitURL.length - 1]
    print('Start Downloading: ' + version)

    r(appURL, function (err) {
      if (err) {
        print('ERROR: ' + err)
      } else {
        print('Download Successful: ' + process.cwd() + '/' + version + '_' + fileName + '\n')
        let cmd = 'mkdir tmp && cd tmp &&\
                   unzip ../*.zip && \
                   mv /Applications/ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app.bak && \
                   mv ./ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app && \
                   cd .. && rm -rf ./tmp && \
                   rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && \
                   open /Applications/ShadowsocksX-NG-R8.app && \
                   rm -rf ' + version + '_' + fileName
        if (fsExistsSync('./tmp/')) {
          cmd = 'rm -rf tmp && ' + cmd
        }
        if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
          cmd = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd
        }
        readSyncByRl('即将开始替换旧版\n请关闭 Shadowsocks-NG-R8 后按下 return 键继续\n').then((res) => {
          child_process.exec(cmd)
          print('Moved to ~/Applications.')
        })
      }
    }).pipe(fs.createWriteStream('./' + version + '_' + fileName))
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
