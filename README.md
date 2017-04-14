# ShadowsocksX-NG-R8-Updater
A tool to get the latest version of ShadowsocksX-NG-R8.



## Usage

First install dependency:

`npm install cheerio request -g`

Then you can use it by

`node updater.js`

And it will download the latest version of ShadowsocksX-NG-R8 to the same place of this script.



## Proxy

I asume you use ShadowsocksX-NG-R8 already and opened "HTTP Proxy", so the script use http://127.0.0.1:1087 as a default proxy server.

If you do not want to use a proxy, use `node updater.js -n`;

If you want to use other http proxy, use `node updater.js -y [server] [port]`. For example: `node updater.js -y 127.0.0.1 1087`. "http://" is added by default, no need to add manually.



## 2Do:

- [ ] Costomize saving path
- [ ] Verify Sig
- [ ] Show download progress



