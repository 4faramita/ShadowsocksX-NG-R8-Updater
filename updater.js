#!/usr/local/bin/node

const fs = require('fs')
const exec = require('child_process').exec
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

let ssrPID = -1

exec('ps aux', function (err, stdout, stderr) {
  if (err) { return print(err) }
  // print(stdout.split('\n'))
  stdout.split('\n').filter(function (line) {
    let p = line.trim().split(/\s+/)
    let pname = p[p.length - 1]
    let pid = p[1]
    // print(parseInt(pid))
    if (pname.toLowerCase().indexOf('shadowsocksx-ng') !== -1 &&
      pname.toLowerCase().indexOf('shadowsocksx-ng-r8-updater') === -1 &&
      parseInt(pid)) {
      print('ShadowsocksX-NG-R8 Process Found:', pid)
      ssrPID = parseInt(pid)
    }
  })
})

// if (ssrPID === -1) {
//   print('ShadowsocksX-NG-R8 is not running')
// }

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
    // const sigURL = appURL + '.sig'
    const splitURL = appURL.split('/')
    const version = splitURL[splitURL.length - 2]
    const fileName = splitURL[splitURL.length - 1]
    const type = fileName.split('.')[fileName.split('.').length - 1].toLowerCase()
    print('Start Downloading: ' + version)

    r(appURL, function (err) {
      if (err) {
        print('ERROR: ' + err)
      } else {
        print('Download Successful: ' + process.cwd() + '/' + version + '_' + fileName + '\n')
        let cmd = ''
        if (type === 'zip') {
          cmd = 'mkdir tmp && cd tmp && ' +
            'unzip ../*.zip && ' +
            'mv /Applications/ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app.bak && ' +
            'mv ./ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app && ' +
            'cd .. && rm -rf ./tmp && ' +
            'open /Applications/ShadowsocksX-NG-R8.app && ' +
            'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' +
            'rm -rf ' + version + '_' + fileName
          if (fsExistsSync('./tmp/')) {
            cmd = 'rm -rf tmp && ' + cmd
          }
          if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
            cmd = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd
          }
        } else if (type === 'dmg') {
          cmd = 'hdiutil attach "./' + version + '_' + fileName + '" && ' +
            'sleep 1 && ' +
            'mv "/Applications/ShadowsocksX-NG-R8.app" "/Applications/ShadowsocksX-NG-R8.app.bak" && ' +
            'cp -r "/Volumes/ShadowsocksX-NG-R8/ShadowsocksX-NG-R8.app" "/Applications/ShadowsocksX-NG-R8.app" && ' +
            'open "/Applications/ShadowsocksX-NG-R8.app" && ' +
            'rm -rf "/Applications/ShadowsocksX-NG-R8.app.bak" && ' +
            'hdiutil detach "/Volumes/ShadowsocksX-NG-R8" && ' +
            'sleep 1 && ' +
            'rm -rf "' + version + '_' + fileName + '"'
          if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
            cmd = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd
          }
          let cmdList = 'ps aux'
          exec(cmdList, function (err, stdout, stderr) {
            if (err) { return console.log(err) }
            stdout.split('\n').filter(function (line) {
              let p = line.trim().split(/\s+/)
              let pname = p[0]
              let pid = p[1]
              if (pname.toLowerCase().indexOf('ShadowsocksX-NG') >= 0 && parseInt(pid)) {
                console.log(pname, pid)
              }
            })
          })
        }
        if (ssrPID !== -1) {
          cmd = 'kill ' + ssrPID + ' && ' + cmd
        }
        // print(cmd)
        readSyncByRl('即将开始替换旧版\n请关闭 Shadowsocks-NG-R8 后按下 return 键继续\n').then((res) => {
          exec(cmd)
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
