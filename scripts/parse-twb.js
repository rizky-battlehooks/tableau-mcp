#!/usr/bin/env node
/*
  Quick parser for Tableau TWB to extract calculated fields using xmldom.
  Usage: node scripts/parse-twb.js <path-to-twb> [--limit N]
*/

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

function parseWorkbookXml(xmlContent) {
  const calculatedFields = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const columnElements = doc.getElementsByTagName('column');
  for (let i = 0; i < columnElements.length; i++) {
    const column = columnElements[i];
    const calculationElements = column.getElementsByTagName('calculation');
    if (calculationElements.length > 0) {
      const calculation = calculationElements[0];
      if (calculation.getAttribute('class') === 'tableau') {
        const formula = calculation.getAttribute('formula');
        if (formula) {
          calculatedFields.push({
            name: column.getAttribute('name') || '',
            caption: column.getAttribute('caption') || null,
            datatype: column.getAttribute('datatype') || null,
            role: column.getAttribute('role') || null,
            type: column.getAttribute('type') || null,
            formula,
          });
        }
      }
    }
  }
  return calculatedFields;
}

function truncate(s, n = 140) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function summarize(fields, limit = 20) {
  const byDatatype = {};
  const byRole = {};
  for (const f of fields) {
    byDatatype[f.datatype || 'null'] = (byDatatype[f.datatype || 'null'] || 0) + 1;
    byRole[f.role || 'null'] = (byRole[f.role || 'null'] || 0) + 1;
  }
  return {
    totalCalculatedFields: fields.length,
    byDatatype,
    byRole,
    sample: fields.slice(0, limit).map(f => ({
      name: f.name,
      caption: f.caption,
      datatype: f.datatype,
      role: f.role,
      type: f.type,
      formula: truncate(f.formula, 200),
    })),
  };
}

async function main() {
  const [, , twbArg, ...rest] = process.argv;
  if (!twbArg) {
    console.error('Usage: node scripts/parse-twb.js <path-to-twb> [--limit N]');
    process.exit(1);
  }
  const limitIdx = rest.indexOf('--limit');
  let limit = 20;
  if (limitIdx !== -1 && rest[limitIdx + 1]) {
    const n = Number(rest[limitIdx + 1]);
    if (Number.isFinite(n) && n > 0) limit = n;
  }

  const twbPath = path.resolve(process.cwd(), twbArg);
  const xmlContent = fs.readFileSync(twbPath, 'utf8');
  const fields = parseWorkbookXml(xmlContent);
  const summary = summarize(fields, limit);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
