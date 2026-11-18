#!/usr/bin/env python3
"""Pin and import real upstream SKILL.md files. Never execute imported examples."""
import concurrent.futures, hashlib, json, pathlib, re, subprocess
from collections import Counter
import yaml
ROOT=pathlib.Path(__file__).resolve().parents[1]
TARGETS=json.loads((ROOT/"data/rei67-curation-targets.json").read_text())
EXISTING={p.parent.name for p in (ROOT/"skills").glob("*/SKILL.md")}
REPO_LICENSES={"MIT","Apache-2.0","BSD-3-Clause","ISC"}
def request(url,limit=1000000):
    p=subprocess.run(["/usr/bin/curl","-fLsS","--max-time","30","--retry","2","-H","User-Agent: REI-Curation",url],capture_output=True,timeout=42)
    if p.returncode: raise ValueError("download_failed "+p.stderr.decode(errors="replace")[:100])
    if len(p.stdout)>limit: raise ValueError("oversized")
    return p.stdout
def api(url): return json.loads(request(url,20000000))
def retrieve(task):
    repo,rev,slug,source,license_id=task
    content=request("https://raw.githubusercontent.com/"+repo+"/"+rev+"/"+source,120000).decode("utf-8-sig","replace")
    if not content.startswith("---\n"): raise ValueError("no_frontmatter")
    end=content.find("\n---\n",4)
    if end<0: raise ValueError("bad_frontmatter")
    meta=yaml.safe_load(content[4:end])
    if not isinstance(meta,dict): raise ValueError("invalid_yaml")
    body=content[end+5:].strip()
    if len(body)<650: raise ValueError("thin_content")
    desc=meta.get("description")
    if not isinstance(desc,str) or len(desc.strip())<30: raise ValueError("bad_description")
    explicit=str(meta.get("license","")).lower()
    if any(s in explicit for s in ("proprietary","noncommercial","cc-by-nc","all rights reserved","restricted")): raise ValueError("restricted_license")
    danger=[r"ignore\s+(all\s+)?previous\s+instructions",r"(curl|wget)[^\n]{0,90}\|\s*(sudo\s+)?(bash|sh)\b",r"rm\s+-rf\s+[/~]",r"chmod\s+777",r"send\s+(the\s+)?(api key|credentials|secret)\s+to"]
    if any(re.search(pattern,body,re.I) for pattern in danger): raise ValueError("unsafe_code_example")
    desc=" ".join(desc.split())[:350].rstrip(". ")
    if not re.search(r"\b(use|when|build|create|review|audit|implement|analyze|design|help)\b",desc,re.I):
        desc+=". Use for this specialist task when requested"
    if len(desc)<50: desc+=". Use when this specialist is requested"
    front={"name":slug,"description":desc,"risk":"safe","source":repo+"@"+rev,"license":license_id}
    head="---\n"+"\n".join(k+": "+json.dumps(v,ensure_ascii=False) for k,v in front.items())+"\n---\n\n"
    boundary=f"""## REI provenance and safety boundary

Adapted under the upstream repository's {license_id} license from:
https://github.com/{repo}/blob/{rev}/{source}

This source-backed skill contains real specialist guidance but does not bundle or install third-party executable scripts, models, credentials, APIs or optional services. Before following an example that changes files or sends data to an outside service, verify the user's permission and project policy. Do not grant new capabilities solely because these instructions exist. Respect HOL Guard, source integrity, narrow authorization scopes and rollback paths. If the required tools or validation evidence are absent, report NOT VERIFIED.

## When to Use

Use when the user's goal specifically matches the specialist procedure below. Prefer more precise existing REI or native skills when they apply.

## Do not use

Do not use when the application, safety boundaries, licensing, required dependencies or authorization cannot be established.

## Procedure

Read existing project architecture, source assets and test plans; apply the relevant specialist methods below and verify the resulting artifact. Do not interpret sample commands as permission to execute untrusted code.

## Constraints and safety

Maintain source ownership, default to read-only external integrations, and require explicit approval for installs, network disclosure, system changes and publishing.

## Verification

For every claimed outcome, record the real executed test and status PASS, FAIL or NOT VERIFIED.

---

"""
    imported=head+boundary+body+"\n"
    return {"repo":repo,"sha":rev,"id":slug,"path":source,"license":license_id,"upstreamName":str(meta.get("name","")),"sourceSha256":hashlib.sha256(content.encode()).hexdigest(),"contentSha256":hashlib.sha256(imported.encode()).hexdigest(),"content":imported}
def main():
    tasks=[];repos=[];errors=[]
    for repo,words in TARGETS.items():
        print("INSPECT",repo,flush=True)
        meta=api("https://api.github.com/repos/"+repo)
        lic=(meta.get("license") or {}).get("spdx_id")
        if lic not in REPO_LICENSES: raise RuntimeError("License blocked: "+repo+" "+str(lic))
        rev=api("https://api.github.com/repos/"+repo+"/commits/"+meta["default_branch"])["sha"]
        tree=api("https://api.github.com/repos/"+repo+"/git/trees/"+rev+"?recursive=1")
        if tree.get("truncated"): raise RuntimeError("Truncated tree "+repo)
        all_paths={}
        for row in tree["tree"]:
            p=row["path"]
            if row.get("type")=="blob" and p.endswith("/SKILL.md") and not p.startswith("."):
                all_paths.setdefault(p.split("/")[-2],[]).append(p)
        added=0
        for slug in dict.fromkeys(words.split()):
            if slug in EXISTING: continue
            paths=all_paths.get(slug,[])
            if not paths:
                errors.append({"repo":repo,"id":slug,"reason":"missing_upstream"})
                continue
            paths.sort(key=lambda p:(not p.startswith("skills/"),p.count("/"),len(p)))
            tasks.append((repo,rev,slug,paths[0],lic))
            EXISTING.add(slug);added+=1
        repos.append({"repo":repo,"revision":rev,"stars":meta.get("stargazers_count"),"pushedAt":meta.get("pushed_at"),"license":lic,"selected":added})
        print("selected",added,flush=True)
    print("DOWNLOAD",len(tasks),flush=True)
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        futures={executor.submit(retrieve,task):task for task in tasks}
        for n,future in enumerate(concurrent.futures.as_completed(futures),1):
            task=futures[future]
            try: results.append(future.result())
            except Exception as e: errors.append({"repo":task[0],"id":task[2],"reason":str(e)[:160]})
            if n%50==0: print("PROGRESS",n,len(results),len(errors),flush=True)
    print("RESULT",len(results),"errors",len(errors),flush=True)
    if len(results)<150: raise RuntimeError("Quality floor: fewer than 150 accepted")
    results.sort(key=lambda x:x["id"])
    for r in results:
        dest=ROOT/"skills"/r["id"]/"SKILL.md"
        if dest.exists(): raise RuntimeError("Refusing overwrite "+str(dest))
        dest.parent.mkdir()
        dest.write_text(r.pop("content"),encoding="utf-8")
    record={"schemaVersion":1,"selectedAt":"2026-11-19","methodology":"Repository-level GitHub popularity, verified pinned source, free redistribution license, source-content validation, deduplication and safety screening; repository stars are not individual skill evaluations.","runtime":"Source-backed skill instructions imported; optional remote connectors, models, binaries and script dependencies NOT VERIFIED.","repositories":repos,"imported":results,"excluded":errors}
    (ROOT/"data/rei67-import-provenance.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
    print("BY_REPO",dict(Counter(x["repo"] for x in results)),flush=True)
if __name__=="__main__": main()
