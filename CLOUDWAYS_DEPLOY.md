# 集集興農產品速查網｜Cloudways 上傳與部署說明

## 上傳包內容

本包是 Node.js 網站，不需要 `node_modules`；Cloudways 伺服器安裝 Node.js 後即可執行。網站前端檔案在 `public/`，伺服器入口是 `server.js`。

## Cloudways 建議設定

建立 Node.js 應用程式後，將本包解壓到應用程式目錄，並設定：

- Node.js：22 或相容的 LTS 版本
- 啟動命令：`npm start`
- 應用程式監聽埠：使用 Cloudways 提供的 `PORT` 環境變數；程式預設為 `3000`
- 健康檢查：`/healthz`
- 網站入口：`/`

若 Cloudways 使用 Passenger、PM2 或 Supervisor，啟動檔請指定 `server.js`，並讓程序繼承 Cloudways 的 `PORT` 環境變數。

## Google 試算表＋GAS

網站本身可以先以示範資料運作。要讓產品與公告跨裝置同步：

1. 依 `集集興農_Google試算表_GAS部署指南.md` 部署 GAS Web App。
2. 使用正式 `/exec` 網址，不要使用 `/dev`。
3. 登入網站的管理功能後，到「資料來源」貼上 GAS `/exec` 網址。
4. 公告、活動圖片與產品資料會由同一份 Google 試算表提供。

GAS 程式在 `gas/Code.gs`；可直接貼上的版本在上傳包根目錄的 `集集興農_GAS_可直接貼上版.gs`。

## Manus OAuth 登入限制

原網站的管理登入使用 Manus OAuth，並只允許 `notemaker@gmail.com`。Cloudways 是獨立主機，若未設定 Manus OAuth 的外部環境變數，網站仍可瀏覽，但登入會顯示「登入服務尚未完成平台設定」。

若要在 Cloudways 保留 Manus OAuth，需由部署環境提供以下環境變數，且 OAuth 平台必須允許 Cloudways 網域的回呼網址：

- `MANUS_PROJECT_ID`
- `MANUS_OAUTH_PORTAL_URL`
- `MANUS_OAUTH_API_URL`
- `MANUS_JWT_SECRET`（請使用長且隨機的值）

回呼網址格式：`https://你的網域/auth/callback`

不要把 OAuth 密鑰或 JWT Secret 寫進前端檔案、Git 或本 ZIP。若 Cloudways 不使用 Manus OAuth，請改用 Cloudways／反向代理的存取控制，或先只公開前台與 GAS 資料查詢功能。

## 上線後檢查

部署後請依序確認：

1. `https://你的網域/healthz` 回傳 `{"ok":true}`。
2. 首頁可正常載入分類圖、LINE QR Code 與 CSS／JavaScript。
3. `https://你的網域/manus-routes.json` 可讀取路由檔。
4. 網站「資料來源」可連線至 GAS `/exec`。
5. 公告圖片在 Google Drive 設為「知道連結的任何人可檢視」。
6. 活動公告在電腦、手機與平板均能顯示。

## 安全提醒

GAS `/exec` 網址等同資料存取能力連結，不要公開貼出。Cloudways 後台的環境變數請使用主機提供的安全設定，不要放進公開上傳包。
