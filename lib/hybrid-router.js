"use strict";

/**
 * 🧠 REI Skills — Hybrid Semantic, BM25 & Dependency-Aware Skill Router
 *
 * Combines:
 *   1. Bilingual (TR + EN) engineering terminology normalization & suffix stemming
 *   2. Cached inverted field-weighted BM25 retrieval (O(query_terms * postings))
 *   3. Deterministic offline 256-dim dense semantic cosine retrieval (+ optional external provider)
 *   4. Workspace file-extension & stack signature inference
 *   5. Domain phrase & cross-domain diversity preservation
 *   6. Risk-aware filtering (`safeOnly` / `maxRisk`)
 *   7. Duplicate/overlap detection & skill dependency inference
 *   8. Uncertainty & out-of-scope detection
 */

const STOP_WORDS = new Set([
  // English stopwords
  "a", "an", "the", "and", "or", "of", "but", "if", "then", "else", "when", "at", "by",
  "for", "with", "about", "against", "between", "into", "through", "during", "before",
  "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
  "over", "under", "again", "further", "once", "here", "there", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now",
  "how", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is",
  "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do",
  "does", "did", "doing", "i", "me", "my", "we", "our", "you", "your", "he", "she",
  "it", "its", "they", "them", "want", "need", "help", "make", "build", "create", "use",
  "using", "best", "way", "give", "tell", "explain", "write", "recommend", "top", "good",
  // Turkish stopwords (prevents false substring hits like "ve" -> "event" or "en" -> "content")
  "ve", "ile", "veya", "ya", "da", "de", "ki", "bu", "su", "o", "bir", "iki", "en",
  "cok", "az", "icin", "gibi", "kadar", "olan", "olarak", "nasil", "hangi", "ne",
  "zaman", "kac", "yap", "et", "ol", "ver", "al", "anlat", "oner", "icin", "mi", "mu",
  "gore", "sonra", "once", "kendi", "daha", "her", "tum", "bunu", "sunu", "benim",
  // ASCII-folded equivalents already covered; include accented forms too
  "çok", "için", "nasıl", "kaç", "öner", "göre", "önce", "tüm", "şu", "mı", "mü", "şekilde"
]);

const RISK_RANK = {
  none: 0,
  safe: 1,
  unknown: 2,
  critical: 3,
  offensive: 4,
};

const STACK_RULES = [
  {
    match: /\.(f3d|f3z|step|stp|iges|igs)$/i,
    keywords: ["fusion360", "cad", "mechanical", "parametric", "3d", "step", "enclosure"],
    boostSkills: [
      "rc-fusion360-parametric-fusion-step-stl-export",
      "rc-fusion360-api-fusion-api-export-step",
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-cad-3d-assembly-drawing-release-inspection",
    ],
  },
  {
    match: /\.(stl|3mf|obj)$/i,
    keywords: ["cad", "3d", "mesh", "additive", "printing", "slicing"],
    boostSkills: [
      "rc-fusion360-cam-fusion-additive-slicing",
      "rc-cad-3d-assembly-printed-part-anisotropy",
      "rc-fusion360-cam-fusion-additive-orientation",
      "rc-fusion360-parametric-fusion-step-stl-export",
    ],
  },
  {
    match: /\.(kicad_sch|kicad_pcb|kicad_pro|kicad_jobset)$/i,
    keywords: ["kicad", "ecad", "schematic", "pcb", "electronic", "drc", "erc"],
    boostSkills: [
      "rc-kicad-ecad-kicad-ecad-release-gate",
      "rc-kicad-ecad-kicad-drc-ci",
      "rc-kicad-ecad-kicad-erc-automation",
    ],
  },
  {
    match: /\.(wasm|wat)$/i,
    keywords: ["wasm", "webassembly", "reverse-engineering", "binary", "parity"],
    boostSkills: [
      "rei-wasm-and-managed",
      "rei-binary-intelligence",
      "rei-rea-orchestrator",
      "rei-reconstruction-parity",
    ],
  },
  {
    match: /\.(exe|dll|sys|elf|so|dylib|macho|o|ko|out)$/i,
    keywords: ["native", "binary", "pe", "elf", "mach-o", "reverse-engineering", "disassembly"],
    boostSkills: [
      "rei-native-binaries",
      "rei-binary-intelligence",
      "rei-rea-orchestrator",
      "rei-evidence-ledger",
      "rei-casebook-forensics",
    ],
  },
  {
    match: /\.(apk|dex|aab|smali|ipa)$/i,
    keywords: ["android", "apk", "mobile", "dex", "jni", "frida", "reverse-engineering"],
    boostSkills: [
      "rei-android-apks",
      "rei-mobile-runtime",
      "rei-rea-orchestrator",
      "rei-binary-intelligence",
    ],
  },
  {
    match: /\.(bin|fw|img|hex|uf2|rom|squashfs|uimage)$/i,
    keywords: ["firmware", "iot", "embedded", "entropy", "partition", "reverse-engineering"],
    boostSkills: [
      "rei-firmware-and-iot",
      "rei-binary-intelligence",
      "rc-binary-forensics-firmware-partition-map",
      "rei-rea-orchestrator",
    ],
  },
  {
    match: /\.(asar)$/i,
    keywords: ["electron", "asar", "ipc", "preload", "javascript"],
    boostSkills: ["rei-electron-and-js", "rei-web-and-protocols", "rei-rea-orchestrator"],
  },
  {
    match: /\.(pcap|pcapng|har)$/i,
    keywords: ["protocol", "network", "packet", "har", "pcap", "captures"],
    boostSkills: ["rei-web-and-protocols", "rei-evidence-ledger", "wireshark-analysis"],
  },
  {
    match: /\.(tsx|jsx)$/i,
    keywords: ["react", "frontend", "typescript", "ui", "component", "nextjs", "tailwind"],
    boostSkills: ["react-best-practices", "react-patterns", "frontend-developer", "typescript-pro"],
  },
  {
    match: /next\.config\.(js|mjs|ts)$/i,
    keywords: ["nextjs", "react", "app-router", "ssr"],
    boostSkills: ["nextjs-best-practices", "nextjs-app-router-patterns", "react-best-practices"],
  },
  {
    match: /\.(py)$/i,
    keywords: ["python", "fastapi", "pytest", "async"],
    boostSkills: ["python-pro", "python-testing-patterns", "fastapi-pro", "python-patterns"],
  },
  {
    match: /\.(rs)|Cargo\.toml$/i,
    keywords: ["rust", "cargo", "systems", "tokio", "ffi", "protocol"],
    boostSkills: [
      "rust-pro",
      "rc-rust-protocols-framed-codec-bounds",
      "rc-rust-protocols-backpressure-channel-budget",
      "rc-rust-protocols-async-lock-order",
    ],
  },
  {
    match: /\.(go)|go\.mod$/i,
    keywords: ["golang", "go", "concurrency"],
    boostSkills: ["golang-pro", "go-concurrency-patterns"],
  },
  {
    match: /Dockerfile|docker-compose\.ya?ml$/i,
    keywords: ["docker", "container", "devops", "deployment"],
    boostSkills: ["docker-expert", "deployment-procedures", "kubernetes-architect"],
  },
  {
    match: /Chart\.ya?ml$/i,
    keywords: ["helm", "kubernetes", "k8s", "chart"],
    boostSkills: ["helm-chart-scaffolding", "kubernetes-architect"],
  },
  {
    match: /\.(tf|tfvars)$/i,
    keywords: ["terraform", "iac", "cloud", "infrastructure"],
    boostSkills: ["terraform-specialist", "aws-serverless", "kubernetes-architect"],
  },
  {
    match: /\.(sql|prisma)$/i,
    keywords: ["database", "sql", "postgres", "postgresql", "schema", "query"],
    boostSkills: ["postgres-best-practices", "database-design", "prisma-expert", "sql-pro"],
  },
];

/**
 * Rich bilingual (Turkish + ASCII-folded Turkish + English shorthand) lexicon.
 */
const BILINGUAL_LEXICON = {
  // Electronics & PCB
  elektronik: ["electronics", "electronic", "circuit", "ecad", "pcb"],
  devre: ["circuit", "schematic", "electronics", "ecad"],
  sematik: ["schematic", "circuit", "kicad", "erc"],
  baski: ["pcb", "printing", "additive"],
  kart: ["pcb", "board", "stackup"],
  karti: ["pcb", "board"],
  guc: ["power", "supply", "regulator", "budget"],
  besleme: ["power", "supply", "regulator", "ldo", "buck"],
  kaynagi: ["supply", "source", "power"],
  voltaj: ["voltage", "regulator", "ldo", "reference", "battery"],
  voltaji: ["voltage", "battery"],
  regulatoru: ["regulator", "ldo", "buck", "dropout"],
  regulator: ["regulator", "ldo", "buck"],
  donusturucu: ["converter", "buck", "boost"],
  gecici: ["transient", "startup"],
  rejim: ["transient", "operating"],
  simulasyonu: ["simulation", "spice"],
  simulasyon: ["simulation", "spice"],
  kararlilik: ["stability", "margin", "loop"],
  faz: ["phase", "margin", "carrier", "angle"],
  marji: ["margin"],
  sonlandirma: ["termination", "rs485", "bus"],
  hat: ["bus", "line", "rs485"],
  korumasi: ["protection", "tvs", "esd"],
  koruma: ["protection", "tvs", "esd", "guard"],
  desarj: ["discharge", "esd"],
  yolu: ["path", "toolpath", "return"],
  yerlesimi: ["layout", "placement", "pcb"],
  esitlik: ["parity", "equivalence"],
  yigin: ["stackup", "stack", "watermark"],
  kalinlik: ["thickness", "board", "wall"],
  kalinligi: ["thickness", "wall"],
  yakin: ["near", "field"],
  alan: ["field", "domain", "area"],
  taramasi: ["scan", "radiated"],
  elektromanyetik: ["electromagnetic", "emc"],
  uyumluluk: ["compatibility", "compat", "fit", "emc"],
  uyumu: ["fit", "compatibility", "synchronization"],
  // CAD & Fusion 360 & Mechanical
  cizim: ["drawing", "cad", "3d", "sketch"],
  cizimi: ["drawing", "cad", "3d", "parametric"],
  tasarla: ["design", "architecture", "layout", "parametric"],
  tasarim: ["design", "architecture", "parametric"],
  tasarimi: ["design", "architecture", "parametric"],
  modelleme: ["modeling", "cad", "3d", "parametric"],
  parametrik: ["parametric", "fusion", "fusion360", "parameter"],
  parametre: ["parameter", "parameters", "units"],
  birimleri: ["units", "valueinput"],
  muhafaza: ["enclosure", "housing", "mechanical", "cad"],
  kutu: ["enclosure", "housing", "shell", "wall"],
  duvar: ["wall", "shell", "uniform"],
  cakisma: ["interference", "collision", "clearance"],
  girisim: ["interference", "detection"],
  disa: ["export", "step", "stl"],
  aktar: ["export", "step", "stl"],
  aktarimi: ["export", "step", "stl"],
  ihracati: ["export", "step", "stl"],
  mekanik: ["mechanical", "cad", "assembly", "fit"],
  montaj: ["assembly", "mounting", "enclosure", "fit"],
  delik: ["hole", "clearance", "thread"],
  deligi: ["hole", "mounting", "pattern"],
  vida: ["thread", "fastener", "screw"],
  disi: ["thread", "tap"],
  sac: ["sheet", "metal"],
  bukum: ["bend", "allowance", "sheet"],
  payi: ["allowance", "margin"],
  tolerans: ["tolerance", "stack", "clearance"],
  conta: ["gasket", "seal", "waterproof", "ring"],
  gecirmez: ["waterproof", "seal", "gasket"],
  bosluk: ["clearance", "gap", "envelope"],
  konnektor: ["connector", "mating", "sweep"],
  yonu: ["orientation", "direction", "polarity"],
  yonlendirme: ["orientation", "routing", "additive"],
  katman: ["layer", "anisotropy", "stackup"],
  anizotropisi: ["anisotropy", "printed"],
  parca: ["part", "component", "printed"],
  freze: ["cam", "machining", "milling", "3axis"],
  eksen: ["axis", "3axis"],
  takim: ["tool", "toolpath"],
  // Vibration & Rotor Balancing & Sensors
  titresim: ["vibration", "accelerometer", "machine"],
  ivmeolcer: ["accelerometer", "sensor", "sensitivity", "iepe"],
  spektrumu: ["spectrum", "spectra", "fft"],
  spektrum: ["spectrum", "spectra", "fft"],
  hiz: ["velocity", "speed", "acceleration"],
  donusumu: ["conversion", "acceleration", "velocity"],
  yatak: ["bearing", "defect", "sidebands"],
  ariza: ["defect", "fault", "failure"],
  frekanslari: ["frequencies", "sidebands", "defect"],
  pencere: ["window", "leakage"],
  sizintisi: ["leakage", "fft"],
  tek: ["single", "one"],
  duzlemli: ["plane", "single"],
  iki: ["two", "dual"],
  rotor: ["rotor", "mass", "balance"],
  balans: ["balance", "balancing", "unbalance", "trial"],
  balanslama: ["balance", "balancing", "unbalance"],
  dengeleme: ["balance", "balancing", "coupling"],
  kuplaj: ["coupling", "two-plane", "matrix"],
  matrisi: ["matrix", "conditioning"],
  etki: ["influence", "coefficient"],
  katsayisi: ["coefficient", "influence", "conditioning"],
  deneme: ["trial", "mass"],
  agirligi: ["mass", "weight", "trial"],
  acisi: ["angle", "phase", "wrap"],
  aci: ["angle", "polarity", "reference"],
  kalan: ["residual", "unbalance"],
  dengesizlik: ["unbalance", "residual"],
  dort: ["four", "4"],
  kanalli: ["channel", "synchronous", "sampling"],
  ornekleme: ["sampling", "adc", "synchronous", "settling"],
  senkron: ["synchronous", "clock", "ptp", "phase"],
  kalibrasyon: ["calibration", "chain", "sensor"],
  zinciri: ["chain", "calibration"],
  // GNSS, Telematics, Embedded & Protocols
  konum: ["position", "location", "gnss", "decode"],
  coklu: ["multi", "multipath", "multiobjective"],
  yansima: ["multipath", "diagnostics"],
  tasiyici: ["carrier", "cycle", "slip"],
  kaymasi: ["slip", "drift", "cycle"],
  tespiti: ["detection", "detect", "diagnostics"],
  cumle: ["sentence", "talker", "nmea"],
  dogrulama: ["validation", "verification", "verify", "auth"],
  dogrula: ["verify", "validate", "drc", "erc"],
  uydu: ["satellite", "ephemeris", "gnss"],
  yorunge: ["orbital", "ephemeris"],
  efemeris: ["ephemeris", "age", "screening"],
  yas: ["age", "screening"],
  suzgeci: ["screening", "filter"],
  gomulu: ["embedded", "firmware", "iot", "rtos"],
  aygit: ["device", "firmware", "embedded"],
  yazilim: ["firmware", "software"],
  yazilimi: ["firmware", "software"],
  guncelleme: ["update", "ota", "firmware"],
  kesintisi: ["loss", "outage", "dropout", "power"],
  kesme: ["interrupt", "isr"],
  gecikmesi: ["latency", "profiling", "interrupt"],
  gecikme: ["latency", "budget", "delay"],
  gorev: ["task", "rtos", "scheduler"],
  tasma: ["overflow", "watermark", "stack"],
  denetimi: ["audit", "check", "review"],
  bellek: ["memory", "slot", "ab", "flash"],
  bolumu: ["slot", "partition"],
  bolum: ["partition", "slot"],
  geri: ["rollback", "anti-rollback", "return"],
  donus: ["rollback", "return"],
  imzali: ["signature", "signed", "verification"],
  imaj: ["image", "firmware"],
  zamanlama: ["scheduling", "wcet", "timing"],
  butcesi: ["budget", "wcet", "load"],
  bekci: ["watchdog", "supervision"],
  kopegi: ["watchdog", "supervision"],
  kurtarma: ["recovery", "supervision", "fallback"],
  agaci: ["tree", "decomposition", "fault"],
  // Reverse Engineering & Security
  tersine: ["reverse", "reverse-engineering", "rei-rea", "binary"],
  muhendislik: ["engineering", "reverse-engineering"],
  ikili: ["binary", "pe", "elf", "wasm", "diff"],
  fark: ["diff", "parity", "comparison"],
  kanit: ["evidence", "casebook", "ledger", "forensics"],
  defteri: ["ledger", "casebook"],
  temiz: ["clean-room", "clean"],
  oda: ["clean-room", "room"],
  esdegerlik: ["parity", "equivalence"],
  haritası: ["map", "partition"],
  haritasi: ["map", "partition"],
  entropi: ["entropy", "firmware", "partition"],
  salt: ["read-only", "readonly"],
  okunur: ["read-only", "readonly"],
  guvenli: ["safe", "secure", "security"],
  guvenlik: ["security", "safety", "audit"],
  guvenligi: ["security", "safety"],
  karsilikli: ["mutual", "tls"],
  sikisma: ["handshake", "tls"],
  kimlik: ["identity", "auth", "authentication"],
  acil: ["emergency", "stop"],
  durdurma: ["stop", "emergency"],
  kilidi: ["interlock", "lock"],
  hata: ["fault", "error", "debugging"],
  ayristirma: ["decomposition", "fault", "tree"],
  // Networking, BLE, Cellular, JT808, Cloud, Data, Research
  sensor: ["sensor", "accelerometer", "ble"],
  dugumu: ["node", "nodes"],
  pil: ["battery", "power"],
  yorumlama: ["interpretation", "voltage"],
  baglanti: ["connection", "link", "interval"],
  araligi: ["interval", "range"],
  olcumu: ["measurement", "power"],
  hucresel: ["cellular", "modem", "gateway"],
  sinyal: ["signal", "rsrp", "sinr"],
  kalitesi: ["quality", "rsrp", "sinr"],
  cevrimdisi: ["offline", "queue", "sync"],
  kuyruk: ["queue", "durability", "buffer"],
  dayanikliligi: ["durability", "queue"],
  endustriyel: ["industrial", "ethernet"],
  saat: ["clock", "ptp", "time"],
  filo: ["fleet", "telematics"],
  telematik: ["telematics", "fleet"],
  arac: ["vehicle", "fleet"],
  uyarisi: ["alert", "hysteresis"],
  histerezis: ["hysteresis", "dwell"],
  tampon: ["buffer", "dma"],
  siralama: ["ordering", "sort"],
  protokol: ["protocol", "jt808", "frame"],
  protokolu: ["protocol", "jt808"],
  paketi: ["packet", "frame", "payload"],
  cozme: ["decode", "decoding"],
  cerceveleme: ["framed", "codec", "framing"],
  sinirlari: ["bounds", "boundaries", "limits"],
  baglanma: ["reconnect", "connection"],
  tekrar: ["replay", "retry", "dedup"],
  masaustu: ["desktop", "electron", "asar"],
  uygulamasi: ["app", "application"],
  kopru: ["bridge", "preload", "ipc"],
  saha: ["field", "mobile"],
  senkronizasyon: ["sync", "synchronization", "resume"],
  barkod: ["barcode", "scan", "dedup"],
  tekillestirme: ["dedup", "deduplication"],
  zaman: ["time", "timeseries"],
  serisi: ["series", "timeseries"],
  gec: ["late", "watermark"],
  gelen: ["incoming", "late"],
  veri: ["data", "telemetry"],
  veritabani: ["database", "postgres", "sql"],
  indeks: ["index", "indexing", "postgres"],
  sorgu: ["query", "queries", "sql"],
  performans: ["performance", "optimization"],
  optimizasyonu: ["optimization", "tuning"],
  optimizasyon: ["optimization", "pareto"],
  bulut: ["cloud", "service"],
  servisi: ["service", "services"],
  gizliligi: ["privacy", "redaction", "pii"],
  maskeleme: ["redaction", "masking"],
  sifir: ["zero", "downtime"],
  kesintili: ["downtime", "zero-downtime"],
  sema: ["schema", "migration"],
  gecisi: ["migration", "transition"],
  mikroservis: ["microservices", "architecture"],
  olay: ["event", "events", "streaming"],
  gudumlu: ["driven", "ddd", "event"],
  mimari: ["architecture", "design"],
  mimarisi: ["architecture", "design"],
  arayuz: ["frontend", "ui", "interface"],
  bilesen: ["component", "components", "react"],
  otomasyonu: ["automation", "testing"],
  dagitimi: ["deployment", "deploy", "docker"],
  altyapi: ["infrastructure", "terraform", "iac"],
  plani: ["plan", "architecture"],
  amacli: ["objective", "multiobjective"],
  siniri: ["frontier", "pareto", "boundary"],
  kisit: ["constraint", "constraints"],
  fizibilite: ["feasibility", "audit"],
  hesabi: ["calculation", "budget"],
  analiz: ["analysis", "audit", "triage"],
  analizi: ["analysis", "audit", "triage"],
  incelemesi: ["review", "inspection", "audit"],
  kontrol: ["check", "inspection", "verification"],
  kontrolu: ["check", "inspection", "verification"],
  olustur: ["create", "build", "generate"],
  olcum: ["measurement", "sensor"],
  ag: ["network", "packet", "pcap"],
  trafigi: ["traffic", "packet", "pcap"],
  // English domain shorthand aliases
  fusion: ["fusion360", "cad", "parametric"],
  fusion360: ["fusion", "cad", "parametric"],
  "360": ["fusion360", "cad", "parametric"],
  "3d": ["cad", "mechanical", "parametric"],
  kicad: ["ecad", "pcb", "schematic"],
  spice: ["simulation", "circuit", "ngspice"],
  pcb: ["pcb", "ecad", "board", "kicad"],
  drc: ["drc", "kicad", "pcb"],
  erc: ["erc", "kicad", "schematic"],
  gnss: ["gnss", "gps", "nmea", "rtk", "ephemeris"],
  rtk: ["gnss", "carrier", "ambiguity", "rtcm"],
  ota: ["ota", "firmware", "rollback", "slot"],
  cnc: ["cam", "machining", "fusion360", "wcs", "postprocess"],
  bode: ["ac", "small-signal", "filter", "transfer"],
  re: ["reverse-engineering", "rei-rea", "binary"],
  rev: ["reverse-engineering", "rei-rea", "binary"],
  k8s: ["kubernetes", "helm"],
  postgres: ["postgres", "postgresql", "database", "sql"],
};

/**
 * Multi-word domain phrases that boost exact domain prefixes and canonical anchor skills.
 */
const PHRASE_RULES = [
  {
    pattern: /ecad.?mcad|pcb.*(enclosure|muhafaza|housing|step|cavity|outline|fit)|(enclosure|muhafaza|housing).*pcb|waterproof.*gasket|o-ring|su geçirmez conta/i,
    domains: ["ecad-mcad-fit"],
    boostSkills: ["rc-ecad-mcad-fit-pcb-to-enclosure-step", "rc-ecad-mcad-fit-mounting-hole-pattern", "rc-ecad-mcad-fit-waterproof-gasket-stack"],
    bonus: 18,
  },
  {
    pattern: /elektronik.{0,24}devre|devre.{0,24}(tasar|sematik|şematik)|power tree|ldo dropout|buck converter|op-?amp.*(bias|stability)|adc.*reference|rs485.*termination|reverse polarity/i,
    domains: ["circuit-architecture"],
    boostSkills: ["rc-circuit-architecture-power-tree-budgeting", "rc-circuit-architecture-adc-reference-network", "rc-circuit-architecture-opamp-stability-margin"],
    bonus: 22,
  },
  {
    pattern: /spice|monte carlo|small-?signal ac|bode|bench parity|geçici rejim|corner sweep|filtre transfer/i,
    domains: ["circuit-simulation"],
    boostSkills: ["rc-circuit-simulation-adc-sampling-settling", "rc-circuit-simulation-filter-transfer-verification"],
    bonus: 20,
  },
  {
    pattern: /kicad|gerber|netlist parity|net parity|erc.*drc|drc.*erc|baskı devre|baski devre/i,
    domains: ["kicad-ecad", "pcb-design-review"],
    boostSkills: ["rc-kicad-ecad-kicad-ecad-release-gate", "rc-kicad-ecad-kicad-drc-ci", "rc-kicad-ecad-kicad-erc-automation"],
    bonus: 20,
  },
  {
    pattern: /fusion\s*360|valueinput|user parameter|parametre birimleri|shell uniform|sketch constraint|sheet metal/i,
    domains: ["fusion360-parametric", "fusion360-api"],
    boostSkills: ["rc-fusion360-parametric-fusion-design-parameter-table", "rc-fusion360-api-fusion-api-parameter-units"],
    bonus: 18,
  },
  {
    pattern: /cnc|toolpath|takım yolu|wcs|postprocess|g-?code|adaptive clearing|3\s*eksen|additive.*orientation|3d print|3d baskı|3d baski/i,
    domains: ["fusion360-cam", "cad-3d-assembly"],
    boostSkills: ["rc-fusion360-cam-fusion-cam-setup-wcs", "rc-fusion360-cam-fusion-cam-postprocess-review", "rc-fusion360-cam-fusion-additive-orientation"],
    bonus: 20,
  },
  {
    pattern: /rotor.*balans|balans.*rotor|single-plane|two-plane|trial mass|deneme ağırlığı|dengeleme.*kuplaj|keyphasor|unbalance|dengesizlik/i,
    domains: ["rotor-mass-balance"],
    boostSkills: ["rc-rotor-mass-balance-single-plane-influence", "rc-rotor-mass-balance-two-plane-coupling"],
    bonus: 22,
  },
  {
    pattern: /vibration|titreşim|titresim|accelerometer|ivmeölçer|ivmeolcer|bearing defect|yatak arıza|fft window|nyquist|tachometer/i,
    domains: ["machine-vibration", "sensor-acquisition"],
    boostSkills: ["rc-machine-vibration-acceleration-to-velocity", "rc-sensor-acquisition-accelerometer-sensitivity"],
    bonus: 18,
  },
  {
    pattern: /four-?channel|dört kanallı|dort kanalli|synchronous.*sampling|senkron.*adc|anti-?alias|iepe/i,
    domains: ["sensor-acquisition", "circuit-architecture"],
    boostSkills: ["rc-sensor-acquisition-accelerometer-sensitivity", "rc-sensor-acquisition-synchronous-sampling-phase", "rc-circuit-architecture-adc-reference-network"],
    bonus: 18,
  },
  {
    pattern: /gnss|rtk|nmea|rinex|rtcm|ephemeris|efemeris|cycle slip|taşıyıcı faz|tasiyici faz|raim|multipath/i,
    domains: ["gnss-measurement"],
    boostSkills: ["rc-gnss-measurement-nmea-talker-validation", "rc-gnss-measurement-carrier-cycle-slip"],
    bonus: 20,
  },
  {
    pattern: /rtos|dma buffer|priority inversion|wcet|watchdog|kesme gecikme|tickless|stack watermark/i,
    domains: ["embedded-rtos"],
    boostSkills: ["rc-embedded-rtos-wcet-scheduling-budget", "rc-embedded-rtos-watchdog-supervision-tree"],
    bonus: 20,
  },
  {
    pattern: /ota|anti-rollback|a\/b.*slot|power loss injection|güç kesintisi.*güncelleme|imzalı imaj/i,
    domains: ["firmware-ota"],
    boostSkills: ["rc-firmware-ota-ab-slot-state-machine", "rc-firmware-ota-image-signature-verification"],
    bonus: 20,
  },
  {
    pattern: /jt808|xor checksum|byte escap|multipart assembly|sequence wraparound/i,
    domains: ["jt808-protocol"],
    boostSkills: ["rc-jt808-protocol-byte-escape-decoding", "rc-jt808-protocol-location-body-decode"],
    bonus: 22,
  },
  {
    pattern: /ble.*sensor|ble.*sensör|gatt|mtu fragment|bonding key|pairing downgrade/i,
    domains: ["ble-sensor-nodes"],
    boostSkills: ["rc-ble-sensor-nodes-battery-voltage-interpretation", "rc-ble-sensor-nodes-mtu-fragment-reassembly"],
    bonus: 20,
  },
  {
    pattern: /cellular|hücresel|hucresel|rsrp|sinr|apn|modem attach|sim failover/i,
    domains: ["cellular-gateway"],
    boostSkills: ["rc-cellular-gateway-signal-quality-rsrp-sinr", "rc-cellular-gateway-offline-queue-durability"],
    bonus: 20,
  },
  {
    pattern: /industrial ethernet|ptp clock|gptp|poe load|tsn|spanning tree|redundant ring/i,
    domains: ["industrial-ethernet"],
    boostSkills: ["rc-industrial-ethernet-ptp-clock-error", "rc-industrial-ethernet-poe-load-budget"],
    bonus: 20,
  },
  {
    pattern: /\b(reverse engineer|tersine mühendislik|tersine muhendislik|apk|asar|wasm|elf|bootloader handoff|casebook|kanıt defteri)\b/i,
    domains: ["reverse-engineering", "binary-forensics"],
    boostSkills: ["rei-rea-orchestrator", "rei-binary-intelligence", "rei-firmware-and-iot"],
    bonus: 18,
  },
  {
    pattern: /safety|emergency stop|acil durdurma|fault tree|hata ağacı|fmea|interlock/i,
    domains: ["safety-assurance"],
    boostSkills: ["rc-safety-assurance-emergency-stop-interface", "rc-safety-assurance-fault-tree-decomposition"],
    bonus: 18,
  },
  {
    pattern: /fleet|filo telematik|geofence|odometer|harsh braking|idling/i,
    domains: ["fleet-telematics"],
    boostSkills: ["rc-fleet-telematics-trip-segmentation", "rc-fleet-telematics-speed-alert-hysteresis"],
    bonus: 20,
  },
  {
    pattern: /timeseries|zaman serisi|watermark|out-of-order|high cardinality/i,
    domains: ["timeseries-telemetry"],
    boostSkills: ["rc-timeseries-telemetry-late-event-watermarks", "rc-timeseries-telemetry-out-of-order-upsert"],
    bonus: 20,
  },
  {
    pattern: /kafka|outbox atomicity|dead letter|consumer group|schema registry/i,
    domains: ["event-streaming"],
    boostSkills: ["rc-event-streaming-event-outbox-atomicity", "rc-event-streaming-dead-letter-queue"],
    bonus: 20,
  },
  {
    pattern: /rust.*(async|tokio|ffi|codec|backpressure|socket|tail latency)/i,
    domains: ["rust-protocols"],
    boostSkills: ["rc-rust-protocols-framed-codec-bounds", "rc-rust-protocols-backpressure-channel-budget"],
    bonus: 18,
  },
  {
    pattern: /edge.*(ml|anomaly|quantization|int8)|quantization error bounds/i,
    domains: ["edge-machine-learning"],
    boostSkills: ["rc-edge-machine-learning-quantization-error-bounds", "rc-edge-machine-learning-sensor-failure-fallback"],
    bonus: 20,
  },
  {
    pattern: /pareto|multiobjective|çok amaçlı|mixed-?integer|trust-?region|finite-?difference|constraint feasibility/i,
    domains: ["optimization-experiments"],
    boostSkills: ["rc-optimization-experiments-constraint-feasibility-audit", "rc-optimization-experiments-multiobjective-pareto-review"],
    bonus: 20,
  },
  {
    pattern: /ablation|preprocessing leakage|seed control|uncertainty budget|replication package/i,
    domains: ["reproducible-research"],
    boostSkills: ["rc-reproducible-research-experiment-seed-control", "rc-reproducible-research-ablation-baseline-design"],
    bonus: 20,
  },
  {
    pattern: /hardware-?in-?the-?loop|\bhil\b|can traffic replay|adc calibration fixture|brownout.*sequence/i,
    domains: ["hardware-in-loop"],
    boostSkills: ["rc-hardware-in-loop-adc-calibration-fixture", "rc-hardware-in-loop-can-traffic-replay"],
    bonus: 20,
  },
  {
    pattern: /audit log redaction|pii maskeleme|zero-?downtime schema|sıfır kesinti.*şema|autoscaling|tls certificate expiry/i,
    domains: ["cloud-service-ops"],
    boostSkills: ["rc-cloud-service-ops-audit-log-redaction", "rc-cloud-service-ops-zero-downtime-schema"],
    bonus: 20,
  },
  {
    pattern: /mobile field|saha uygulaması|barcode scan|barkod|offline edit conflicts/i,
    domains: ["mobile-field-ops"],
    boostSkills: ["rc-mobile-field-ops-offline-edit-conflicts", "rc-mobile-field-ops-barcode-scan-dedup"],
    bonus: 20,
  },
  {
    pattern: /domain-?driven|ddd|bounded context|cqrs|saga orchestration|alan güdümlü/i,
    domains: ["architecture"],
    boostSkills: ["domain-driven-design", "ddd-strategic-design", "ddd-tactical-patterns"],
    bonus: 18,
  },
  {
    pattern: /langgraph|rag|vector database|embedding|mcp server|agent evaluation/i,
    domains: ["data-ai"],
    boostSkills: ["langgraph", "rag-implementation", "mcp-builder", "agent-evaluation"],
    bonus: 16,
  },
];

/**
 * Domain dependency chain for engineering workflows.
 */
const DOMAIN_DEPENDENCY_GRAPH = {
  "sensor-acquisition": { prerequisites: [], followUps: ["circuit-architecture", "circuit-simulation", "machine-vibration"] },
  "circuit-architecture": { prerequisites: ["sensor-acquisition"], followUps: ["circuit-simulation", "kicad-ecad", "pcb-design-review"] },
  "circuit-simulation": { prerequisites: ["circuit-architecture"], followUps: ["kicad-ecad", "pcb-design-review"] },
  "kicad-ecad": { prerequisites: ["circuit-architecture", "circuit-simulation"], followUps: ["pcb-design-review", "ecad-mcad-fit"] },
  "pcb-design-review": { prerequisites: ["kicad-ecad"], followUps: ["ecad-mcad-fit", "electromagnetic-compat"] },
  "ecad-mcad-fit": { prerequisites: ["kicad-ecad"], followUps: ["fusion360-parametric", "cad-3d-assembly"] },
  "fusion360-parametric": { prerequisites: ["ecad-mcad-fit"], followUps: ["cad-3d-assembly", "fusion360-cam"] },
  "fusion360-api": { prerequisites: ["fusion360-parametric"], followUps: ["ecad-mcad-fit"] },
  "cad-3d-assembly": { prerequisites: ["fusion360-parametric"], followUps: ["fusion360-cam"] },
  "fusion360-cam": { prerequisites: ["cad-3d-assembly", "fusion360-parametric"], followUps: ["safety-assurance"] },
  "machine-vibration": { prerequisites: ["sensor-acquisition"], followUps: ["rotor-mass-balance", "edge-machine-learning"] },
  "rotor-mass-balance": { prerequisites: ["machine-vibration"], followUps: ["safety-assurance"] },
  "gnss-measurement": { prerequisites: [], followUps: ["fleet-telematics", "cellular-gateway"] },
  "jt808-protocol": { prerequisites: ["gnss-measurement"], followUps: ["cellular-gateway", "fleet-telematics"] },
  "embedded-rtos": { prerequisites: [], followUps: ["firmware-ota", "hardware-in-loop"] },
  "firmware-ota": { prerequisites: ["embedded-rtos"], followUps: ["iot-device-security", "hardware-in-loop"] },
  "reverse-engineering": { prerequisites: [], followUps: ["binary-forensics", "safety-assurance"] },
  "binary-forensics": { prerequisites: ["reverse-engineering"], followUps: ["firmware-ota"] },
};

function foldTurkish(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/gi, "i");
}

function stemTurkishToken(folded) {
  if (folded.length <= 4) return folded;
  const suffixes = [
    "lari", "leri", "inda", "inde", "unda", "unde", "ndan", "nden",
    "masi", "mesi", "lama", "leme", "lik", "luk", "luk", "sal", "sel",
    "dan", "den", "tan", "ten", "yla", "yle", "lar", "ler", "nin", "nun",
    "imiz", "iniz", "si", "su", "yi", "yu",
  ];
  for (const sfx of suffixes) {
    if (folded.length - sfx.length >= 4 && folded.endsWith(sfx)) {
      return folded.slice(0, -sfx.length);
    }
  }
  return folded;
}

function tokenizeRaw(text) {
  if (!text) return [];
  const raw = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç_-]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  const out = [];
  for (const tok of raw) {
    const folded = foldTurkish(tok);
    if (tok.length < 2 || STOP_WORDS.has(tok) || STOP_WORDS.has(folded)) continue;
    out.push(folded);
    if (folded.includes("-")) {
      for (const part of folded.split("-")) {
        if (part.length >= 2 && !STOP_WORDS.has(part)) out.push(part);
      }
    }
  }
  return out;
}

function normalizeQuery(text, extraKeywords = []) {
  const rawTokens = tokenizeRaw(text);
  const expanded = new Set(rawTokens);
  const bilingualHits = [];

  for (const tok of rawTokens) {
    const candidates = [tok, stemTurkishToken(tok)];
    for (const cand of candidates) {
      if (cand !== tok && cand.length >= 3 && !STOP_WORDS.has(cand)) {
        expanded.add(cand);
      }
      if (BILINGUAL_LEXICON[cand]) {
        bilingualHits.push(cand);
        for (const syn of BILINGUAL_LEXICON[cand]) {
          expanded.add(syn);
          if (syn.includes("-")) {
            syn.split("-").forEach((p) => p.length >= 2 && expanded.add(p));
          }
        }
      }
    }
  }

  for (const kw of extraKeywords) {
    const folded = foldTurkish(kw);
    if (folded.length >= 2 && !STOP_WORDS.has(folded)) expanded.add(folded);
  }

  return {
    rawTokens: Array.from(new Set(rawTokens)),
    expandedTokens: Array.from(expanded),
    bilingualHits: Array.from(new Set(bilingualHits)),
  };
}

function tokenize(text) {
  return normalizeQuery(text).expandedTokens;
}

function inferStackSignals(files = [], taskText = "") {
  const boostedSkills = new Map();
  const extraKeywords = new Set();

  const inputs = [...files, ...String(taskText).split(/\s+/)];
  for (const item of inputs) {
    for (const rule of STACK_RULES) {
      if (rule.match.test(item)) {
        rule.keywords.forEach((k) => extraKeywords.add(k));
        rule.boostSkills.forEach((id, idx) => {
          const prev = boostedSkills.get(id) || 0;
          boostedSkills.set(id, prev + (28 - idx * 3));
        });
      }
    }
  }

  return {
    boostedSkills,
    extraKeywords: Array.from(extraKeywords),
  };
}

function fnv1aHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SEMANTIC_DIM = 256;

function buildDenseEmbedding(text, tokens = []) {
  const vec = new Float32Array(SEMANTIC_DIM);
  const folded = foldTurkish(text).replace(/[^a-z0-9]+/g, " ").trim();

  // Character trigrams
  const padded = ` ${folded} `;
  for (let i = 0; i + 3 <= padded.length; i++) {
    const tri = padded.slice(i, i + 3);
    const h = fnv1aHash(tri);
    const idx = h % SEMANTIC_DIM;
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[idx] += sign * 0.45;
  }

  // Whole semantic/normalized tokens weighted higher than character trigrams
  for (const tok of tokens) {
    const h = fnv1aHash("tok:" + tok);
    const idx = h % SEMANTIC_DIM;
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[idx] += sign * 1.4;
  }

  let norm = 0;
  for (let i = 0; i < SEMANTIC_DIM; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < SEMANTIC_DIM; i++) vec[i] /= norm;
  }
  return vec;
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function inferSkillDomain(skill) {
  if (skill.id.startsWith("rc-")) {
    const parts = skill.id.split("-");
    // Match known 3-part or 4-part rc domain prefixes
    for (const dom of Object.keys(DOMAIN_DEPENDENCY_GRAPH)) {
      if (skill.id.startsWith(`rc-${dom}`)) return dom;
    }
    return parts.slice(1, 3).join("-");
  }
  if (skill.id.startsWith("rei-")) return "reverse-engineering";
  return skill.category || "general";
}

const indexCache = new WeakMap();

function getOrBuildIndex(catalogData) {
  if (catalogData && indexCache.has(catalogData)) {
    return indexCache.get(catalogData);
  }

  const skills = (catalogData && catalogData.skills) || [];
  const N = skills.length || 1;
  const postings = new Map(); // term -> Array<{ docIdx, tfWeighted }>
  const docLengths = new Float32Array(skills.length);
  const docs = new Array(skills.length);
  let totalDocLen = 0;

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const idTokens = tokenizeRaw(skill.id);
    const nameTokens = tokenizeRaw(skill.name || skill.id);
    const tagTokens = (skill.tags || []).flatMap((t) => tokenizeRaw(String(t)));
    const trigTokens = (skill.triggers || []).flatMap((t) => tokenizeRaw(String(t)));
    const catTokens = tokenizeRaw(skill.category || "");
    const descTokens = tokenizeRaw(skill.description || "");

    const termWeights = new Map();
    const addField = (arr, weight) => {
      for (const tok of arr) {
        termWeights.set(tok, (termWeights.get(tok) || 0) + weight);
      }
    };

    addField(idTokens, 4.0);
    addField(nameTokens, 2.5);
    addField(tagTokens, 3.0);
    addField(trigTokens, 2.4);
    addField(catTokens, 1.5);
    addField(descTokens, 1.3);

    let len = 0;
    for (const [term, w] of termWeights.entries()) {
      len += w;
      let list = postings.get(term);
      if (!list) {
        list = [];
        postings.set(term, list);
      }
      list.push({ docIdx: i, tf: w });
    }
    docLengths[i] = len || 1;
    totalDocLen += docLengths[i];

    const allConceptTokens = Array.from(termWeights.keys());
    const vec = buildDenseEmbedding(`${skill.id} ${skill.description || ""} ${(skill.tags || []).join(" ")}`, allConceptTokens);
    const domain = inferSkillDomain(skill);

    docs[i] = {
      skill,
      domain,
      tokenSet: new Set(idTokens.concat(tagTokens)),
      embedding: vec,
    };
  }

  const avgDocLen = totalDocLen / N;
  const idf = new Map();
  for (const [term, list] of postings.entries()) {
    const df = list.length;
    idf.set(term, Math.log(1 + (N - df + 0.5) / (df + 0.5)));
  }

  const built = { docs, postings, docLengths, avgDocLen, idf, N };
  if (catalogData && typeof catalogData === "object") {
    indexCache.set(catalogData, built);
  }
  return built;
}

function isRiskAllowed(skillRisk, safeOnly, maxRisk) {
  const r = String(skillRisk || "unknown").toLowerCase();
  if (safeOnly && (r === "offensive" || r === "critical")) {
    return false;
  }
  if (maxRisk && RISK_RANK[maxRisk] !== undefined && RISK_RANK[r] !== undefined) {
    if (RISK_RANK[r] > RISK_RANK[maxRisk]) return false;
  }
  return true;
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union ? inter / union : 0;
}

function detectOverlaps(candidates) {
  const overlaps = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const sim = jaccardSimilarity(candidates[i].tokenSet, candidates[j].tokenSet);
      if (sim >= 0.55) {
        overlaps.push({
          skillA: candidates[i].id,
          skillB: candidates[j].id,
          similarity: Number(sim.toFixed(2)),
        });
      }
    }
  }
  return overlaps;
}

function inferSkillDependencies(domain, candidateIdsByDomain) {
  const spec = DOMAIN_DEPENDENCY_GRAPH[domain] || { prerequisites: [], followUps: [] };
  return {
    prerequisites: spec.prerequisites.map((d) => ({
      domain: d,
      suggestedSkills: (candidateIdsByDomain.get(d) || []).slice(0, 2),
    })),
    followUps: spec.followUps.map((d) => ({
      domain: d,
      suggestedSkills: (candidateIdsByDomain.get(d) || []).slice(0, 2),
    })),
  };
}

/**
 * Hybrid semantic + BM25 + stack + risk-aware router.
 */
function recommendHybrid(catalogData, bundlesData, workflowsData, options = {}) {
  const startNs = process.hrtime.bigint();
  const task = String(options.task || "").trim();
  const files = Array.isArray(options.files)
    ? options.files
    : typeof options.files === "string"
      ? options.files.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const maxResults = Math.max(1, Number(options.maxResults || 8));
  const safeOnly = Boolean(options.safeOnly);
  const maxRisk = options.maxRisk ? String(options.maxRisk).toLowerCase() : null;
  const categoryFilter = options.category ? String(options.category).toLowerCase() : null;

  const index = getOrBuildIndex(catalogData);
  const { boostedSkills, extraKeywords } = inferStackSignals(files, task);
  const norm = normalizeQuery(task, extraKeywords);
  const queryTokens = norm.expandedTokens;
  const rawTokenSet = new Set(norm.rawTokens);
  const queryLower = foldTurkish(task);

  // Detect matching phrase rules
  const matchedPhrases = [];
  const phraseDomainBoosts = new Set();
  const phraseSkillBoosts = new Map();
  for (const rule of PHRASE_RULES) {
    if (rule.pattern.test(task) || rule.pattern.test(queryLower)) {
      matchedPhrases.push(rule);
      for (const dom of rule.domains) phraseDomainBoosts.add(dom);
      rule.boostSkills.forEach((sid, idx) => {
        const val = Math.max(8, rule.bonus - idx * 3);
        phraseSkillBoosts.set(sid, (phraseSkillBoosts.get(sid) || 0) + val);
      });
    }
  }

  // Query dense embedding (use optional external provider if supplied, else offline trigram+concept)
  let queryEmbedding = null;
  if (options.embeddingProvider && typeof options.embeddingProvider.embed === "function") {
    try {
      queryEmbedding = options.embeddingProvider.embed(task);
    } catch {
      queryEmbedding = null;
    }
  }
  if (!queryEmbedding) {
    queryEmbedding = buildDenseEmbedding(`${task} ${queryTokens.join(" ")}`, queryTokens);
  }

  // 1. Fast BM25 retrieval via inverted postings list
  const k1 = 1.4;
  const b = 0.72;
  const bm25Scores = new Float64Array(index.docs.length);
  const matchedTermCounts = new Uint16Array(index.docs.length);
  const matchedRawCounts = new Uint16Array(index.docs.length);

  for (const term of queryTokens) {
    const list = index.postings.get(term);
    if (!list) continue;
    const termIdf = index.idf.get(term) || 1.0;
    const isRaw = rawTokenSet.has(term);
    const termWeight = isRaw ? 1.15 : 0.92;

    for (let j = 0; j < list.length; j++) {
      const { docIdx, tf } = list[j];
      const normDenom = tf + k1 * (1 - b + b * (index.docLengths[docIdx] / index.avgDocLen));
      const contribution = termIdf * ((tf * (k1 + 1)) / normDenom) * termWeight;
      bm25Scores[docIdx] += contribution;
      matchedTermCounts[docIdx]++;
      if (isRaw) matchedRawCounts[docIdx]++;
    }
  }

  // Track query term coverage per document
  const rawQueryLen = Math.max(1, norm.rawTokens.length);
  let maxBm25 = 0;
  for (let i = 0; i < bm25Scores.length; i++) {
    if (bm25Scores[i] > maxBm25) maxBm25 = bm25Scores[i];
  }

  // 2. Score candidates combining BM25 + semantic cosine + stack/phrase boosts
  const candidates = [];
  for (let i = 0; i < index.docs.length; i++) {
    const doc = index.docs[i];
    const skill = doc.skill;

    if (!isRiskAllowed(skill.risk, safeOnly, maxRisk)) continue;
    if (categoryFilter && (skill.category || "").toLowerCase() !== categoryFilter) continue;

    const bm25 = bm25Scores[i];
    const stackBoost = boostedSkills.get(skill.id) || 0;
    const explicitIdMatch = queryLower.includes(skill.id.toLowerCase()) ? 45 : 0;
    const directPhraseBoost = phraseSkillBoosts.get(skill.id) || 0;
    const domainBoost = phraseDomainBoosts.has(doc.domain) ? 7.5 : 0;

    // Only compute cosine similarity when there is at least a lexical/phrase/stack clue
    // OR during broad fallback if query is small
    const semanticSim =
      bm25 > 0 || stackBoost > 0 || explicitIdMatch > 0 || directPhraseBoost > 0 || domainBoost > 0
        ? Math.max(0, cosineSimilarity(queryEmbedding, doc.embedding))
        : 0;

    if (bm25 === 0 && stackBoost === 0 && explicitIdMatch === 0 && directPhraseBoost === 0) {
      continue;
    }

    const termCoverageBonus = matchedTermCounts[i] > 1 ? Math.min(20, matchedTermCounts[i] * 2.5) : 0;
    const semanticScore = semanticSim * 18;
    const totalScore = bm25 * 2.15 + semanticScore + stackBoost + explicitIdMatch + directPhraseBoost + domainBoost + termCoverageBonus;

    const reasons = [];
    if (stackBoost > 0) reasons.push(`File/stack signature match (+${stackBoost})`);
    if (explicitIdMatch > 0) reasons.push("Exact skill ID mention (+45)");
    if (directPhraseBoost > 0) reasons.push(`Domain intent phrase match (+${directPhraseBoost})`);
    if (domainBoost > 0) reasons.push(`Domain alignment: ${doc.domain}`);
    if (bm25 > 0) reasons.push(`BM25 lexical relevance (${matchedTermCounts[i]} terms, ${bm25.toFixed(1)})`);
    if (semanticSim > 0.15) reasons.push(`Offline semantic similarity (${(semanticSim * 100).toFixed(0)}%)`);
    if (norm.bilingualHits.length > 0) reasons.push(`Bilingual normalization (${norm.bilingualHits.slice(0, 3).join(", ")})`);

    const expectedDenom = Math.max(24, rawQueryLen * 9 + 16);
    const confidence = Math.min(99, Math.max(5, Math.round((totalScore / expectedDenom) * 100)));

    candidates.push({
      id: skill.id,
      name: skill.name || skill.id,
      category: skill.category,
      domain: doc.domain,
      risk: skill.risk,
      source: skill.source,
      description: skill.description,
      path: skill.path || `skills/${skill.id}/SKILL.md`,
      score: Number(totalScore.toFixed(3)),
      confidence,
      reasons,
      scoreBreakdown: {
        bm25: Number((bm25 * 2.15).toFixed(3)),
        semantic: Number(semanticScore.toFixed(3)),
        stackBoost,
        phraseBoost: directPhraseBoost + domainBoost,
        multiTermBonus: termCoverageBonus,
      },
      matchedTerms: matchedTermCounts[i],
      matchedRawTerms: matchedRawCounts[i],
      semanticSim: Number(semanticSim.toFixed(4)),
      tokenSet: doc.tokenSet,
      riskNotice:
        skill.risk === "critical" || skill.risk === "offensive"
          ? `Requires review/authorization (risk: ${skill.risk})`
          : null,
    });
  }

  candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  // 3. Domain-diversity re-ranking for top slots when multiple domains are detected
  let topSkills;
  if (phraseDomainBoosts.size >= 2 && candidates.length > maxResults) {
    const selected = [];
    const selectedIds = new Set();
    // First ensure top-1 representative from each matched domain up to maxResults
    for (const dom of phraseDomainBoosts) {
      if (selected.length >= maxResults) break;
      const bestForDom = candidates.find((c) => c.domain === dom && !selectedIds.has(c.id));
      if (bestForDom) {
        selected.push(bestForDom);
        selectedIds.add(bestForDom.id);
      }
    }
    // Fill remaining slots by overall score
    for (const c of candidates) {
      if (selected.length >= maxResults) break;
      if (!selectedIds.has(c.id)) {
        selected.push(c);
        selectedIds.add(c.id);
      }
    }
    topSkills = selected.slice(0, maxResults);
  } else {
    topSkills = candidates.slice(0, maxResults);
  }

  // 4. Uncertainty & out-of-scope assessment
  const top = topSkills[0] || null;
  const maxMatchedTerms = top ? top.matchedTerms : 0;
  const maxMatchedRaw = top ? top.matchedRawTerms : 0;
  const maxBm25Top = top ? top.scoreBreakdown.bm25 : 0;
  const maxSemTop = top ? top.semanticSim : 0;
  const hasDomainOrStackSignal =
    phraseDomainBoosts.size > 0 || boostedSkills.size > 0 || norm.bilingualHits.length > 0;

  let uncertaintyState = "confident";
  let uncertaintyScore = 0.1;
  const uncertaintyReasons = [];

  if (!top) {
    uncertaintyState = "high_uncertainty_or_out_of_scope";
    uncertaintyScore = 0.98;
    uncertaintyReasons.push("No matching engineering skill signals found.");
  } else if (
    !hasDomainOrStackSignal &&
    rawQueryLen >= 3 &&
    maxMatchedTerms <= 1
  ) {
    uncertaintyState = "high_uncertainty_or_out_of_scope";
    uncertaintyScore = 0.9;
    uncertaintyReasons.push(
      `Only ${maxMatchedTerms}/${rawQueryLen} query terms matched without domain/stack confirmation.`
    );
  } else if (
    !hasDomainOrStackSignal &&
    rawQueryLen >= 4 &&
    maxMatchedRaw / rawQueryLen < 0.34
  ) {
    uncertaintyState = "high_uncertainty_or_out_of_scope";
    uncertaintyScore = 0.84;
    uncertaintyReasons.push(
      `Low query coverage (${maxMatchedRaw}/${rawQueryLen} raw terms) without domain/stack confirmation.`
    );
  } else if (top.confidence < 45 || (topSkills[1] && top.score - topSkills[1].score < 1.5 && topSkills.length >= 2)) {
    uncertaintyState = "moderate_uncertainty";
    uncertaintyScore = 0.42;
    uncertaintyReasons.push("Top candidates have close scores or moderate query coverage.");
  } else {
    uncertaintyReasons.push("Strong multi-signal alignment across lexical, semantic, and domain signals.");
  }

  // Group candidate IDs by domain for dependency annotations
  const candidateIdsByDomain = new Map();
  for (const c of candidates.slice(0, 30)) {
    if (!candidateIdsByDomain.has(c.domain)) candidateIdsByDomain.set(c.domain, []);
    candidateIdsByDomain.get(c.domain).push(c.id);
  }

  const overlaps = detectOverlaps(topSkills);
  const overlapBySkill = new Map();
  for (const ov of overlaps) {
    if (!overlapBySkill.has(ov.skillA)) overlapBySkill.set(ov.skillA, []);
    if (!overlapBySkill.has(ov.skillB)) overlapBySkill.set(ov.skillB, []);
    overlapBySkill.get(ov.skillA).push({ id: ov.skillB, similarity: ov.similarity });
    overlapBySkill.get(ov.skillB).push({ id: ov.skillA, similarity: ov.similarity });
  }

  const formattedSkills = topSkills.map((c) => {
    const adjustedConfidence =
      uncertaintyState === "high_uncertainty_or_out_of_scope" ? Math.min(28, c.confidence) : c.confidence;
    return {
      id: c.id,
      name: c.name,
      category: c.category,
      domain: c.domain,
      risk: c.risk,
      source: c.source,
      description: c.description,
      path: c.path,
      score: c.score,
      confidence: adjustedConfidence,
      reasons: c.reasons,
      scoreBreakdown: c.scoreBreakdown,
      dependencies: inferSkillDependencies(c.domain, candidateIdsByDomain),
      overlappingWith: overlapBySkill.get(c.id) || [],
      ...(c.riskNotice ? { riskNotice: c.riskNotice } : {}),
    };
  });

  const topSkillIds = new Set(formattedSkills.map((s) => s.id));

  // Recommend matching workflows
  const workflows = (workflowsData && workflowsData.workflows) || [];
  const recommendedWorkflows = workflows
    .map((wf) => {
      const wfSkillIds = new Set();
      for (const step of wf.steps || []) {
        for (const sid of step.skills || []) wfSkillIds.add(sid);
      }
      let overlap = 0;
      for (const sid of topSkillIds) {
        if (wfSkillIds.has(sid)) overlap++;
      }
      const wfText = foldTurkish(`${wf.id} ${wf.name} ${wf.description} ${wf.category}`);
      let tokenHits = 0;
      for (const tok of queryTokens) {
        if (wfText.includes(tok)) tokenHits++;
      }
      const wfScore = overlap * 15 + tokenHits * 6;
      return {
        id: wf.id,
        name: wf.name,
        category: wf.category,
        description: wf.description,
        steps: wf.steps,
        score: wfScore,
      };
    })
    .filter((w) => w.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // Recommend matching role bundles
  const bundlesMap = (bundlesData && bundlesData.bundles) || {};
  const recommendedBundles = Object.entries(bundlesMap)
    .map(([bId, bun]) => {
      const bSkills = bun.skills || [];
      const overlap = bSkills.filter((sid) => topSkillIds.has(sid)).length;
      return {
        id: bId,
        name: bun.name || bId,
        description: bun.description || "",
        matchedSkillsCount: overlap,
        totalSkillsCount: bSkills.length,
        installCommand: `npx rei-skills add ${bId}`,
      };
    })
    .filter((bun) => bun.matchedSkillsCount > 0)
    .sort((a, b) => b.matchedSkillsCount - a.matchedSkillsCount)
    .slice(0, 3);

  const latencyMs = Number((Number(process.hrtime.bigint() - startNs) / 1e6).toFixed(3));
  const detectedDomains = Array.from(
    new Set([...phraseDomainBoosts, ...formattedSkills.slice(0, 5).map((s) => s.domain)])
  );

  return {
    query: {
      task,
      files,
      extractedTokens: queryTokens,
      rawTokens: norm.rawTokens,
      bilingualNormalizations: norm.bilingualHits,
    },
    recommendedSkills: formattedSkills,
    recommendedWorkflows,
    recommendedBundles,
    overlappingSkills: overlaps,
    detectedDomains,
    uncertainty: {
      state: uncertaintyState,
      score: uncertaintyScore,
      isOutOfScope: uncertaintyState === "high_uncertainty_or_out_of_scope",
      reasons: uncertaintyReasons,
    },
    routingMeta: {
      engine: options.embeddingProvider ? "hybrid-v1-external-embeddings" : "hybrid-v1-offline",
      latencyMs,
      totalCandidatesEvaluated: candidates.length,
      catalogSize: index.N,
    },
    executionPlan: formattedSkills.slice(0, 3).map((s, idx) => ({
      step: idx + 1,
      skillId: s.id,
      action: `Load '${s.path}' (${s.category}, risk: ${s.risk}) — ${s.description}`,
    })),
  };
}

module.exports = {
  STOP_WORDS,
  STACK_RULES,
  BILINGUAL_LEXICON,
  PHRASE_RULES,
  DOMAIN_DEPENDENCY_GRAPH,
  foldTurkish,
  stemTurkishToken,
  normalizeQuery,
  tokenize,
  inferStackSignals,
  buildDenseEmbedding,
  cosineSimilarity,
  getOrBuildIndex,
  recommendHybrid,
};
