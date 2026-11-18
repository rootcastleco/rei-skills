import pathlib,json
r=pathlib.Path('.')
d=json.loads((r/'data/rei67-import-provenance.json').read_text())
bundles=json.loads((r/'data/curated-expansion-bundles.json').read_text())
sources=d['repositories']
lines=['# REI Skills 6.7.0 — Source-backed expansion','',
 '## Scope and provenance','',
 'This release combines the 20-tool Design Studio, 25-item creative toolkit and high-signal design additions with **274 additional source-backed skills** across engineering, cloud, research, security and business operations. The 274 new entrypoints contain real upstream specialist instructions with REI permission and validation boundaries. They are not empty placeholders.','',
 'GitHub stars represent repository-level attention, not an individual skill quality grade. Snapshot: 19 November 2026. Source file SHA-256 and pinned commits are retained in data/rei67-import-provenance.json.','',
 '| Repository | Stars at curation | License | New skills |','| --- | ---: | --- | ---: |']
for x in sources:
 count=sum(y['repo']==x['repo'] for y in d['imported'])
 lines.append('| ['+x['repo']+'](https://github.com/'+x['repo']+') | '+str(x['stars'])+' | '+x['license']+' | '+str(count)+' |')
lines+=['','## Curated bundles','','| Bundle | Number (overlapping) | Purpose |','| --- | ---: | --- |']
for name,b in bundles.items():lines.append('| '+name+' | '+str(len(b['skills']))+' | '+b['description']+' |')
lines+=['','## Release and evidence gates','',
 '- Pin real upstream files by exact commit SHA and SHA-256, and reject existing names, missing content, unsafe examples and unsuitable licenses.',
 '- Bundle selected Markdown references where present; link to immutable upstream source for unbundled resources. Never execute third-party helper scripts automatically.',
 '- Include upstream license texts in the published npm data/third-party-licenses directory.',
 '- Keep the existing HOL Guard and route on demand to only the 1–5 most relevant skills.',
 '- Run npm run build, npm run validate:strict, npm run security-audit, npm test and npm pack --dry-run.',
 '- Verify data/catalog.json has 1,733 entries after a fresh build and that seven curated bundles survive regeneration.',
 '- Publish through existing GitHub Actions trusted OIDC publishing; independently verify rei-skills@6.7.0 on npm before claiming release.',
 '',
 '## Constraints and rollback','',
 'Source-backed SKILL.md instructions do not guarantee that third-party APIs, paid platforms, binaries, models, or hardware exist. Schema and safety lint PASS does not imply scientific or operational outcomes have been reproduced. Repo star counts are not evidence of per-skill quality.',
 '',
 'Git source can be reverted using the release commit. An already-published npm version is immutable; release a newer corrective patch and avoid destructive npm unpublish.'
]
(r/'docs/REI_SKILLS_670_EXPANSION.md').write_text('\n'.join(lines)+'\n')
p=r/'README.md';s=p.read_text()
h='## REI Skills 6.7.0 — Curated Cross-Domain Expansion'
assert h not in s
s+='\n\n'+h+'\n\n274 source-backed specialist skills and 459 supporting references curated from seven GitHub repositories. Seven optional bundles span scientific research, agent engineering, cloud, defensive security, business operations and developer tooling. **1,733 skills total** after build. This expansion complements the earlier 20-tool Design Studio, 25-skill creative toolkit and high-signal design additions. External services, executable scripts and credentials are not installed.\n\n- [Sources, method and release gates](docs/REI_SKILLS_670_EXPANSION.md)\n- [Pinned hashes and source provenance](data/rei67-import-provenance.json)\n- [Curated cross-domain bundles](data/curated-expansion-bundles.json)\n'
p.write_text(s)
print('Documentation and release overview updated')
