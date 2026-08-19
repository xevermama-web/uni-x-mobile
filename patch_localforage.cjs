const fs = require('fs');
let code = fs.readFileSync('src/hooks/useNotices.ts', 'utf-8');

code = code.replace(/import { useState, useEffect } from 'react';/, `import { useState, useEffect } from 'react';\nimport localforage from 'localforage';`);

const targetGetMeta = `function getNoticeMeta(id: string): Partial<Notice> | null {
  try {
    const raw = localStorage.getItem(\`unixx_notice_meta_\${id}\`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}`;
const replaceGetMeta = `async function getNoticeMeta(id: string): Promise<Partial<Notice> | null> {
  try {
    const raw = await localforage.getItem(\`unixx_notice_meta_\${id}\`);
    if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {}
  return null;
}`;
code = code.split(targetGetMeta).join(replaceGetMeta);

const targetSaveMeta = `function saveNoticeMeta(id: string, meta: Partial<Notice>) {
  try {
    const existing = getNoticeMeta(id) || {};
    const updated = { ...existing, ...meta };
    localStorage.setItem(\`unixx_notice_meta_\${id}\`, JSON.stringify(updated));
  } catch (e) {}
}`;
const replaceSaveMeta = `async function saveNoticeMeta(id: string, meta: Partial<Notice>) {
  try {
    const existing = await getNoticeMeta(id) || {};
    const updated = { ...existing, ...meta };
    await localforage.setItem(\`unixx_notice_meta_\${id}\`, updated);
  } catch (e) {}
}`;
code = code.split(targetSaveMeta).join(replaceSaveMeta);

fs.writeFileSync('src/hooks/useNotices.ts', code);
