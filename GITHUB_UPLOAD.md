# GitHub 上傳說明｜notemaker/jijisinon

本 repository 是集集興農產品速查網的 Node.js 應用程式原始碼，亦可作為一般 Node.js 主機或自有伺服器的部署來源。

## Repository 結構

第一層直接包含：

```text
package.json
server.js
public/
gas/
```

啟動命令：

```bash
npm start
```

應用程式會讀取主機提供的 `PORT` 環境變數，未提供時預設使用 `3000`。

## 不要上傳的內容

`.gitignore` 已排除 `node_modules`、`.env`、密碼與日誌。不要將 Manus OAuth Secret、JWT Secret 或私人 GAS 設定放入 repository。

目前公告管理仍包含前端解鎖邏輯，因此建議將 `notemaker/jijisinon` 設為 **Private repository**，不要設為 Public。前端密碼保護不等同伺服器端權限；正式公開原始碼前，應改成完全使用伺服器端權限驗證。

## GAS 相關檔案

- `gas/Code.gs`：專案內的 GAS 程式。
- `集集興農_GAS_可直接貼上版.gs`：帶入試算表 ID、可直接貼到 Apps Script 的版本。
- `集集興農_Google試算表_GAS部署指南.md`：Google 試算表與 GAS 部署步驟。

GAS `/exec` 網址不放入 GitHub，請在網站管理頁或部署環境中另行設定。

## 基本檢查

```bash
npm install
npm start
```

啟動後可檢查：

```text
/
/healthz
/manus-routes.json
```
