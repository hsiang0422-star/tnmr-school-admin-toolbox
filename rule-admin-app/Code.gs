const RULES_FILE_NAME = '公文撰寫規則庫.md';
const RULES_FILE_ID_KEY = 'DOCUMENT_RULES_FILE_ID';

function doGet() {
  assertAllowedUser_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('公文規則新增')
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

function getOrCreateRulesFile_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(RULES_FILE_ID_KEY);
  if (id) {
    try { return DriveApp.getFileById(id); } catch (e) { props.deleteProperty(RULES_FILE_ID_KEY); }
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

