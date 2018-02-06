import * as fs from 'fs'
import * as child_process from 'child_process'
import * as readline from 'readline'

const exec = child_process.exec;
const request = require('request');
const cheerio = require('cheerio');

// GitHub URL
const url = 'https://github.com/qinyuhang/ShadowsocksX-NG-R/releases';

// tweak the print function
const print = console.log;

// interact with shell
// here, I used it to run cmd after keydown
function readSyncByRl(tips: string) {
    tips = tips || '> ';

    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(tips, (answer) => {
            rl.close();
            resolve(answer.trim())
        })
    })
}

// a function to check if the file exists
function fsExistsSync(path: string): boolean {
    try {
        fs.accessSync(path, fs.F_OK)
    } catch (e) {
        return false
    }
    return true
}

// decide proxy by attr
let proxy = process.argv[2];
let socket = process.argv[3];
// let port = process.argv[4]
let r;  // request

// decide request by proxy
if (!proxy) {
    r = request;
    print('Not Using Proxy')
} else {
    // if (socket !== undefined || socket.startsWith('http://')) {
    //     socket = socket.substring(7)
    // }

    {
        if (proxy === '-s') {
            socket = socket || '127.0.0.1:6152'
        } else {
            socket = socket || '127.0.0.1:1087'
        }
    }
    r = request.defaults({
        proxy: 'http://' + socket
    });
    print('Using Proxy: ' + 'http://' + socket)
}

// get PID of ShadowsocksX-NG
let ssrPID = -1;
exec('ps aux', function (err, stdout, stderr) {
    if (err) {
        return print(err)
    }
    // print(stdout.split('\n'))
    stdout.split('\n').filter(function (line) {
        let p = line.trim().split(/\s+/);
        let pname = p[p.length - 1];
        let pid = p[1];
        // print(parseInt(pid))
        if (pname.toLowerCase().indexOf('shadowsocksx-ng') !== -1 &&
            pname.toLowerCase().indexOf('shadowsocksx-ng-r8-updater') === -1 &&
            parseInt(pid)) {
            print('ShadowsocksX-NG-R8 Process Found:', pid);
            ssrPID = parseInt(pid)
        }
    })
});

// if (ssrPID === -1) {
//   print('ShadowsocksX-NG-R is not running')
// }

// get download URL
r({
    followAllRedirects: true,  // aws.s3 redirect
    url
}, (error, response, html) => {
    if (error) {
        print('FETCH: ' + error)
    } else if (response.statusCode === 200) {
        let $ = cheerio.load(html);
        // const appURL = $('.release-body .release-downloads a').attr('href');
        const appURL = 'https://github.com' +
                        $('.release-body').eq(0).
                        children('div').eq(1).
                        children('ul').eq(-1).
                        children('li').eq(0).
                        children('a').attr('href');
        // const sigURL = appURL + '.sig'
        const splitURL = appURL.split('/');
        const version = splitURL[splitURL.length - 2];
        const fileName = splitURL[splitURL.length - 1];
        const type = fileName.split('.')[fileName.split('.').length - 1].toLowerCase();  // zip or dmg
        print('Start Downloading: ' + version);

        // download
        r(appURL, function (err) {
            if (err) {
                print('DOWNLOAD: ' + err)
            } else {
                print('Download Successful: ' + process.cwd() + '/' + version + '_' + fileName + '\n');
                let cmd = '';
                if (type === 'zip') {
                    cmd =
                        'mkdir tmp && cd tmp && ' +                                                           // create /tmp as a working dir
                        'unzip ../*.zip && ' +                                                                    // unzip
                        'mv /Applications/ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app.bak && ' +  // backup old version
                        'mv ./ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app && ' +                  // move new version to /Applications
                        'cd .. && rm -rf ./tmp && ' +                                                             // delete working dir
                        'open /Applications/ShadowsocksX-NG-R8.app && ' +                                         // open ShadowsocksX-NG-R8.app again
                        'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' +                                   // delete backup
                        'rm -rf ' + version + '_' + fileName;                                                      // delete downloaded file
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
                        'rm -rf "' + version + '_' + fileName + '"';                                                                // delete downloaded file
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
                    exec(cmd);
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
});
