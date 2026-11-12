# Google 試算表＋GAS 初期後台

## 產品工作表欄位

`Code.gs` 的 `setup()` 會建立名為 `產品` 的工作表，第一列欄位如下：

```text
id | name | slug | categorySlug | categoryName | subCategory | summary | imageUrl | tags | crops | purpose | ingredients | specifications | usage | dilution | precautions | status | sortOrder | updatedAt | createdAt
```

`status` 使用 `draft`、`published`、`unpublished`、`archived`。前台使用 `list` 只回傳 `published`；管理後台使用受同一 `/exec` 保護的 `all` 讀取全部狀態，以便下架後仍可重新上架。

`setup()` 同時建立 `公告` 工作表，欄位為 `key | value | updatedAt`。網站連線 GAS 後，首頁會用 `action=announcement` 讀取公告；公告設定儲存時會用 `saveAnnouncement` 寫回這個工作表，因此桌機、手機與平板可讀取同一份公告。

## 部署步驟

1. 建立一份專用 Google 試算表。
2. 選擇「擴充功能 → Apps Script」，將 `Code.gs` 內容貼入。
3. 在 `CONFIG.SPREADSHEET_ID` 填入試算表 ID；不要把 ID 放在公開前端。
4. 執行 `setup()`，完成 Google 授權。
5. 選擇「部署 → 新增部署 → 網頁應用程式」。
6. 執行身分選「我」；誰可以存取選「任何人」。
7. 複製正式 `/exec` 網址，不要使用 `/dev`。
8. 回到網站「資料來源」頁貼上 `/exec`，儲存並測試連線。
9. 公告管理頁儲存設定時，確認畫面顯示「首頁公告已同步到 Google 試算表」。

## 安全限制

初期 GAS Web App 沒有細緻的使用者登入與角色權限。任何取得 `/exec` 網址的人可能讀取、新增或修改資料，因此應把網址視為私密能力連結。正式營運且需要多人權限、審核與個資保護時，應升級為具備驗證的後端。

## 圖片

公告圖片可由前台選取或貼上 HTTPS 圖片網址。選取圖片後，前台會以 Base64 傳給 GAS；GAS 會將圖片上傳至 `集集興農產品圖片` Google Drive 資料夾，設定為「知道連結的任何人可檢視」，再把可讀取的 Drive 圖片網址寫入 `公告` 工作表的 `imageUrl`。請先確認 Drive 共用政策與圖片公開範圍，避免把含有敏感資訊的檔案公開。
