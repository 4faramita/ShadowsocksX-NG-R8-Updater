#!/usr/local/bin/node

const fs = require('fs')
const exec = require('child_process').exec
const readline = require('readline')

const request = require('request')
const cheerio = require('cheerio')

// GitHub URL
let url = 'https://github.com/shadowsocksr/ShadowsocksX-NG/releases'

// tweak the print function
let print = console.log

// interact with shell
// here, I used it to run cmd after keydown
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

// a function to check if the file exists
function fsExistsSync (path) {
  try {
    fs.accessSync(path, fs.F_OK)
  } catch (e) {
    return false
  }
  return true
}

// decide proxy by attr
let proxy = process.argv[2] || '-y'
let server = process.argv[3] || '127.0.0.1'
let port = process.argv[4] || '1087'
let r  // request

// decide request by proxy
if (proxy === '-n') {
  r = request
  print('Not Using Proxy')
} else {
  r = request.defaults({
    'proxy': 'http://' + server + ':' + port
  })
  print('Using Proxy: ' + 'http://' + server + ':' + port)
}

// get PID of ShadowsocksX-NG
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

// get download URL
r({
  followAllRedirects: true,  // aws.s3 redirect
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
    const type = fileName.split('.')[fileName.split('.').length - 1].toLowerCase()  // zip or dmg
    print('Start Downloading: ' + version)

    // download
    r(appURL, function (err) {
      if (err) {
        print('ERROR: ' + err)
      } else {
        print('Download Successful: ' + process.cwd() + '/' + version + '_' + fileName + '\n')
        let cmd = ''
        if (type === 'zip') {
          cmd = 'mkdir tmp && cd tmp && ' +                                                           // create /tmp as a working dir
            'unzip ../*.zip && ' +                                                                    // unzip
            'mv /Applications/ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app.bak && ' +  // backup old version
            'mv ./ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app && ' +                  // move new version to /Applications
            'cd .. && rm -rf ./tmp && ' +                                                             // delete working dir
            'open /Applications/ShadowsocksX-NG-R8.app && ' +                                         // open ShadowsocksX-NG-R8.app again
            'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' +                                   // delete backup
            'rm -rf ' + version + '_' + fileName                                                      // delete downloaded file
          if (fsExistsSync('./tmp/')) {
            // if exists working dir from last time
            cmd = 'rm -rf tmp && ' + cmd
          }
          if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
            // if exists backup from last time
            cmd = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd
          }
        } else if (type === 'dmg') {
          cmd = 'hdiutil attach "./' + version + '_' + fileName + '" && ' +                                            // mount the dmg
            'sleep 1 && ' +                                                                                            // wait the dmg to be mounted
            'mv "/Applications/ShadowsocksX-NG-R8.app" "/Applications/ShadowsocksX-NG-R8.app.bak" && ' +               // backup old version
            'cp -r "/Volumes/ShadowsocksX-NG-R8/ShadowsocksX-NG-R8.app" "/Applications/ShadowsocksX-NG-R8.app" && ' +  // copy new version to /Applications
            'open "/Applications/ShadowsocksX-NG-R8.app" && ' +                                                        // open ShadowsocksX-NG-R8.app again
            'rm -rf "/Applications/ShadowsocksX-NG-R8.app.bak" && ' +                                                  // delete backup
            'hdiutil detach "/Volumes/ShadowsocksX-NG-R8" && ' +                                                       // unmount the dmg
            'sleep 1 && ' +                                                                                            // wait the dmg to be unmounted
            'rm -rf "' + version + '_' + fileName + '"'                                                                // delete downloaded file
          if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
            // if exists backup from last time
            cmd = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd
          }
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
