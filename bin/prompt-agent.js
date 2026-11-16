#!/usr/bin/env node
"use strict";
const { syncArchive, loadSnapshot, composePrompt, createImprovementProposal } = require("../lib/prompt-archive");
async function main(args = process.argv.slice(2)) {
  const [command, ...words] = args;
  if (command === "sync") {
    console.log(JSON.stringify(await syncArchive(), null, 2));
  } else if (command === "compose") {
    console.log(JSON.stringify(composePrompt(words.join(" "), loadSnapshot()), null, 2));
  } else if (command === "propose") {
    const split = words.indexOf("--feedback");
    if (split < 1 || split === words.length - 1) throw Error("Usage: propose TASK --feedback FEEDBACK");
    console.log(JSON.stringify(createImprovementProposal(words.slice(0,split).join(" "),
      words.slice(split+1).join(" "), loadSnapshot()), null, 2));
  } else {
    console.log("Usage: rei-skills-prompt sync | compose TASK | propose TASK --feedback FEEDBACK");
    if (command && command !== "--help") process.exitCode = 2;
  }
}
main().catch(e => { console.error("REI Prompt Archive: " + e.message); process.exitCode = 1; });
