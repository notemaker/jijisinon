# GitHub 上傳說明｜notemaker/jijisinon

本 repository 是集集興農產品速查網的 Node.js 網站原始碼。

## 上傳結構

請將本包內容直接放在 repository 根目錄，確認 GitHub 第一層直接看到：

```text
package.json
server.js
public/
Dockerfile
```

不要多包一層 `集集興農_GitHub_上傳包/` 資料夾。

## GitHub 上傳後的 Cloudways 設定

若使用 Cloudways Velocity：

- Branch：`main`
- Root Directory：`/`
- Node Version：Node 22 LTS
- Package Manager：`npm`
- Entry File：`server.js`
- Build Command：`npm install`
- Start Command：`npm start`

若使用 GitHub Actions 或其他 Node.js 主機，啟動命令同樣是：

```bash
npm start
```

網站會讀取 Cloudways 提供的 `PORT` 環境變數，預設埠號為 `3000`。

## 不要上傳的內容

`.gitignore` 已排除 `node_modules`、`.env`、密碼與日誌。不要將 Manus OAuth Secret、JWT Secret 或私人 GAS 設定放入 repository。

目前舊版前端仍保留公告管理的前端解鎖邏輯，因此建議將 `notemaker/jijisinon` 設為 **Private repository**，不要設為 Public。前端密碼保護不等同伺服器端權限；正式公開原始碼前，應改成完全使用 Manus OAuth／伺服器端權限驗證。

## GAS 相關檔案

- `gas/Code.gs`：專案內的 GAS 程式。
- `集集興農_GAS_可直接貼上版.gs`：帶入試算表 ID、可直接貼到 Apps Script 的版本。
- `集集興農_Google試算表_GAS部署指南.md`：Google 試算表與 GAS 部署步驟。

GAS `/exec` 網址不放入 GitHub，請在網站管理頁或主機環境中另行設定。
