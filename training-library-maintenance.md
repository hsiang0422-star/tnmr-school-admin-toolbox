# 研習資料庫跨電腦維護說明

此資料庫已納入 GitHub 專案，可從任何電腦登入 GitHub 網頁編輯。

## 檔案用途

- `training-library.html`：研習資料庫頁面，提供主題分類、全文搜尋、命中段落標示、Ctrl＋滑鼠滾輪縮放，以及 Google 文件原始預覽；招標資料集中在頁面下方的「招標研習資料庫」區塊。
- `training-library-index.json`：研習文件清單、搜尋內文與主題分類。網站載入時會讀取這個檔案。
- Google 文件原始檔：保存在 Google 雲端硬碟「研習講義」資料夾；JSON 內的 `url` 與 `preview_url` 指向原始文件。

## 從其他電腦更新資料

1. 登入 GitHub，開啟 `hsiang0422-star/tnmr-school-admin-toolbox` 專案。
2. 開啟 `training-library-index.json`，按鉛筆圖示編輯。
3. 依下方格式更新文件標題、段落或分類；新增文件時，在 `documents` 陣列中增加一筆資料。
4. 確認 JSON 的逗號、引號與括號格式正確。
5. 按 **Commit changes** 儲存到 `main` 分支。GitHub Pages 完成更新後，研習資料庫頁面會載入新版索引。

## 文件資料格式

每筆文件資料包含：

- `id`：Google 文件網址中的文件 ID。
- `title`：網站顯示的文件名稱。
- `url`：原始 Google 文件連結。
- `preview_url`：網站內嵌預覽連結。
- `categories`：主題分類，例如 `招標採購與法規`、`工程發包與施工`、`勞動權益與派駐`。
- `paragraphs`：可搜尋的段落；每段有 `text`、`style`、`list` 欄位。

新增文件時，連結格式如下，請把範例 ID 換成 Google 文件的實際 ID：

```json
{
  "id": "Google文件ID",
  "title": "文件名稱",
  "url": "https://docs.google.com/document/d/Google文件ID/edit",
  "preview_url": "https://docs.google.com/document/d/Google文件ID/preview",
  "categories": ["招標採購與法規"],
  "paragraphs": [
    {
      "text": "文件中的段落文字",
      "style": "NORMAL_TEXT",
      "list": false
    }
  ]
}
```

## 注意事項

- 更新 Google 文件後，請同步更新 JSON 的 `paragraphs`，網站全文搜尋才會包含最新文字。
- `style` 可使用 `NORMAL_TEXT`、`HEADING_1`、`HEADING_2` 等 Google Docs 段落樣式；清單段落將 `list` 設為 `true`。
- `updated_at` 請更新為 ISO 日期格式，例如 `2026-11-18`。
- JSON 及網站屬於公開 GitHub 專案；請勿放入個人資料、帳號密碼、私人筆記或不宜公開的內容。
- Google 文件原始預覽仍依 Google 雲端硬碟的分享權限開啟。


## 招標資料庫

招標研習資料已整合在 `training-library.html` 的「招標研習資料庫」區塊，不再使用獨立首頁卡片。招標區直接從 `training-library-index.json` 擷取段落，新增或更新研習索引後會同步更新。

## 職安衛資料

首頁「職安衛資料搜尋」卡片會開啟 `occupational-safety-library.html`。此頁提供職業安全、職業安全衛生、職安衛及職安法的 Google Drive 搜尋入口，搜尋結果仍由已登入帳戶依原始雲端硬碟權限顯示，不會把私人檔案名稱或內容複製到公開 GitHub。
