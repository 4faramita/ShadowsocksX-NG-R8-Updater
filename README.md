# ShadowsocksX-NG-R8-Updater
A tool to get the latest version of ShadowsocksX-NG-R8.

## Update
### v1.3
Using the repo maintained by qinyuhang.
Changed default setting to "no proxy".
Changed proxy parameter from "-y" to "-p".
Changed proxy server input pattern from "IP port" to "IP:port".

### v1.2
Deal with both ".zip" and ".dmg".
Automatic Installation.

### v1.1
Adapted to ".zip" format.    

**Auto installation**.

## Usage

If you don not have Node and npm on your Mac:

`brew install node npm`

Install dependency:

`npm install cheerio request -g`

Enter the folder of the script, for example:

`cd ShadowsocksX-NG-R8-Updater`

Then you can use it by

`node updater.js`

Or make it executable by

`chmod +x updater.js `

And then run it by

`./updater.js`

And it will download the latest version of ShadowsocksX-NG-R8 to the same place of this script.

### Automatic Installation

When it tells you to close ShadowsocksX-NG, if you close it manually, ShadowsocksX-NG will open and start after installation; if you decided to ignore it, ShadowsocksX-NG will open after installation, but you will have to start it manually.


## Proxy

If you want to use a proxy, run `node updater.js -p`. I asume you are using ShadowsocksX-NG-R8 and have opened "HTTP Proxy", so the script use http://127.0.0.1:1087 as proxy server by default.

If you want to use a different HTTP proxy, use `node updater.js -p [server]:[port]`. For example: `node updater.js -p 127.0.0.1:1087`. Only support HTTP proxy now.



## 2Do:

- [X] Install Automatically
- [X] Adapt to .zip and .dmg
- [ ] Costomize saving path
- [ ] Verify Sig
- [ ] Show download progress



