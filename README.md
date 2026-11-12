# 集集興農產品速查網

第一階段以手機優先的產品查找前台，加上 Google 試算表＋Apps Script 的初期資料來源入口。

## 本機／Preview

```bash
npm run dev
```

網站預設監聽 `0.0.0.0:3000`。

## 目前資料模式

- 未設定 GAS `/exec` 時：使用內建示範資料；管理後台新增資料只保存於目前瀏覽器的 localStorage，供介面驗證。
- 設定 GAS `/exec` 後：前台使用 JSONP `list` 讀取已上架產品；新增／狀態更新透過 text/plain POST 加 requestId，再用 `status` 輪詢確認結果。

## 登入與管理權限

- 網站使用 Manus OAuth 伺服器端登入流程。
- 只有 `notemaker@gmail.com` 可以登入管理功能。
- 未登入時頁首只顯示「登入」；「資料來源」與「管理後台」會隱藏，直接開啟受保護路由也會顯示登入提示。
- 登入 Session 使用 `webdev_app_session` HttpOnly Cookie；正式 Preview／網站以 `SameSite=None; Secure` 傳送。
- 伺服器相關路由：`/auth/login`、`/auth/callback`、`/auth/me`、`/auth/logout`；健康檢查為 `/healthz`。

## 真實後台

請依 `gas/README.md` 部署 `gas/Code.gs`。沒有收到店家正式 `/exec` 網址前，不宣稱已完成真實 Google 試算表讀寫驗收。

## 第一階段頁面

- `#/home`：首頁與四大分類
- `#/category/:categorySlug`：大分類
- `#/category/:categorySlug/:subCategorySlug`：子分類產品列表
- `#/products/:productId`：產品詳情
- `#/consultation`：諮詢清單預留
- `#/settings`：GAS 連線設定
- `#/admin`：初期產品新增／上架／下架
