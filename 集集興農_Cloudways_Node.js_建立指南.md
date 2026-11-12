# 集集興農產品速查網｜Cloudways Node.js 建立指南

本指南針對目前的網站程式：Node.js 原生伺服器、入口 `server.js`、啟動命令 `npm start`。

## 先判斷你要使用哪一種 Cloudways

你目前的網址 `phpstack-805561-6778201.cloudwaysapps.com` 回傳 Cloudways 預設 PHP Stack 頁面，表示目前應用程式是 PHP Stack，不是 Node.js 應用程式。

建議改用 Cloudways 官方的 **Velocity Managed Node.js Hosting**。Velocity 的建立流程包含選方案、選 Git 儲存庫、設定 Node 版本、Root Directory、Build Settings 與環境變數。官方文件：[How to Launch an Application on Cloudways Velocity](https://support.cloudways.com/en/articles/15550368-how-to-launch-an-application-on-cloudways-velocity)

如果你的 Cloudways 帳號看不到「Velocity」，請使用本指南最後的「舊式 PHP Stack＋SSH／PM2」方案，但它需要 Cloudways 支援人員協助啟用反向代理，設定較複雜。

## 方案 A：使用 Cloudways Velocity 建立 Node.js 應用程式

### 1. 準備 GitHub 儲存庫

Velocity 官方目前以 GitHub、GitLab 或 Bitbucket 儲存庫部署應用程式。最簡單的做法是將 Cloudways 上傳包內容放入一個 GitHub repository。

Repository 根目錄必須直接包含：

```text
package.json
server.js
public/
Dockerfile
```

不要讓檔案多一層資料夾，例如下面這種結構是錯的：

```text
集集興農_Cloudways_上傳包/package.json
```

你應該讓 `package.json` 位於 repository 根目錄：

```text
package.json
```

不要把 `.env`、OAuth Secret、密碼或 GAS 私密網址提交到 GitHub。

### 2. 開啟 Velocity

1. 登入 Cloudways Platform。
2. 左側選單點選 **Velocity**。
3. 點選 **Get Started**；若已有 Velocity 應用程式，點選 **Applications**，再按 **Add Application**。
4. 選擇方案與磁碟空間。
5. 填寫 Server Name、Region，按 **Continue**。

官方說明指出，Velocity 是 Cloudways 的 Node.js 應用程式託管服務，建立時會使用 Git repository 部署程式。[Cloudways Velocity 官方建立流程](https://support.cloudways.com/en/articles/15550368-how-to-launch-an-application-on-cloudways-velocity)

### 3. 連接 GitHub

1. 在 **Select Repository** 選擇 **GitHub**。
2. 按 **Connect**。
3. 登入 GitHub。
4. 在 GitHub 授權 Cloudways Deploy。
5. 建議選 **Only select repositories**，只授權集集興農網站的 repository。
6. 返回 Cloudways 後，選擇 Workspace 與 repository。
7. 選擇 `main` branch。
8. 按 **Continue**。

### 4. Review Build Settings

請在 Review Build Settings 填入以下值：

- **Framework Preset**：Node.js 或 Custom／Express。若沒有原生 Node.js，選 Custom。
- **Branch**：`main`
- **Node Version**：Node 22 LTS
- **Root Directory**：`/`
- **Package Manager**：`npm`
- **Entry File**：`server.js`
- **Build Command**：`npm install`
- **Start Command**：`npm start`
- **Output Directory**：留白或依 Cloudways 要求；這個網站不是前端 build 型專案。

本網站的 `package.json` 已包含：

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### 5. 設定環境變數

在 Environment Variables 按 **Add**。先不要自行填入 `PORT`，讓 Cloudways 注入應用程式埠號；`server.js` 已使用 `process.env.PORT`。

只有要在 Cloudways 保留 Manus OAuth 登入時，才需要加入：

```text
MANUS_PROJECT_ID=由 Manus OAuth 平台提供
MANUS_OAUTH_PORTAL_URL=由 Manus OAuth 平台提供
MANUS_OAUTH_API_URL=由 Manus OAuth 平台提供
MANUS_JWT_SECRET=自行產生的長隨機字串
```

`MANUS_JWT_SECRET` 請標記為 Sensitive。不要把這些值寫入 GitHub 或 ZIP。

如果暫時沒有 Cloudways 可用的 Manus OAuth 設定，網站前台可以運作；但「登入」、「資料來源」與「管理後台」無法在 Cloudways 上完成正式登入。

### 6. 部署

1. 確認 repository、branch、Node 版本與 Entry File。
2. 確認 Root Directory 是 `/`。
3. 按 **Deploy** 或 **Launch Application**。
4. 等待部署完成。
5. 開啟 Velocity Application Overview，查看 Last Deployment 是否成功。
6. 若部署失敗，先查看 Deployment Management 的部署記錄與 build log。

官方管理文件說明，Velocity 的 Overview 可以查看 Last Deployment、Repository、Commit、Branch、Framework、Node Version 與 Build／Output Settings。[Cloudways Velocity Application Overview](https://support.cloudways.com/en/articles/15550860-cloudways-velocity-application-overview-guide)

### 7. 測試網站

假設 Cloudways 給你的網址是：

```text
https://你的-nodejs-應用程式網址
```

依序測試：

```text
https://你的-nodejs-應用程式網址/
https://你的-nodejs-應用程式網址/healthz
https://你的-nodejs-應用程式網址/manus-routes.json
```

`/healthz` 成功時應顯示：

```json
{"ok":true}
```

首頁成功時，應該看到「集集興農產品速查網」，而不是 Cloudways 的「PHP Stack」預設頁面。

### 8. 綁定網域與 SSL

1. 在 Velocity Application Overview 點選 **Connect Domain**。
2. 填入你的正式網域。
3. 在網域 DNS 建立 Cloudways 要求的指向記錄。
4. 等 DNS 生效後，在 Cloudways 啟用 SSL。
5. 重新測試 `/` 與 `/healthz`。

## 方案 B：沿用目前 PHP Stack，手動執行 Node.js

這是舊式做法，不是首選。Cloudways 官方舊版 Node.js 教學是先建立 PHP Application，再透過 SSH、PM2 與 `.htaccess` 反向代理，把網站流量轉到 Node.js 監聽的 3000 埠。[Cloudways Node.js Hosting 教學](https://www.cloudways.com/blog/how-to-host-a-node-js-application/)

### 1. 上傳檔案位置

使用 SSH 或 SFTP 進入目前 PHP Stack 應用程式，進入：

```text
public_html/
```

解壓後必須直接看到：

```text
public_html/package.json
public_html/server.js
public_html/public/index.html
```

不能是：

```text
public_html/集集興農_Cloudways_上傳包/package.json
```

### 2. SSH 安裝與測試

在 `public_html` 執行：

```bash
npm install
PORT=3000 npm start
```

另一個 SSH 視窗測試：

```bash
curl http://127.0.0.1:3000/healthz
```

應回傳：

```json
{"ok":true}
```

### 3. 使用 PM2 常駐執行

如果 Cloudways 伺服器已安裝 PM2：

```bash
cd ~/applications/你的應用程式/public_html
PORT=3000 pm2 start server.js --name jijifarm
pm2 save
```

如果找不到 `pm2`，請先依 Cloudways 主機指引安裝，或聯絡 Cloudways 支援。只在 SSH 視窗執行 `node server.js`，關閉 SSH 後程序可能會停止。

### 4. 設定反向代理

PHP Stack 的 Nginx／Apache 必須把網站流量轉送到 Node.js 的 3000 埠。Cloudways 官方舊版教學使用 `.htaccess` 與 `mod_proxy`，但 `mod_proxy` 可能需要 Cloudways 支援人員啟用。

請不要直接猜測並修改伺服器設定。將以下資訊提供給 Cloudways 支援：

```text
我需要在目前的 PHP Stack Application 上執行 Node.js server.js。
Node.js 監聽 127.0.0.1:3000，健康檢查路徑是 /healthz。
請協助啟用 mod_proxy，並將此應用程式的 HTTPS 流量反向代理到 127.0.0.1:3000。
```

若反向代理沒有設定，即使 `node server.js` 在 3000 埠正常執行，使用者仍會看到 PHP Stack 預設頁面。

## 你目前最建議的處理方式

你的現況是 PHP Stack 顯示預設頁面，因此建議採用方案 A：

1. 建立 GitHub repository。
2. 上傳 Cloudways Node.js 直接解壓包內的檔案，讓 `package.json` 在 repository 根目錄。
3. 在 Cloudways 左側選單使用 **Velocity**。
4. 選 Node.js／Custom 應用程式。
5. 連接 GitHub repository。
6. 使用 Node 22、Root Directory `/`、Entry File `server.js`、Start Command `npm start`。
7. 部署完成後測試 `/healthz`。

不要再把 Node.js ZIP 上傳到目前的 `phpstack-805561-6778201.cloudwaysapps.com`，除非你已經完成 PM2 與反向代理設定。

## References

[1]: https://support.cloudways.com/en/articles/15550368-how-to-launch-an-application-on-cloudways-velocity "How to Launch an Application on Cloudways Velocity"
[2]: https://support.cloudways.com/en/articles/15550860-cloudways-velocity-application-overview-guide "Cloudways Velocity Application Overview Guide"
[3]: https://www.cloudways.com/blog/how-to-host-a-node-js-application/ "How to Host a Node.js Application on Cloudways"
