# 公文規則新增頁（Google Apps Script）

此新增頁以 Apps Script 直接寫入 Google Drive，適合由不同電腦登入同一個 Google 帳號使用。Google Drive MCP 連線不會轉交給公開 GitHub Pages；不要把 OAuth token、密碼或 API key 放進網站原始碼。

## 一次性啟用

1. 在瀏覽器登入要使用的 Google 帳號，開啟 [Google Apps Script](https://script.google.com/home/start) 並建立新專案。
2. 將 `Code.gs` 的內容貼到 Apps Script 編輯器中的 `Code.gs`。
3. 新增 HTML 檔案，命名為 `Index`，貼入 `Index.html` 的內容。
4. 部署 → 新增部署作業 → 網頁應用程式。
5. 在「專案設定」的「指令碼屬性」新增 `AUTHORIZED_EMAIL`，值填入要授權的 Google 帳號電子郵件。
6. 部署 → 新增部署作業 → 網頁應用程式；執行身分選「存取網頁應用程式的使用者」，存取權限選「僅限我本人」。不要選任何人或匿名。
7. 使用該帳號開啟部署網址並授權 Google Drive 存取。首次開啟會在該帳號的雲端硬碟建立 `公文撰寫規則庫.md`。
8. 將部署網址回填到行政工具箱的規則管理入口，才能由該入口開啟這個登入頁。

Apps Script 只允許「本人」進入；伺服器端也會再次核對登入信箱。新增內容只會寫入 MD 的「待核驗規則」紀錄，不會自行宣告為現行規範。確認依據、版本與適用範圍後，才由人工／助理移到「正式規則」。

