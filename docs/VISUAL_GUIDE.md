# Visual Quick Start Guide

**Learn by seeing!** This guide uses diagrams and visual examples to help you understand skills.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOU (Developer)                          │
│                          ↓                                  │
│              "Help me build a payment system"               │
│                          ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                  AI ASSISTANT                               │
│                          ↓                                  │
│              Loads @stripe-integration skill                │
│                          ↓                                  │
│         Becomes an expert in Stripe payments                │
│                          ↓                                  │
│    Provides specialized help with code examples             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Repository Structure (Visual)

```
rei-skills/
│
├── 📄 README.md                    ← Overview & skill list
├── 📄 CONTRIBUTING.md              ← How to contribute
│
├── 📁 skills/                      ← All 250+ skills live here
│   │
│   ├── 📁 brainstorming/
│   │   └── 📄 SKILL.md             ← Skill definition
│   │
│   ├── 📁 stripe-integration/
│   │   ├── 📄 SKILL.md
│   │   └── 📁 examples/            ← Optional extras
│   │
│   └── ... (250+ more skills)
│
├── 📁 scripts/                     ← Validation & management
│   ├── validate_skills.py          ← Quality Bar Enforcer
│   └── generate_index.py           ← Registry Generator
│
├── 📁 .github/
│   └── 📄 MAINTENANCE.md           ← Maintainers Guide
│
└── 📁 docs/                        ← Documentation
    ├── 📄 GETTING_STARTED.md       ← Start here! (NEW)
    ├── 📄 FAQ.md                   ← Troubleshooting
    ├── 📄 BUNDLES.md               ← Starter Packs (NEW)
    ├── 📄 QUALITY_BAR.md           ← Quality Standards
    ├── 📄 SKILL_ANATOMY.md         ← How skills work
    └── 📄 VISUAL_GUIDE.md          ← This file!
```

---

## How Skills Work (Flow Diagram)

```
┌──────────────┐
│ 1. INSTALL   │  Copy skills to .agent/skills/
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 2. INVOKE    │  Type: @skill-name in AI chat
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 3. LOAD      │  AI reads SKILL.md file
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 4. EXECUTE   │  AI follows skill instructions
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 5. RESULT    │  You get specialized help!
└──────────────┘
```

---

## 🎯 Skill Categories (Visual Map)

```
                    ┌─────────────────────────┐
                    │   250+ AWESOME SKILLS   │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐            ┌──────▼──────┐         ┌──────▼──────┐
   │ CREATIVE│            │ DEVELOPMENT │         │  SECURITY   │
   │ (10)    │            │    (25)     │         │    (50)     │
   └────┬────┘            └──────┬──────┘         └──────┬──────┘
        │                        │                        │
   • UI/UX Design          • TDD                    • Ethical Hacking
   • Canvas Art            • Debugging              • Metasploit
   • Themes                • React Patterns         • Burp Suite
                                                    • SQLMap
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐            ┌──────▼──────┐         ┌──────▼──────┐
   │   AI    │            │  DOCUMENTS  │         │  MARKETING  │
   │  (30)   │            │     (4)     │         │    (23)     │
   └────┬────┘            └──────┬──────┘         └──────┬──────┘
        │                        │                        │
   • RAG Systems           • DOCX                   • SEO
   • LangGraph             • PDF                    • Copywriting
   • Prompt Eng.           • PPTX                   • CRO
   • Voice Agents          • XLSX                   • Paid Ads
```

---

## Skill File Anatomy (Visual)

````
┌─────────────────────────────────────────────────────────┐
│ SKILL.md                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ FRONTMATTER (Metadata)                        │     │
│  │ ───────────────────────────────────────────── │     │
│  │ ---                                           │     │
│  │ name: my-skill                                │     │
│  │ description: "What this skill does"           │     │
│  │ ---                                           │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ CONTENT (Instructions)                        │     │
│  │ ───────────────────────────────────────────── │     │
│  │                                               │     │
│  │ # Skill Title                                 │     │
│  │                                               │     │
│  │ ## Overview                                   │     │
│  │ What this skill does...                       │     │
│  │                                               │     │
│  │ ## When to Use                                │     │
│  │ - Use when...                                 │     │
│  │                                               │     │
│  │ ## Instructions                               │     │
│  │ 1. First step...                              │     │
│  │ 2. Second step...                             │     │
│  │                                               │     │
│  │ ## Examples                                   │     │
│  │ ```javascript                                 │     │
│  │ // Example code                               │     │
│  │ ```                                           │     │
│  │                                               │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
````

---

## Installation (Visual Steps)

### Step 1: Clone the Repository

```
┌─────────────────────────────────────────┐
│ Terminal                                │
├─────────────────────────────────────────┤
│ $ git clone https://github.com/        │
│   rootcastleco/rei-skills    │
│   .agent/skills                         │
│                                         │
│ ✓ Cloning into '.agent/skills'...      │
│ ✓ Done!                                 │
└─────────────────────────────────────────┘
```

### Step 2: Verify Installation

```
┌─────────────────────────────────────────┐
│ File Explorer                           │
├─────────────────────────────────────────┤
│ 📁 .agent/                              │
│   └── 📁 skills/                        │
│       ├── 📁 brainstorming/             │
│       ├── 📁 stripe-integration/        │
│       ├── 📁 react-best-practices/      │
│       └── ... (176 more)                │
└─────────────────────────────────────────┘
```

### Step 3: Use a Skill

```
┌─────────────────────────────────────────┐
│ AI Assistant Chat                       │
├─────────────────────────────────────────┤
│ You: @brainstorming help me design      │
│      a todo app                         │
│                                         │
│ AI:  Great! Let me help you think       │
│      through this. First, let's         │
│      understand your requirements...    │
│                                         │
│      What's the primary use case?       │
│      a) Personal task management        │
│      b) Team collaboration              │
│      c) Project planning                │
└─────────────────────────────────────────┘
```

---

## Example: Using a Skill (Step-by-Step)

### Scenario: You want to add Stripe payments to your app

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Identify the Need                                  │
├─────────────────────────────────────────────────────────────┤
│ "I need to add payment processing to my app"                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Find the Right Skill                               │
├─────────────────────────────────────────────────────────────┤
│ Search: "payment" or "stripe"                               │
│ Found: @stripe-integration                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Invoke the Skill                                   │
├─────────────────────────────────────────────────────────────┤
│ You: @stripe-integration help me add subscription billing  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AI Loads Skill Knowledge                           │
├─────────────────────────────────────────────────────────────┤
│ • Stripe API patterns                                       │
│ • Webhook handling                                          │
│ • Subscription management                                   │
│ • Best practices                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Get Expert Help                                    │
├─────────────────────────────────────────────────────────────┤
│ AI provides:                                                │
│ • Code examples                                             │
│ • Setup instructions                                        │
│ • Security considerations                                   │
│ • Testing strategies                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Finding Skills (Visual Guide)

### Method 1: Browse by Category

```
README.md → Scroll to "Full Skill Registry" → Find category → Pick skill
```

### Method 2: Search by Keyword

```
Terminal → ls skills/ | grep "keyword" → See matching skills
```

### Method 3: Use the Index

```
Open skills_index.json → Search for keyword → Find skill path
```

---

## Creating Your First Skill (Visual Workflow)

```
┌──────────────┐
│ 1. IDEA      │  "I want to share my Docker knowledge"
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 2. CREATE    │  mkdir skills/docker-mastery
└──────┬───────┘  touch skills/docker-mastery/SKILL.md
       │
       ↓
┌──────────────┐
│ 3. WRITE     │  Add frontmatter + content
└──────┬───────┘  (Use template from CONTRIBUTING.md)
       │
       ↓
┌──────────────┐
│ 4. TEST      │  Copy to .agent/skills/
└──────┬───────┘  Try: @docker-mastery
       │
       ↓
┌──────────────┐
│ 5. VALIDATE  │  python3 scripts/validate_skills.py
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ 6. SUBMIT    │  git commit + push + Pull Request
└──────────────┘
```

---

## Skill Complexity Levels

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILL COMPLEXITY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SIMPLE                    STANDARD              COMPLEX    │
│  ──────                    ────────              ───────    │
│                                                             │
│  • 1 file                  • 1 file              • Multiple │
│  • 100-200 words           • 300-800 words       • 800-2000 │
│  • Basic structure         • Full structure      • Scripts  │
│  • No extras               • Examples            • Examples │
│                            • Best practices      • Templates│
│                                                  • Docs     │
│  Example:                  Example:              Example:   │
│  git-pushing               brainstorming         loki-mode  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Contribution Impact (Visual)

```
Your Contribution
       │
       ├─→ Improves Documentation
       │        │
       │        └─→ Helps 1000s of developers understand
       │
       ├─→ Creates New Skill
       │        │
       │        └─→ Enables new capabilities for everyone
       │
       ├─→ Fixes Bug/Typo
       │        │
       │        └─→ Prevents confusion for future users
       │
       └─→ Adds Example
                │
                └─→ Makes learning easier for beginners
```

---

## Learning Path (Visual Roadmap)

```
START HERE
    │
    ↓
┌─────────────────┐
│ Read            │
│ GETTING_STARTED │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Try 2-3 Skills  │
│ in AI Assistant │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Read            │
│ SKILL_ANATOMY   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Study Existing  │
│ Skills          │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Create Simple   │
│ Skill           │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Read            │
│ CONTRIBUTING    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Submit PR       │
└────────┬────────┘
         │
         ↓
    CONTRIBUTOR! 🎉
```

---

## 💡 Quick Tips (Visual Cheatsheet)

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK REFERENCE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 INSTALL                                                 │
│  git clone [repo] .agent/skills                             │
│                                                             │
│  🎯 USE                                                     │
│  @skill-name [your request]                                 │
│                                                             │
│  🔍 FIND                                                    │
│  ls skills/ | grep "keyword"                                │
│                                                             │
│  ✅ VALIDATE                                                │
│  python3 scripts/validate_skills.py                         │
│                                                             │
│  📝 CREATE                                                  │
│  1. mkdir skills/my-skill                                   │
│  2. Create SKILL.md with frontmatter                        │
│  3. Add content                                             │
│  4. Test & validate                                         │
│  5. Submit PR                                               │
│                                                             │
│  🆘 HELP                                                    │
│  • docs/GETTING_STARTED.md - Basics                         │
│  • CONTRIBUTING.md - How to contribute                │
│  • SKILL_ANATOMY.md - Deep dive                             │
│  • GitHub Issues - Ask questions                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Stories (Visual Timeline)

```
Day 1: Install skills
  │
  └─→ "Wow, @brainstorming helped me design my app!"

Day 3: Use 5 different skills
  │
  └─→ "These skills save me so much time!"

Week 1: Create first skill
  │
  └─→ "I shared my expertise as a skill!"

Week 2: Skill gets merged
  │
  └─→ "My skill is helping others! 🎉"

Month 1: Regular contributor
  │
  └─→ "I've contributed 5 skills and improved docs!"
```

---

## Next Steps

1. ✅ **Understand** the visual structure
2. ✅ **Install** skills in your AI tool
3. ✅ **Try** 2-3 skills from different categories
4. ✅ **Read** CONTRIBUTING.md
5. ✅ **Create** your first skill
6. ✅ **Share** with the community

---

**Visual learner?** This guide should help! Still have questions? Check out:

- [GETTING_STARTED.md](GETTING_STARTED.md) - Text-based intro
- [SKILL_ANATOMY.md](SKILL_ANATOMY.md) - Detailed breakdown
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute

**Ready to contribute?** You've got this! 💪
