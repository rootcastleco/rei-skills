/* No-network smoke and security checks for the opt-in PaperOrchestra bridge. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const bridge = path.join(root, 'skills/rei-paper-orchestra/scripts/paper_orchestra_bridge.py');
const python = process.env.PYTHON || 'python3';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rei-paper-orchestra-'));
const mkdir = name => { const p = path.join(tmp, name); fs.mkdirSync(p, {recursive: true}); return p; };
const upstream = mkdir('upstream');
const raw = mkdir('raw');
const template = mkdir('template');
mkdir('outputs');
const output = path.join(tmp, 'outputs', 'run');
const args = ['--upstream', upstream, '--raw-materials', raw, '--template', template, '--output', output, '--python', python];
const run = (extra=[], env={}) => cp.spawnSync(python, [bridge, ...args, ...extra], {encoding:'utf8', env: {...process.env, ...env}});
try {
  fs.writeFileSync(path.join(raw, 'idea_sparse.md'), 'Real research idea.');
  fs.writeFileSync(path.join(raw, 'experimental_log.md'), 'Real measurements.');
  fs.writeFileSync(path.join(template, 'template.tex'), '\\documentclass{article}');
  fs.writeFileSync(path.join(template, 'guidelines.md'), 'Conference formatting');
  fs.writeFileSync(path.join(upstream, 'paper_writing_cli.py'), [
    'import pathlib,sys',
    'out=pathlib.Path(sys.argv[sys.argv.index("--output_dir")+1])',
    '(out/"final_paper.pdf").write_bytes(b"%PDF-1.4\\nmock")'
  ].join('\n'));
  let result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PREVIEW/);
  assert.equal(fs.existsSync(output), false, 'preview must not create output');
  result = run(['--execute'], {GEMINI_API_KEY:'MOCK_SECRET'});
  assert.equal(result.status, 2, 'explicit approval required');
  assert.equal(fs.existsSync(output), false);
  result = run(['--execute','--confirm-remote-processing'], {GEMINI_API_KEY:'MOCK_SECRET'});
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(output,'rei_paper_orchestra_run.json'), 'utf8'));
  assert.equal(manifest.status, 'PASS');
  assert.match(manifest.input_hashes.idea_sha256, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(manifest).includes('MOCK_SECRET'), false);
  result = run(['--execute','--confirm-remote-processing'], {GEMINI_API_KEY:'MOCK_SECRET'});
  assert.equal(result.status, 2, 'existing output must not be overwritten');
  result = run(['--idea-filename','../.env']);
  assert.equal(result.status, 2, 'path traversal must fail');
  console.log('PaperOrchestra: 6 smoke/security assertions PASS');
} finally {
  fs.rmSync(tmp, {recursive:true, force:true});
}
