#!/usr/bin/env python3
"""Repair imported skills' referenced files and license notices using pinned upstream snapshots."""
import base64
import concurrent.futures
import hashlib
import json
import pathlib
import posixpath
import re
import subprocess
from urllib.parse import quote

ROOT=pathlib.Path(__file__).resolve().parents[1]
REG=ROOT/"data/rei67-import-provenance.json"
DATA=json.loads(REG.read_text())
LRE=re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
ALLOWED={".md",".txt",".yaml",".yml",".json",".csv",".sql",".tm7"}
LIMIT_PER_SKILL=15
ROOT_LICENSES={}
def download(url,limit=140000):
    cmd=["/usr/bin/curl","-fLsS","--max-time","25","--retry","1","-H","User-Agent: REI-Skills-License-Verification",url]
    p=subprocess.run(cmd,capture_output=True,timeout=34)
    if p.returncode: raise RuntimeError("unavailable")
    if len(p.stdout)>limit: raise ValueError("oversized")
    return p.stdout
def get_root_license(repo,rev):
    for name in ("LICENSE","LICENSE.md","LICENSE.txt","LICENCE"):
        url="https://raw.githubusercontent.com/"+repo+"/"+rev+"/"+name
        try:
            data=download(url,60000)
            if len(data)>100: return name,data
        except (RuntimeError,ValueError): pass
    raise RuntimeError("No upstream license file found "+repo)
def process(entry):
    slug=entry["id"]
    folder=ROOT/"skills"/slug
    skill=folder/"SKILL.md"
    content=skill.read_text()
    repo=entry["repo"]
    rev=entry["sha"]
    upstream_parent=posixpath.dirname(entry["path"])
    refs=[]; replaced=[]
    def edit(m):
        display,dest=m.group(1),m.group(2)
        if dest.startswith(("http://","https://","mailto:","#","/","<",">","data:")): return m.group(0)
        base,sep,anchor=dest.partition("#")
        base=base.strip()
        if not base: return m.group(0)
        if not base or re.search(r'[\s{}*<>|]',base) or base=="...":
            replaced.append(dest)
            return display
        target_path=(folder/base).resolve()
        if target_path.is_file(): return m.group(0)
        if folder.resolve() not in target_path.parents:
            remote=posixpath.normpath(posixpath.join(upstream_parent,base))
            if remote.startswith("../"): return display
            replaced.append(dest)
            return "["+display+"](https://github.com/"+repo+"/blob/"+rev+"/"+quote(remote,safe="/")+(sep+anchor if sep else "")+")"
        upstream=posixpath.normpath(posixpath.join(upstream_parent,base))
        if upstream.startswith("../"): return display
        suffix=pathlib.Path(base).suffix.lower()
        if suffix in ALLOWED and len(refs)<LIMIT_PER_SKILL:
            try:
                b=download("https://raw.githubusercontent.com/"+repo+"/"+rev+"/"+quote(upstream,safe="/"))
                target_path.parent.mkdir(parents=True,exist_ok=True)
                target_path.write_bytes(b)
                refs.append({"path":base,"sha256":hashlib.sha256(b).hexdigest(),"bytes":len(b)})
                return m.group(0)
            except (RuntimeError,ValueError): pass
        replaced.append(dest)
        return "["+display+"](https://github.com/"+repo+"/blob/"+rev+"/"+quote(upstream,safe="/")+(sep+anchor if sep else "")+")"
    changed=LRE.sub(edit,content)
    if "For active security testing, explicit authorization" not in changed:
        marker="## REI provenance and safety boundary\n\n"
        assert marker in changed,slug
        changed=changed.replace(marker,marker+"For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.\n\n",1)
    skill.write_text(changed)
    entry["contentSha256"]=hashlib.sha256(changed.encode()).hexdigest()
    entry["referencesIncluded"]=refs
    entry["externalReferences"]=len(replaced)
    return slug,len(refs),len(replaced)
def main():
    licdir=ROOT/"data/third-party-licenses"
    licdir.mkdir(exist_ok=True)
    for row in DATA["repositories"]:
        repo,rev=row["repo"],row["revision"]
        source,b=get_root_license(repo,rev)
        foldername=repo.replace("/","--")
        dest=licdir/(foldername+".LICENSE")
        dest.write_bytes(b)
        ROOT_LICENSES[repo]={"path":str(dest.relative_to(ROOT)),"sha256":hashlib.sha256(b).hexdigest(),"source":source,"revision":rev}
    print("LICENSES",len(ROOT_LICENSES),flush=True)
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for n,res in enumerate(pool.map(process,DATA["imported"]),1):
            results.append(res)
            if n%40==0: print("REFS",n,flush=True)
    DATA["licenses"]=ROOT_LICENSES
    REG.write_text(json.dumps(DATA,indent=2,ensure_ascii=False)+"\n")
    print("completed",len(results),"downloaded",sum(x[1] for x in results),"remote links",sum(x[2] for x in results))
if __name__=="__main__": main()
