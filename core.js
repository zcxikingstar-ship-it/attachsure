/* AttachSure: deterministic metadata/message checks. Does not read file contents. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AttachSure = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_FILES = 10000;
  const MAX_TEXT = 1000000;
  const ATTACHMENT_TERMS = /(?:\b(?:attach(?:ed|ment|ments)?|enclos(?:e|ed|ure)|included?)\b|附件|附上|附档|附檔|随信|隨信|见附件|見附件)/i;
  const FILE_REFERENCE = /(?:^|[\s"'“”‘’`（(\[])((?:[^\s<>:"|?*\\/]+[\\/])?[^\s<>:"|?*\\/]+\.(?:pdf|docx?|xlsx?|xls|pptx?|ppt|csv|zip|rar|7z|txt|md|png|jpe?g|webp|gif|mp4|mov|mp3|wav|json|xml|dwg|psd|ai))(?:$|[\s"'“”‘’`），,.。;；:：!?！？\])])/gi;
  function normal(value) { return value.normalize('NFC').toLowerCase(); }
  function cleanFile(file) {
    if (!file || typeof file.name !== 'string' || !file.name || !Number.isFinite(file.size) || file.size < 0) throw new Error('Invalid file metadata');
    return { name: file.name, size: file.size, path: file.path || file.webkitRelativePath || file.name };
  }
  function references(text) {
    const found = [], seen = new Set();
    const source = text || '';
    let match;
    FILE_REFERENCE.lastIndex = 0;
    while ((match = FILE_REFERENCE.exec(source))) {
      const value = match[1].trim(); const key = normal(value);
      if (!seen.has(key)) { seen.add(key); found.push(value); }
    }
    return found;
  }
  function analyze(message, files) {
    if (typeof message !== 'string' || message.length > MAX_TEXT) throw new Error('Message limit: 1,000,000 characters');
    if (!Array.isArray(files) || files.length > MAX_FILES) throw new Error('File limit: 10,000');
    const selected = files.map(cleanFile);
    const named = references(message);
    const keys = new Set(selected.map(f => normal(f.name)));
    const mentionedAttachment = ATTACHMENT_TERMS.test(message);
    const missingNamed = named.filter(name => !keys.has(normal(name)));
    const zeroByte = selected.filter(f => f.size === 0);
    const suspicious = selected.filter(f => /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(f.name));
    const duplicates = [];
    const grouped = new Map();
    selected.forEach(f => { const key = normal(f.name); grouped.set(key, [...(grouped.get(key) || []), f]); });
    for (const group of grouped.values()) if (group.length > 1) duplicates.push(group);
    const blockers = [];
    if (mentionedAttachment && !selected.length) blockers.push('mention-without-file');
    if (missingNamed.length) blockers.push('named-file-not-selected');
    if (zeroByte.length) blockers.push('zero-byte');
    if (suspicious.length) blockers.push('unsafe-name');
    const advisories = [];
    if (selected.length && !mentionedAttachment && !named.length) advisories.push('files-without-message-mention');
    if (duplicates.length) advisories.push('duplicate-name');
    return { version: 1, message, files: selected, selectedCount: selected.length, mentionedAttachment, namedReferences: named,
      missingNamed, zeroByte, suspicious, duplicates, blockers, advisories,
      ready: selected.length > 0 && blockers.length === 0 };
  }
  function size(bytes, language = 'en') {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB']; let value = bytes; let i = 0;
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
    return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
  }
  function attachmentBlock(files, language = 'en') {
    const zh = language === 'zh';
    const heading = zh ? `附件（${files.length} 个）` : `Attachments (${files.length})`;
    return [heading, ...files.map((f, i) => `${i + 1}. ${f.name} (${size(f.size, language)})`)].join('\n');
  }
  function compose(message, files, language = 'en') {
    const text = (message || '').trim();
    if (!files.length) return text;
    const block = attachmentBlock(files, language);
    return text ? `${text}\n\n${block}` : block;
  }
  function report(result, language = 'en') {
    const zh = language === 'zh'; const t = (en, cn) => zh ? cn : en;
    const lines = [t('AttachSure — pre-send attachment check', 'AttachSure — 发送前附件校验'),
      result.ready ? t('Ready to review and attach manually.', '可继续人工复核并手动添加附件。') : t('Needs attention before sending.', '发送前有待处理项。'),
      t(`Selected: ${result.selectedCount}`, `已选：${result.selectedCount}`),
      t(`Attachment wording detected: ${result.mentionedAttachment ? 'yes' : 'no'}`, `检测到附件表述：${result.mentionedAttachment ? '是' : '否'}`)];
    const section = (title, values) => { if (values.length) lines.push('', title, ...values.map(v => `- ${typeof v === 'string' ? v : v.name}`)); };
    section(t('Message names not selected', '文中点名但未选中'), result.missingNamed);
    section(t('Zero-byte files', '空文件'), result.zeroByte);
    section(t('Unsafe control/directional characters', '含控制或方向字符'), result.suspicious);
    section(t('Duplicate names (manual review)', '同名文件（请人工复核）'), result.duplicates.map(g => g.map(f => f.name).join(' | ')));
    if (result.advisories.includes('files-without-message-mention')) lines.push('', t('- Files selected but the message does not mention attachments.', '- 已选文件，但正文未提及附件。'));
    lines.push('', t('Metadata and message text only. This cannot confirm contents, recipients, upload, or delivery.', '仅处理文件元数据和正文；不确认文件内容、收件人、上传或送达。'));
    return lines.join('\n');
  }
  return { analyze, references, size, attachmentBlock, compose, report, MAX_FILES, MAX_TEXT };
});
