const RULES_FILE_NAME = '公文撰寫規則庫.md';
const RULES_FILE_ID_KEY = 'DOCUMENT_RULES_FILE_ID';

function doGet(e) {
  const view = e && e.parameter && e.parameter.view;
  if (view === 'training-public') {
    return HtmlService.createHtmlOutputFromFile('TrainingPublic')
      .setTitle('研習資料公開查詢')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  assertAllowedUser_();
  const isTraining = view === 'training';
  return HtmlService.createHtmlOutputFromFile(isTraining ? 'Training' : 'Index')
    .setTitle(isTraining ? '研習資料管理' : '公文規則新增')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getRuleFileInfo() {
  assertAllowedUser_();
  const file = getOrCreateRulesFile_();
  return { name: file.getName(), url: file.getUrl() };
}

function submitRule(form) {
  assertAllowedUser_();
  const rule = clean_(form && form.rule, 6000);
  const category = clean_(form && form.category, 100);
  const scope = clean_(form && form.scope, 1000);
  const source = clean_(form && form.source, 2000);
  const date = clean_(form && form.date, 100);
  if (!rule) throw new Error('請貼上要新增的規則內容。');

  const file = getOrCreateRulesFile_();
  const stamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  const id = Utilities.getUuid();
  const block = [
    '',
    `### 待核驗規則｜${stamp}`,
    `- 編號：${id}`,
    `- 狀態：待核驗（尚未納入正式有效規則）`,
    `- 類別：${category || '未分類'}`,
    `- 適用範圍：${scope || '待確認'}`,
    `- 依據日期／版本：${date || '未提供'}`,
    `- 來源：${source || '未提供；須補官方或校內依據'}`,
    '',
    rule,
    ''
  ].join('\n');
  const current = file.getBlob().getDataAsString('UTF-8');
  file.setContent(current + block);
  return { ok: true, id: id, name: file.getName(), url: file.getUrl(), status: '待核驗' };
}

function getTrainingRecords() {
  assertAllowedUser_();
  const sheet = getTrainingSheet_();
  const rows = sheet.getDataRange().getDisplayValues().slice(1).filter(r => r[0]);
  return rows.map(r => ({
    id:r[0], publish:r[1] === 'TRUE', title:r[2], category:r[3], organizer:r[4], date:r[5], place:r[6],
    hours:r[7], fee:r[8], link:r[9], tags:r[10], summary:r[11], notes:r[12],
    attachments:parseJson_(r[13], []), created:r[14], updated:r[15]
  })).reverse();
}

function getPublicTrainingRecords() {
  const sheet = getTrainingSheet_();
  const rows = sheet.getDataRange().getDisplayValues().slice(1).filter(r => r[0] && r[1] === 'TRUE');
  return rows.map(r => ({
    title:r[2], category:r[3], organizer:r[4], date:r[5], place:r[6], hours:r[7],
    fee:r[8], link:r[9], tags:r[10], summary:r[11]
  })).reverse();
}

function saveTrainingRecord(record) {
  assertAllowedUser_();
  record = record || {};
  const title = clean_(record.title, 300);
  if (!title) throw new Error('請填寫研習名稱。');
  const sheet = getTrainingSheet_();
  const rows = sheet.getDataRange().getDisplayValues();
  const id = clean_(record.id, 100) || Utilities.getUuid();
  const foundIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
  const existing = foundIndex > 0 ? rows[foundIndex] : [];
  const attachments = parseJson_(existing[13], []);
  const uploads = Array.isArray(record.files) ? record.files : [];
  if (uploads.length > 5) throw new Error('一次最多可上傳 5 個附件。');
  const folder = getTrainingAttachmentFolder_();
  uploads.forEach(item => {
    if (!item || !item.data || !item.name) return;
    const base64 = String(item.data).replace(/^data:[^,]*;base64,/, '');
    if (base64.length > 7 * 1024 * 1024) throw new Error('單一附件須小於 5 MB。');
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, clean_(item.type, 120) || 'application/octet-stream', clean_(item.name, 240));
    const file = folder.createFile(blob);
    attachments.push({ name:file.getName(), url:file.getUrl() });
  });
  const now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  const created = existing[14] || now;
  const values = [
    id, record.publish ? 'TRUE' : 'FALSE', title, clean_(record.category,100), clean_(record.organizer,300), clean_(record.date,100),
    clean_(record.place,300), clean_(record.hours,100), clean_(record.fee,100), clean_(record.link,2000),
    clean_(record.tags,500), clean_(record.summary,6000), clean_(record.notes,12000), JSON.stringify(attachments), created, now
  ].map(sheetSafeText_);
  if (foundIndex > 0) sheet.getRange(foundIndex + 1, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
  return { ok:true, id:id, created:created, updated:now };
}

function getTrainingSheet_() {
  const props = PropertiesService.getScriptProperties();
  const key = 'TRAINING_SPREADSHEET_ID';
  let book;
  const id = props.getProperty(key);
  if (id) {
    try { book = SpreadsheetApp.openById(id); } catch (e) { props.deleteProperty(key); }
  }
  if (!book) {
    book = SpreadsheetApp.create('研習資料庫');
    props.setProperty(key, book.getId());
  }
  let sheet = book.getSheetByName('研習紀錄');
  if (!sheet) sheet = book.getSheets()[0].setName('研習紀錄');
  const headers = ['ID','公開查詢','研習名稱','類別','主辦單位','日期','地點','時數','費用','公開連結','標籤','公開摘要','私人筆記','附件','建立時間','更新時間'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    const oldHeader = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
    if (oldHeader.length === 14 && oldHeader[0] === 'ID') {
      const oldRows = sheet.getDataRange().getDisplayValues().slice(1).filter(r=>r[0]);
      const migrated = oldRows.map(r=>[r[0],'FALSE',r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],'',r[10],r[11],r[12],r[13]]);
      sheet.clearContents();
      sheet.appendRow(headers);
      if (migrated.length) sheet.getRange(2,1,migrated.length,headers.length).setValues(migrated);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getTrainingAttachmentFolder_() {
  const props = PropertiesService.getScriptProperties();
  const key = 'TRAINING_ATTACHMENT_FOLDER_ID';
  const id = props.getProperty(key);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { props.deleteProperty(key); }
  }
  const matches = DriveApp.getRootFolder().getFoldersByName('研習資料附件');
  const folder = matches.hasNext() ? matches.next() : DriveApp.createFolder('研習資料附件');
  props.setProperty(key, folder.getId());
  return folder;
}

function sheetSafeText_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
}

function parseJson_(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch (e) { return fallback; }
}

function getOrCreateRulesFile_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(RULES_FILE_ID_KEY);
  if (id) {
    try { return DriveApp.getFileById(id); } catch (e) { props.deleteProperty(RULES_FILE_ID_KEY); }
  }
  const existing = DriveApp.getRootFolder().getFilesByName(RULES_FILE_NAME);
  if (existing.hasNext()) {
    const file = existing.next();
    props.setProperty(RULES_FILE_ID_KEY, file.getId());
    return file;
  }
  const initial = [
    '# 公文撰寫規則庫',
    '',
    '> 本檔由公文規則新增頁維護。只有「正式規則」區塊經核對後可作為撰稿依據；「待核驗規則」均為提案，不得直接套用。',
    '',
    '## 正式規則',
    '',
    '（核對來源、版本、適用範圍後，由使用者或助理移入本區。）',
    '',
    '## 待核驗規則',
    ''
  ].join('\n');
  const file = DriveApp.createFile(RULES_FILE_NAME, initial, MimeType.PLAIN_TEXT);
  props.setProperty(RULES_FILE_ID_KEY, file.getId());
  return file;
}

function assertAllowedUser_() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const allowed = (PropertiesService.getScriptProperties().getProperty('AUTHORIZED_EMAIL') || '').toLowerCase();
  if (!email || !allowed || email !== allowed) throw new Error('請使用設定的 Google 帳號登入此頁面。');
}

function clean_(value, maxLength) {
  return String(value || '').replace(/\r/g, '').trim().slice(0, maxLength);
}

