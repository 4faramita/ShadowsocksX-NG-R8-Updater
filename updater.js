"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var child_process = require("child_process");
var readline = require("readline");
var exec = child_process.exec;
var request = require('request');
var cheerio = require('cheerio');
// GitHub URL
var url = 'https://github.com/qinyuhang/ShadowsocksX-NG-R/releases';
// tweak the print function
var print = console.log;
// interact with shell
// here, I used it to run cmd after keydown
function readSyncByRl(tips) {
    tips = tips || '> ';
    return new Promise(function (resolve) {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(tips, function (answer) {
            rl.close();
            resolve(answer.trim());
        });
    });
}
// a function to check if the file exists
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    }
    catch (e) {
        return false;
    }
    return true;
}
// decide proxy by attr
var proxy = process.argv[2];
var socket = process.argv[3];
// let port = process.argv[4]
var r; // request
// decide request by proxy
if (!proxy) {
    r = request;
    print('Not Using Proxy');
}
else {
    // if (socket !== undefined || socket.startsWith('http://')) {
    //     socket = socket.substring(7)
    // }
    {
        if (proxy === '-s') {
            socket = socket || '127.0.0.1:6152';
        }
        else {
            socket = socket || '127.0.0.1:1087';
        }
    }
    r = request.defaults({
        proxy: 'http://' + socket
    });
    print('Using Proxy: ' + 'http://' + socket);
}
// get PID of ShadowsocksX-NG
var ssrPID = -1;
exec('ps aux', function (err, stdout, stderr) {
    if (err) {
        return print(err);
    }
    // print(stdout.split('\n'))
    stdout.split('\n').filter(function (line) {
        var p = line.trim().split(/\s+/);
        var pname = p[p.length - 1];
        var pid = p[1];
        // print(parseInt(pid))
        if (pname.toLowerCase().indexOf('shadowsocksx-ng') !== -1 &&
            pname.toLowerCase().indexOf('shadowsocksx-ng-r8-updater') === -1 &&
            parseInt(pid)) {
            print('ShadowsocksX-NG-R8 Process Found:', pid);
            ssrPID = parseInt(pid);
        }
    });
});
// if (ssrPID === -1) {
//   print('ShadowsocksX-NG-R is not running')
// }
// get download URL
r({
    followAllRedirects: true,
    url: url
}, function (error, response, html) {
    if (error) {
        print('FETCH: ' + error);
    }
    else if (response.statusCode === 200) {
        var $_1 = cheerio.load(html);
        // const appURL = $('.release-body .release-downloads a').attr('href');
        var appURL = 'https://github.com' +
            $_1('.release-body').eq(0).
                children('div').eq(1).
                children('ul').eq(-1).
                children('li').eq(0).
                children('a').attr('href');
        // const sigURL = appURL + '.sig'
        var splitURL = appURL.split('/');
        var version_1 = splitURL[splitURL.length - 2];
        var fileName_1 = splitURL[splitURL.length - 1];
        var type_1 = fileName_1.split('.')[fileName_1.split('.').length - 1].toLowerCase(); // zip or dmg
        print('Start Downloading: ' + version_1);
        // download
        r(appURL, function (err) {
            if (err) {
                print('DOWNLOAD: ' + err);
            }
            else {
                print('Download Successful: ' + process.cwd() + '/' + version_1 + '_' + fileName_1 + '\n');
                var cmd_1 = '';
                if (type_1 === 'zip') {
                    cmd_1 =
                        'mkdir tmp && cd tmp && ' + // create /tmp as a working dir
                            'unzip ../*.zip && ' + // unzip
                            'mv /Applications/ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app.bak && ' + // backup old version
                            'mv ./ShadowsocksX-NG-R8.app /Applications/ShadowsocksX-NG-R8.app && ' + // move new version to /Applications
                            'cd .. && rm -rf ./tmp && ' + // delete working dir
                            'open /Applications/ShadowsocksX-NG-R8.app && ' + // open ShadowsocksX-NG-R8.app again
                            'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + // delete backup
                            'rm -rf ' + version_1 + '_' + fileName_1; // delete downloaded file
                    if (fsExistsSync('./tmp/')) {
                        // if exists working dir from last time
                        cmd_1 = 'rm -rf tmp && ' + cmd_1;
                    }
                    if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
                        // if exists backup from last time
                        cmd_1 = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd_1;
                    }
                }
                else if (type_1 === 'dmg') {
                    cmd_1 = 'hdiutil attach "./' + version_1 + '_' + fileName_1 + '" && ' + // mount the dmg
                        'sleep 1 && ' + // wait the dmg to be mounted
                        'mv "/Applications/ShadowsocksX-NG-R8.app" "/Applications/ShadowsocksX-NG-R8.app.bak" && ' + // backup old version
                        'cp -r "/Volumes/ShadowsocksX-NG-R8/ShadowsocksX-NG-R8.app" "/Applications/ShadowsocksX-NG-R8.app" && ' + // copy new version to /Applications
                        'open "/Applications/ShadowsocksX-NG-R8.app" && ' + // open ShadowsocksX-NG-R8.app again
                        'rm -rf "/Applications/ShadowsocksX-NG-R8.app.bak" && ' + // delete backup
                        'hdiutil detach "/Volumes/ShadowsocksX-NG-R8" && ' + // unmount the dmg
                        'sleep 1 && ' + // wait the dmg to be unmounted
                        'rm -rf "' + version_1 + '_' + fileName_1 + '"'; // delete downloaded file
                    if (fsExistsSync('/Applications/ShadowsocksX-NG-R8.app.bak')) {
                        // if exists backup from last time
                        cmd_1 = 'rm -rf /Applications/ShadowsocksX-NG-R8.app.bak && ' + cmd_1;
                    }
                }
                if (ssrPID !== -1) {
                    cmd_1 = 'kill ' + ssrPID + ' && ' + cmd_1;
                }
                // print(cmd)
                readSyncByRl('即将开始替换旧版\n请关闭 Shadowsocks-NG-R8 后按下 return 键继续\n').then(function (res) {
                    exec(cmd_1);
                    print('Moved to ~/Applications.');
                });
            }
        }).pipe(fs.createWriteStream('./' + version_1 + '_' + fileName_1));
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
