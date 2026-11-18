# 公文規則與研習資料管理頁（Google Apps Script）

此管理工具以 Apps Script、Google Drive 與 Google 試算表保存資料，適合由不同電腦登入同一個 Google 帳號使用。Google Drive MCP 連線不會轉交給公開 GitHub Pages；不要把 OAuth token、密碼或 API key 放進網站原始碼。

部署時請使用這三個來源檔：[`Code.gs`](https://github.com/hsiang0422-star/tnmr-school-admin-toolbox/blob/main/rule-admin-app/Code.gs)、[`Index.html`](https://github.com/hsiang0422-star/tnmr-school-admin-toolbox/blob/main/rule-admin-app/Index.html)、[`Training.html`](https://github.com/hsiang0422-star/tnmr-school-admin-toolbox/blob/main/rule-admin-app/Training.html)。

## 一次性啟用

1. 在瀏覽器登入 yenju94 Google 帳號，開啟 [Google Apps Script](https://script.google.com/home/start) 並建立新專案。
2. 將 `Code.gs` 的內容貼到 Apps Script 編輯器中的 `Code.gs`。
3. 新增 HTML 檔案，依序命名為 `Index`、`Training`、`TrainingPublic`，分別貼入三個同名 HTML 檔的內容。
4. 在「專案設定」的「指令碼屬性」新增 `AUTHORIZED_EMAIL`，值設為 `yenju94@gmail.com`。
5. 建立**私人管理部署**：部署為網頁應用程式，執行身分選「存取網頁應用程式的使用者」，存取權限選「僅限我本人」。此網址提供規則新增與研習資料管理。
6. 再建立**公開查詢部署**：執行身分選「我」，存取權限選可匿名使用的「所有人」。此網址只供 `training-public` 查詢；公開程式只回傳勾選公開的欄位。若帳戶政策不允許匿名部署，公開查詢需改由可匿名存取的平台提供，不能把 Drive 檔案改成公開來繞過限制。
7. 使用 yenju94 開啟私人管理網址並授權 Google Drive 與試算表存取。首次開啟規則頁會建立或連接 `公文撰寫規則庫.md`；首次開啟研習管理頁會建立私人 `研習資料庫` 試算表及私人附件資料夾。
8. 將私人管理網址及公開查詢網址提供給網站維護者固定接入入口；兩個部署網址權限不同，不可互換。

私人管理部署只允許「本人」進入，伺服器端也會核對登入信箱。公開部署僅回傳明確勾選公開的研習名稱、類別、主辦單位、日期、地點、時數、費用、公開連結、標籤及公開摘要；私人筆記與附件不會回傳。研習資料本體以 Google 試算表儲存，附件保存在私人 Drive 資料夾。公文規則新增只會寫入 MD 的「待核驗規則」區，未核對前不得視為有效規範。

