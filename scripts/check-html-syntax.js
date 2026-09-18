// Syntax-check all inline <script> blocks in the modified index.html
const fs = require('fs');
const path = '/home/z/my-project/scripts/upsc-app/index.html';
const html = fs.readFileSync(path, 'utf8');

// Extract inline scripts (skip src= ones)
const scripts = [];
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, idx = 0;
while ((m = re.exec(html)) !== null) {
  idx++;
  scripts.push({ n: idx, code: m[1] });
}

console.log(`Found ${scripts.length} inline script blocks`);
let fail = 0;
for (const s of scripts) {
  try {
    new Function(s.code);
    console.log(`  Script #${s.n}: OK (${s.code.length} chars)`);
  } catch (e) {
    fail++;
    console.error(`  Script #${s.n}: SYNTAX ERROR — ${e.message}`);
    // locate approximate line
    const lines = s.code.split('\n');
    console.error(`    (block has ${lines.length} lines)`);
  }
}

// Sanity: required symbols present
const checks = ['function showScreen', 'IVHome.entry', 'IV.startListening', 'IVTTS.speak', 'buildUPSC', 'interviewLive', 'ivmock', 'isPremium()'];
for (const c of checks) {
  console.log(`  contains "${c}": ${html.includes(c)}`);
}

// Count lines
console.log(`Total file lines: ${html.split('\n').length}`);
process.exit(fail ? 1 : 0);
