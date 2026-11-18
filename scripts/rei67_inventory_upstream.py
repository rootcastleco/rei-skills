#!/usr/bin/env python3
import json, subprocess, pathlib, sys
REPOS=['affaan-m/ECC','addyosmani/agent-skills','K-Dense-AI/scientific-agent-skills','alirezarezvani/claude-skills','google/skills','github/awesome-copilot','softaworks/agent-toolkit','twostraws/Swift-Agent-Skills']
def fetch(url):
 p=subprocess.run(['curl','-fsSL','--max-time','45','-H','Accept: application/vnd.github+json','-H','User-Agent: REI-Skills-Curation',url],capture_output=True,text=True)
 if p.returncode: raise RuntimeError(p.stderr[:150])
 return json.loads(p.stdout)
current={p.parent.name for p in pathlib.Path('skills').glob('*/SKILL.md')}
all_rows=[]
for rep in REPOS:
 try:
  repo=fetch('https://api.github.com/repos/'+rep)
  tree=fetch('https://api.github.com/repos/'+rep+'/git/trees/'+repo['default_branch']+'?recursive=1')
  paths=[x['path'] for x in tree.get('tree',[]) if x.get('type')=='blob' and x['path'].endswith('/SKILL.md') and not x['path'].startswith(('.','vendor/','node_modules/','docs/','examples/','tests/','test/'))]
  direct=[p for p in paths if p.startswith(('skills/','agents/','subagents/')) and p.count('/')<=4]
  new=[p for p in direct if p.split('/')[-2] not in current]
  row={'repo':rep,'stars':repo.get('stargazers_count'),'license':repo.get('license',{}).get('spdx_id') if repo.get('license') else None,'sha':tree.get('sha'),'truncated':tree.get('truncated',False),'total_skil_files':len(paths),'direct_skill_files':len(direct),'new_by_id':len(new),'sample_new':new[:25],'paths':direct}
  all_rows.append(row)
  print(json.dumps({k:v for k,v in row.items() if k!='paths'},ensure_ascii=False))
 except Exception as e:
  print(json.dumps({'repo':rep,'error':str(e)}))
pathlib.Path('/tmp/rei67-upstreams.json').write_text(json.dumps(all_rows,indent=2),encoding='utf-8')
