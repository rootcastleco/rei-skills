#!/usr/bin/env node
"use strict";

/**
 * Deterministic generator & validator for the 260-task REI Skills Routing Benchmark.
 * Produces `data/benchmarks/routing-benchmark-v1.json` partitioned into:
 *   - train (80 tasks)
 *   - dev   (60 tasks)
 *   - eval  (120 held-out tasks)
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data", "catalog.json");
const OUT_PATH = path.join(ROOT, "data", "benchmarks", "routing-benchmark-v1.json");

function makeTask(id, split, queryType, language, task, files, safeOnly, expectedSkills, expectedDomains) {
  return {
    id,
    split,
    queryType,
    language,
    task,
    files: Array.isArray(files) ? files : [],
    safeOnly: Boolean(safeOnly),
    expectedSkills: Array.isArray(expectedSkills) ? expectedSkills : [],
    forbiddenRisks: safeOnly ? ["offensive", "critical"] : [],
    expectedDomains: Array.isArray(expectedDomains) ? expectedDomains : [],
    expectLowConfidence: expectedSkills.length === 0,
  };
}

function buildDataset() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const catalogMap = new Map((catalog.skills || []).map((s) => [s.id, s]));

  // Curated benchmark tasks across train (80), dev (60), and eval (120).
  const tasks = [
    // =========================================================================
    // TRAIN SPLIT (80 tasks)
    // =========================================================================
    makeTask("tr-001", "train", "positive_en", "en", "Design low-noise ADC voltage reference and sampling settling network", [], false, [
      "rc-circuit-architecture-adc-reference-network",
      "rc-circuit-simulation-adc-sampling-settling",
    ], ["circuit-architecture", "circuit-simulation"]),
    makeTask("tr-002", "train", "positive_en", "en", "Compute worst-case power tree budget and LDO dropout margin under peak load", [], false, [
      "rc-circuit-architecture-power-tree-budgeting",
      "rc-circuit-architecture-ldo-dropout-analysis",
    ], ["circuit-architecture"]),
    makeTask("tr-003", "train", "positive_en", "en", "Run KiCad schematic ERC and board DRC with schematic parity check", ["sensor.kicad_sch", "sensor.kicad_pcb"], false, [
      "rc-kicad-ecad-kicad-erc-automation",
      "rc-kicad-ecad-kicad-drc-ci",
      "rc-kicad-ecad-kicad-ecad-release-gate",
    ], ["kicad-ecad"]),
    makeTask("tr-004", "train", "positive_en", "en", "Export Fusion 360 parametric enclosure design to STEP and STL", ["housing.f3d"], false, [
      "rc-fusion360-parametric-fusion-step-stl-export",
      "rc-fusion360-api-fusion-api-export-step",
    ], ["fusion360-parametric", "fusion360-api"]),
    makeTask("tr-005", "train", "positive_en", "en", "Align PCB STEP solid inside enclosure and verify mounting hole pattern", ["board.step", "case.f3d"], false, [
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-ecad-mcad-fit-mounting-hole-pattern",
    ], ["ecad-mcad-fit"]),
    makeTask("tr-006", "train", "positive_en", "en", "Analyze Android APK DEX bytecode, manifest permissions, and JNI bridge", ["app.apk"], false, [
      "rei-android-apks",
      "rei-rea-orchestrator",
    ], ["reverse-engineering"]),
    makeTask("tr-007", "train", "positive_en", "en", "Triage embedded router firmware image for SquashFS partitions and entropy", ["router.bin"], false, [
      "rei-firmware-and-iot",
      "rei-binary-intelligence",
      "rc-binary-forensics-firmware-partition-map",
    ], ["reverse-engineering", "binary-forensics"]),
    makeTask("tr-008", "train", "positive_en", "en", "Inspect Electron ASAR archive preload script and IPC routes", ["desktop.asar"], false, [
      "rei-electron-and-js",
      "rei-rea-orchestrator",
    ], ["reverse-engineering"]),
    makeTask("tr-009", "train", "positive_en", "en", "Validate GNSS carrier cycle slip and RAIM integrity residuals", [], false, [
      "rc-gnss-measurement-carrier-cycle-slip",
      "rc-gnss-measurement-raim-integrity-residuals",
    ], ["gnss-measurement"]),
    makeTask("tr-010", "train", "positive_en", "en", "Convert accelerometer vibration spectrum to velocity and check FFT window leakage", [], false, [
      "rc-machine-vibration-acceleration-to-velocity",
      "rc-machine-vibration-fft-window-leakage",
    ], ["machine-vibration"]),
    makeTask("tr-011", "train", "positive_en", "en", "Calculate single-plane rotor balancing trial mass influence vector and phase wrap", [], false, [
      "rc-rotor-mass-balance-single-plane-influence",
      "rc-rotor-mass-balance-phase-wrap-correction",
      "rc-rotor-mass-balance-trial-mass-selection",
    ], ["rotor-mass-balance"]),
    makeTask("tr-012", "train", "positive_en", "en", "Design IEPE accelerometer anti-alias filter and ADC quantization error budget", [], false, [
      "rc-sensor-acquisition-accelerometer-sensitivity",
      "rc-sensor-acquisition-anti-alias-filter-choice",
      "rc-sensor-acquisition-adc-quantization-budget",
    ], ["sensor-acquisition"]),
    makeTask("tr-013", "train", "positive_en", "en", "Audit embedded RTOS DMA buffer ownership and priority inversion on shared mutexes", [], false, [
      "rc-embedded-rtos-dma-buffer-ownership",
      "rc-embedded-rtos-priority-inversion-analysis",
    ], ["embedded-rtos"]),
    makeTask("tr-014", "train", "positive_en", "en", "Implement A/B firmware OTA slot state machine with anti-rollback counter", [], false, [
      "rc-firmware-ota-ab-slot-state-machine",
      "rc-firmware-ota-anti-rollback-versioning",
    ], ["firmware-ota"]),
    makeTask("tr-015", "train", "positive_en", "en", "Decode JT808 device protocol byte escaping and verify XOR checksum", [], false, [
      "rc-jt808-protocol-byte-escape-decoding",
      "rc-jt808-protocol-checksum-xor-verification",
    ], ["jt808-protocol"]),
    makeTask("tr-016", "train", "positive_en", "en", "Design BLE sensor node GATT characteristic contract and MTU fragment reassembly", [], false, [
      "rc-ble-sensor-nodes-gatt-characteristic-contract",
      "rc-ble-sensor-nodes-mtu-fragment-reassembly",
    ], ["ble-sensor-nodes"]),
    makeTask("tr-017", "train", "positive_en", "en", "Diagnose cellular IoT gateway modem attach sequence and offline queue persistence", [], false, [
      "rc-cellular-gateway-modem-attach-sequence",
      "rc-cellular-gateway-offline-queue-durability",
    ], ["cellular-gateway"]),
    makeTask("tr-018", "train", "positive_en", "en", "Verify industrial Ethernet PTP clock asymmetry and redundant ring convergence", [], false, [
      "rc-industrial-ethernet-ptp-clock-error",
      "rc-industrial-ethernet-redundant-ring-convergence",
    ], ["industrial-ethernet"]),
    makeTask("tr-019", "train", "positive_en", "en", "Audit IoT device mutual TLS handshake and provisioning supply chain security", [], false, [
      "rc-iot-device-security-mutual-tls-handshake-audit",
      "rc-iot-device-security-provisioning-supply-chain",
    ], ["iot-device-security"]),
    makeTask("tr-020", "train", "positive_en", "en", "Investigate PCB conducted emission harmonics and ESD discharge return path", [], false, [
      "rc-electromagnetic-compat-conducted-emission-scans",
      "rc-electromagnetic-compat-esd-discharge-path",
    ], ["electromagnetic-compat"]),
    makeTask("tr-021", "train", "positive_en", "en", "Review analog digital ground partition and differential pair skew on 4-layer PCB", ["board.kicad_pcb"], false, [
      "rc-pcb-design-review-analog-digital-partition",
      "rc-pcb-design-review-high-speed-differential-pairs",
    ], ["pcb-design-review"]),
    makeTask("tr-022", "train", "positive_en", "en", "Run hardware-in-the-loop ADC calibration fixture and CAN traffic replay", [], false, [
      "rc-hardware-in-loop-adc-calibration-fixture",
      "rc-hardware-in-loop-can-traffic-replay",
    ], ["hardware-in-loop"]),
    makeTask("tr-023", "train", "positive_en", "en", "Build fleet telematics trip segmentation and geofence entry exit hysteresis", [], false, [
      "rc-fleet-telematics-trip-segmentation",
      "rc-fleet-telematics-geofence-entry-exit",
    ], ["fleet-telematics"]),
    makeTask("tr-024", "train", "positive_en", "en", "Handle timeseries telemetry late event watermarks and out-of-order upserts", [], false, [
      "rc-timeseries-telemetry-late-event-watermarks",
      "rc-timeseries-telemetry-out-of-order-upsert",
    ], ["timeseries-telemetry"]),
    makeTask("tr-025", "train", "positive_en", "en", "Design Kafka event outbox atomicity and dead letter queue replay policy", [], false, [
      "rc-event-streaming-event-outbox-atomicity",
      "rc-event-streaming-dead-letter-queue",
    ], ["event-streaming"]),
    makeTask("tr-026", "train", "positive_en", "en", "Implement Rust async protocol backpressure channel budget and framed codec bounds", ["Cargo.toml", "codec.rs"], false, [
      "rc-rust-protocols-backpressure-channel-budget",
      "rc-rust-protocols-framed-codec-bounds",
      "rust-pro",
    ], ["rust-protocols", "development"]),
    makeTask("tr-027", "train", "positive_en", "en", "Validate edge ML int8 quantization error bounds and sensor failure fallback", [], false, [
      "rc-edge-machine-learning-quantization-error-bounds",
      "rc-edge-machine-learning-sensor-failure-fallback",
    ], ["edge-machine-learning"]),
    makeTask("tr-028", "train", "positive_en", "en", "Audit multiobjective Pareto optimization constraint feasibility and variable scaling", [], false, [
      "rc-optimization-experiments-constraint-feasibility-audit",
      "rc-optimization-experiments-multiobjective-pareto-review",
    ], ["optimization-experiments"]),
    makeTask("tr-029", "train", "positive_en", "en", "Set up reproducible experiment seed control and measurement uncertainty budget", [], false, [
      "rc-reproducible-research-experiment-seed-control",
      "rc-reproducible-research-measurement-uncertainty-budget",
    ], ["reproducible-research"]),
    makeTask("tr-030", "train", "positive_en", "en", "Construct fault tree decomposition and safety release gate matrix", [], false, [
      "rc-safety-assurance-fault-tree-decomposition",
      "rc-safety-assurance-release-safety-gate",
    ], ["safety-assurance"]),
    makeTask("tr-031", "train", "positive_en", "en", "Size O-ring seal groove and tolerance stack-up for waterproof CAD enclosure", [], false, [
      "rc-cad-3d-assembly-o-ring-groove-design",
      "rc-cad-3d-assembly-tolerance-stack-up",
    ], ["cad-3d-assembly"]),
    makeTask("tr-032", "train", "positive_en", "en", "Generate Fusion 360 CAM adaptive clearing toolpath and verify postprocessor NC code", [], false, [
      "rc-fusion360-cam-fusion-cam-adaptive-clearing",
      "rc-fusion360-cam-fusion-cam-postprocess-review",
    ], ["fusion360-cam"]),
    makeTask("tr-033", "train", "positive_en", "en", "Create Fusion 360 Python script using ValueInput parameter units", [], false, [
      "rc-fusion360-api-fusion-api-parameter-units",
      "rc-fusion360-api-fusion-api-script-scaffold",
    ], ["fusion360-api"]),
    makeTask("tr-034", "train", "positive_en", "en", "Build stateful multi-agent workflow with LangGraph and RAG retrieval", [], false, [
      "langgraph",
      "rag-engineer",
      "rag-implementation",
    ], ["data-ai"]),
    makeTask("tr-035", "train", "positive_en", "en", "Build Model Context Protocol server with validated tool schemas", [], false, [
      "mcp-builder",
    ], ["workflow", "data-ai"]),
    makeTask("tr-036", "train", "positive_en", "en", "Model bounded contexts, aggregates, and CQRS projections using DDD", [], false, [
      "domain-driven-design",
      "ddd-strategic-design",
      "ddd-tactical-patterns",
      "cqrs-implementation",
    ], ["architecture"]),
    makeTask("tr-037", "train", "positive_en", "en", "Optimize PostgreSQL indexing and connection pooling performance", ["schema.sql"], false, [
      "postgres-best-practices",
      "database-design",
    ], ["data-ai"]),
    makeTask("tr-038", "train", "positive_en", "en", "Write Next.js App Router server components and optimize React rendering", ["app.tsx", "next.config.ts"], false, [
      "nextjs-best-practices",
      "react-best-practices",
    ], ["development"]),
    makeTask("tr-039", "train", "positive_en", "en", "Set up Kubernetes GitOps deployment pipeline with Prometheus observability", ["Dockerfile"], false, [
      "kubernetes-architect",
      "gitops-workflow",
      "observability-engineer",
    ], ["infrastructure"]),
    makeTask("tr-040", "train", "positive_en", "en", "Implement test-driven development and end-to-end Playwright browser tests", [], false, [
      "test-driven-development",
      "playwright-skill",
      "e2e-testing-patterns",
    ], ["testing"]),
    makeTask("tr-041", "train", "positive_en", "en", "Debug failing async unit tests systematically before writing fixes", [], false, [
      "systematic-debugging",
      "test-fixing",
    ], ["testing", "general"]),
    makeTask("tr-042", "train", "positive_en", "en", "Configure cloud autoscaling thresholds, error budgets, and TLS certificate expiry alerts", [], false, [
      "rc-cloud-service-ops-autoscaling-thresholds",
      "rc-cloud-service-ops-service-error-budget",
      "rc-cloud-service-ops-tls-certificate-expiry",
    ], ["cloud-service-ops"]),
    makeTask("tr-043", "train", "positive_en", "en", "Handle mobile field app offline edit conflicts and Android background limits", [], false, [
      "rc-mobile-field-ops-offline-edit-conflicts",
      "rc-mobile-field-ops-android-background-limits",
    ], ["mobile-field-ops"]),
    makeTask("tr-044", "train", "positive_en", "en", "Analyze WebAssembly binary structure and verify clean-room behavioral parity", ["filter.wasm"], false, [
      "rei-wasm-and-managed",
      "rei-reconstruction-parity",
      "rei-binary-intelligence",
    ], ["reverse-engineering"]),
    makeTask("tr-045", "train", "positive_en", "en", "Examine PE/ELF native binary symbols, imports, and SHA-256 casebook ledger", ["libcodec.so"], false, [
      "rei-native-binaries",
      "rei-casebook-forensics",
      "rei-evidence-ledger",
    ], ["reverse-engineering"]),
    makeTask("tr-046", "train", "positive_tr", "tr", "Elektronik devre tasarımı güç kaynağı voltaj regülatörü ve buck dönüştürücü", [], false, [
      "rc-circuit-architecture-power-tree-budgeting",
      "rc-circuit-architecture-buck-converter-selection",
      "rc-circuit-architecture-ldo-dropout-analysis",
    ], ["circuit-architecture"]),
    makeTask("tr-047", "train", "positive_tr", "tr", "Fusion 360 ile parametrik 3D muhafaza çizimi ve STEP dışa aktarımı", ["enclosure.f3d"], false, [
      "rc-fusion360-parametric-fusion-design-parameter-table",
      "rc-fusion360-parametric-fusion-step-stl-export",
    ], ["fusion360-parametric"]),
    makeTask("tr-048", "train", "positive_tr", "tr", "KiCad şematik ERC ve PCB DRC kurallarını doğrula", ["board.kicad_pcb"], false, [
      "rc-kicad-ecad-kicad-erc-automation",
      "rc-kicad-ecad-kicad-drc-ci",
    ], ["kicad-ecad"]),
    makeTask("tr-049", "train", "positive_tr", "tr", "Android APK ve gömülü firmware dosyası tersine mühendislik analizi", ["app.apk", "fw.bin"], false, [
      "rei-android-apks",
      "rei-firmware-and-iot",
      "rei-rea-orchestrator",
    ], ["reverse-engineering"]),
    makeTask("tr-050", "train", "positive_tr", "tr", "Tek düzlemli rotor balans deneme ağırlığı ve faz açısı hesabı", [], false, [
      "rc-rotor-mass-balance-single-plane-influence",
      "rc-rotor-mass-balance-trial-mass-selection",
      "rc-rotor-mass-balance-phase-wrap-correction",
    ], ["rotor-mass-balance"]),
    makeTask("tr-051", "train", "positive_tr", "tr", "Makine titreşim spektrumu hız dönüşümü ve yatak arıza frekansları", [], false, [
      "rc-machine-vibration-acceleration-to-velocity",
      "rc-machine-vibration-bearing-defect-sidebands",
    ], ["machine-vibration"]),
    makeTask("tr-052", "train", "positive_tr", "tr", "GNSS konum verisinde çoklu yansıma ve taşıyıcı faz kayması tespiti", [], false, [
      "rc-gnss-measurement-carrier-cycle-slip",
      "rc-gnss-measurement-multipath-diagnostics",
    ], ["gnss-measurement"]),
    makeTask("tr-053", "train", "positive_tr", "tr", "Gömülü RTOS kesme gecikmesi ve görev yığın taşma denetimi", [], false, [
      "rc-embedded-rtos-interrupt-latency-profiling",
      "rc-embedded-rtos-stack-watermark-audit",
    ], ["embedded-rtos"]),
    makeTask("tr-054", "train", "positive_tr", "tr", "Sac metal büküm payı ve vida dişi delik tolerans analizi", [], false, [
      "rc-cad-3d-assembly-sheet-metal-bend-allowance",
      "rc-cad-3d-assembly-thread-clearance-fit",
    ], ["cad-3d-assembly"]),
    makeTask("tr-055", "train", "positive_tr", "tr", "SPICE geçici rejim simülasyonu ve opamp kararlılık faz marjı analizi", [], false, [
      "rc-circuit-simulation-spice-transient-startup",
      "rc-circuit-simulation-opamp-loop-gain-test",
      "rc-circuit-architecture-opamp-stability-margin",
    ], ["circuit-simulation", "circuit-architecture"]),
    makeTask("tr-056", "train", "multilingual_mixed", "mixed", "PCB 3D muhafaza mekanik uyumluluk ve montaj deliği tolerans kontrolü", ["pcb.step"], false, [
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-ecad-mcad-fit-mounting-hole-pattern",
    ], ["ecad-mcad-fit"]),
    makeTask("tr-057", "train", "multilingual_mixed", "mixed", "JT808 protokolü konum paketi çözme ve CRC doğrulama", [], false, [
      "rc-jt808-protocol-location-body-decode",
      "rc-jt808-protocol-checksum-xor-verification",
    ], ["jt808-protocol"]),
    makeTask("tr-058", "train", "multilingual_mixed", "mixed", "Rust ile güvenli soket sunucu ve rate limit backpressure tasarımı", ["server.rs"], false, [
      "rc-rust-protocols-rate-limit-admission-control",
      "rc-rust-protocols-backpressure-channel-budget",
      "rust-pro",
    ], ["rust-protocols"]),
    makeTask("tr-059", "train", "multilingual_mixed", "mixed", "WebSocket ve PCAP ağ trafiği protokol analizi", ["traffic.pcapng"], false, [
      "rei-web-and-protocols",
      "rei-evidence-ledger",
    ], ["reverse-engineering"]),
    makeTask("tr-060", "train", "multilingual_mixed", "mixed", "PostgreSQL veritabanı indeks ve sorgu performans optimizasyonu", ["queries.sql"], false, [
      "postgres-best-practices",
      "database-design",
    ], ["data-ai"]),
    makeTask("tr-061", "train", "ambiguous_multi_domain", "en", "Build a battery-powered BLE vibration sensor enclosure with PCB fit checks", [], false, [
      "rc-ble-sensor-nodes-battery-voltage-interpretation",
      "rc-ecad-mcad-fit-battery-pack-envelope",
      "rc-sensor-acquisition-accelerometer-sensitivity",
    ], ["ble-sensor-nodes", "ecad-mcad-fit", "sensor-acquisition"]),
    makeTask("tr-062", "train", "ambiguous_multi_domain", "en", "Create an RTK GNSS fleet tracker with cellular coexistence and NMEA validation", [], false, [
      "rc-gnss-measurement-nmea-talker-validation",
      "rc-cellular-gateway-gnss-cellular-coexistence",
      "rc-fleet-telematics-distance-odometer-reconcile",
    ], ["gnss-measurement", "cellular-gateway", "fleet-telematics"]),
    makeTask("tr-063", "train", "ambiguous_multi_domain", "en", "Investigate suspicious firmware update failure and verify bootloader handoff hash chain", ["update.bin"], false, [
      "rei-firmware-and-iot",
      "rc-binary-forensics-bootloader-handoff-map",
      "rc-firmware-ota-boot-health-commit",
    ], ["reverse-engineering", "binary-forensics", "firmware-ota"]),
    makeTask("tr-064", "train", "ambiguous_multi_domain", "en", "Evaluate LLM agent retrieval accuracy and deploy behind autoscaled cloud API", [], false, [
      "agent-evaluation",
      "rag-implementation",
      "rc-cloud-service-ops-autoscaling-thresholds",
    ], ["data-ai", "cloud-service-ops"]),
    makeTask("tr-065", "train", "safety_critical_filter", "en", "Test web authentication flows and IDOR access controls safely without offensive exploits", [], true, [
      "auth-implementation-patterns",
      "broken-authentication",
      "idor-testing",
    ], ["security"]),
    makeTask("tr-066", "train", "safety_critical_filter", "en", "Inspect Fusion 360 Electronics board parameters read-only without modifying CAD", ["enclosure.f3d"], true, [
      "rc-fusion360-api-fusion-api-ecad-readonly",
      "rc-fusion360-parametric-fusion-design-parameter-table",
    ], ["fusion360-api", "fusion360-parametric"]),
    makeTask("tr-067", "train", "safety_critical_filter", "en", "Perform static read-only triage on firmware and ELF binary artifacts", ["sample.elf"], true, [
      "rei-binary-intelligence",
      "rei-native-binaries",
      "rei-evidence-ledger",
    ], ["reverse-engineering"]),
    makeTask("tr-068", "train", "safety_critical_filter", "en", "Audit cloud service logs for PII redaction and TLS certificate expiry safely", [], true, [
      "rc-cloud-service-ops-audit-log-redaction",
      "rc-cloud-service-ops-tls-certificate-expiry",
    ], ["cloud-service-ops"]),
    makeTask("tr-069", "train", "safety_critical_filter", "en", "Simulate SPICE switching regulator transient without making hardware board changes", [], true, [
      "rc-circuit-simulation-switching-regulator-transient",
      "rc-circuit-simulation-spice-operating-point",
    ], ["circuit-simulation"]),
    makeTask("tr-070", "train", "safety_critical_filter", "en", "Verify GNSS coordinate datum transform and ephemeris age bounds safely", [], true, [
      "rc-gnss-measurement-geodetic-frame-transform",
      "rc-gnss-measurement-ephemeris-age-screening",
    ], ["gnss-measurement"]),
    makeTask("tr-071", "train", "safety_critical_filter", "tr", "Güvenli okuma modunda Fusion 360 tasarım parametrelerini incele ve STEP kontrolü yap", ["housing.f3d"], true, [
      "rc-fusion360-api-fusion-api-ecad-readonly",
      "rc-fusion360-parametric-fusion-step-stl-export",
    ], ["fusion360-api", "fusion360-parametric"]),
    makeTask("tr-072", "train", "safety_critical_filter", "en", "Run read-only TypeScript strictness and Postgres query plan tuning", ["query.sql"], true, [
      "typescript-pro",
      "postgres-best-practices",
    ], ["development", "data-ai"]),
    makeTask("tr-073", "train", "negative_out_of_scope", "en", "Write a romantic poem about sunset over the Bosphorus bridge", [], false, [], []),
    makeTask("tr-074", "train", "negative_out_of_scope", "en", "Give me a traditional recipe for homemade sourdough bread and croissants", [], false, [], []),
    makeTask("tr-075", "train", "negative_out_of_scope", "tr", "Bugün akşam yemeği için mantarlı makarna tarifi ver", [], false, [], []),
    makeTask("tr-076", "train", "negative_out_of_scope", "en", "Who won the UEFA Champions League final in 2012", [], false, [], []),
    makeTask("tr-077", "train", "negative_out_of_scope", "tr", "Kapadokya hafta sonu tatili için otel ve balon turu öner", [], false, [], []),
    makeTask("tr-078", "train", "negative_out_of_scope", "en", "Explain the rules of chess castling and en passant", [], false, [], []),
    makeTask("tr-079", "train", "negative_out_of_scope", "en", "Translate happy birthday into Japanese and Spanish", [], false, [], []),
    makeTask("tr-080", "train", "negative_out_of_scope", "tr", "Bahçedeki domates fideleri ne zaman sulanmalı", [], false, [], []),

    // =========================================================================
    // DEV SPLIT (60 tasks)
    // =========================================================================
    makeTask("dv-001", "dev", "positive_en", "en", "Calculate op-amp loop gain stability margin under capacitive load", [], false, [
      "rc-circuit-architecture-opamp-stability-margin",
      "rc-circuit-simulation-opamp-loop-gain-test",
    ], ["circuit-architecture", "circuit-simulation"]),
    makeTask("dv-002", "dev", "positive_en", "en", "Verify RS485 bus termination, fail-safe bias, and TVS protection standoff", [], false, [
      "rc-circuit-architecture-rs485-bus-termination",
      "rc-circuit-architecture-esd-tvs-coordination",
    ], ["circuit-architecture"]),
    makeTask("dv-003", "dev", "positive_en", "en", "Check KiCad hierarchical sheet labels and footprint pin-to-pad assignment", ["main.kicad_sch"], false, [
      "rc-kicad-ecad-kicad-hierarchical-sheets",
      "rc-kicad-ecad-kicad-footprint-assignment",
    ], ["kicad-ecad"]),
    makeTask("dv-004", "dev", "positive_en", "en", "Audit KiCad Gerber and Excellon drill fabrication outputs for release", ["board.kicad_pcb"], false, [
      "rc-kicad-ecad-kicad-gerber-drill-package",
      "rc-kicad-ecad-kicad-ecad-release-gate",
    ], ["kicad-ecad"]),
    makeTask("dv-005", "dev", "positive_en", "en", "Check Fusion 360 shell uniform wall thickness and interference detection", ["enclosure.f3d"], false, [
      "rc-fusion360-parametric-fusion-shell-uniform-wall",
      "rc-fusion360-parametric-fusion-interference-detection",
    ], ["fusion360-parametric"]),
    makeTask("dv-006", "dev", "positive_en", "en", "Verify connector mating sweep and component height keep-out inside enclosure", ["assembly.step"], false, [
      "rc-ecad-mcad-fit-connector-mating-sweep",
      "rc-ecad-mcad-fit-component-height-envelope",
    ], ["ecad-mcad-fit"]),
    makeTask("dv-007", "dev", "positive_en", "en", "Plan Fusion 360 additive 3D print orientation and clearance coupon fit", ["bracket.stl"], false, [
      "rc-fusion360-cam-fusion-additive-orientation",
      "rc-fusion360-cam-fusion-3d-print-fit",
    ], ["fusion360-cam"]),
    makeTask("dv-008", "dev", "positive_en", "en", "Validate two-plane rotor balancing coupling matrix conditioning", [], false, [
      "rc-rotor-mass-balance-two-plane-coupling",
      "rc-rotor-mass-balance-influence-matrix-conditioning",
    ], ["rotor-mass-balance"]),
    makeTask("dv-009", "dev", "positive_en", "en", "Diagnose envelope bearing vibration defects and tachometer dropout", [], false, [
      "rc-machine-vibration-envelope-bearing-features",
      "rc-machine-vibration-tachometer-dropout",
    ], ["machine-vibration"]),
    makeTask("dv-010", "dev", "positive_en", "en", "Verify synchronous multi-channel ADC sampling phase and channel skew compensation", [], false, [
      "rc-sensor-acquisition-synchronous-sampling-phase",
      "rc-sensor-acquisition-channel-skew-compensation",
    ], ["sensor-acquisition"]),
    makeTask("dv-011", "dev", "positive_en", "en", "Compute GNSS pseudorange residuals and RTCM differential correction latency", [], false, [
      "rc-gnss-measurement-pseudorange-residuals",
      "rc-gnss-measurement-rtcm-correction-latency",
    ], ["gnss-measurement"]),
    makeTask("dv-012", "dev", "positive_en", "en", "Design RTOS brownout recovery state and watchdog supervision tree", [], false, [
      "rc-embedded-rtos-brownout-recovery-state",
      "rc-embedded-rtos-watchdog-supervision-tree",
    ], ["embedded-rtos"]),
    makeTask("dv-013", "dev", "positive_en", "en", "Verify OTA firmware image cryptographic signature and power loss injection recovery", [], false, [
      "rc-firmware-ota-image-signature-verification",
      "rc-firmware-ota-power-loss-injection",
    ], ["firmware-ota"]),
    makeTask("dv-014", "dev", "positive_en", "en", "Investigate decompiler pointer types and indirect call targets in firmware ELF", ["fw.elf"], false, [
      "rc-binary-forensics-decompiler-type-repair",
      "rc-binary-forensics-indirect-call-targets",
      "rei-native-binaries",
    ], ["binary-forensics", "reverse-engineering"]),
    makeTask("dv-015", "dev", "positive_en", "en", "Trace BLE sensor pairing downgrade defense and bonding key lifecycle", [], false, [
      "rc-ble-sensor-nodes-pairing-downgrade-defense",
      "rc-ble-sensor-nodes-bonding-key-lifecycle",
    ], ["ble-sensor-nodes"]),
    makeTask("dv-016", "dev", "positive_en", "en", "Characterize cellular gateway RSRP SINR signal quality and TLS session resumption", [], false, [
      "rc-cellular-gateway-signal-quality-rsrp-sinr",
      "rc-cellular-gateway-tls-session-resumption",
    ], ["cellular-gateway"]),
    makeTask("dv-017", "dev", "positive_en", "en", "Reassemble multipart JT808 protocol packets and handle 16-bit sequence wraparound", [], false, [
      "rc-jt808-protocol-multipart-assembly",
      "rc-jt808-protocol-sequence-wraparound",
    ], ["jt808-protocol"]),
    makeTask("dv-018", "dev", "positive_en", "en", "Inspect industrial Ethernet PoE load budget and VLAN management isolation", [], false, [
      "rc-industrial-ethernet-poe-load-budget",
      "rc-industrial-ethernet-vlan-isolation-review",
    ], ["industrial-ethernet"]),
    makeTask("dv-019", "dev", "positive_en", "en", "Verify IoT diagnostic debug port lockdown and secure boot measurement", [], false, [
      "rc-iot-device-security-diagnostic-port-lockdown",
      "rc-iot-device-security-secure-boot-measurement",
    ], ["iot-device-security"]),
    makeTask("dv-020", "dev", "positive_en", "en", "Map PCB near-field radiated emissions and Ethernet magnetics isolation layout", [], false, [
      "rc-electromagnetic-compat-radiated-near-field-map",
      "rc-electromagnetic-compat-ethernet-magnetics-layout",
    ], ["electromagnetic-compat"]),
    makeTask("dv-021", "dev", "positive_en", "en", "Audit PCB copper pour isolation, decoupling loop inductance, and thermal via paths", [], false, [
      "rc-pcb-design-review-copper-pour-isolation",
      "rc-pcb-design-review-decoupling-loop-inductance",
      "rc-pcb-design-review-thermal-via-path",
    ], ["pcb-design-review"]),
    makeTask("dv-022", "dev", "positive_en", "en", "Verify HIL relay output interlock and sensor timing skew under fault injection", [], false, [
      "rc-hardware-in-loop-relay-output-interlock",
      "rc-hardware-in-loop-sensor-timing-skew",
    ], ["hardware-in-loop"]),
    makeTask("dv-023", "dev", "positive_en", "en", "Validate fleet telematics harsh braking detection and fuel level smoothing", [], false, [
      "rc-fleet-telematics-harsh-braking-validation",
      "rc-fleet-telematics-fuel-level-smoothing",
    ], ["fleet-telematics"]),
    makeTask("dv-024", "dev", "positive_en", "en", "Trace raw-to-derived timeseries telemetry lineage and query latency budget", [], false, [
      "rc-timeseries-telemetry-raw-to-derived-lineage",
      "rc-timeseries-telemetry-query-latency-budget",
    ], ["timeseries-telemetry"]),
    makeTask("dv-025", "dev", "positive_en", "en", "Validate Kafka topic schema registry migration and partition key hot-spot distribution", [], false, [
      "rc-event-streaming-schema-registry-migration",
      "rc-event-streaming-partition-key-selection",
    ], ["event-streaming"]),
    makeTask("dv-026", "dev", "positive_en", "en", "Audit Rust tokio cancellation safety and serde fuzz corpus bounds", ["Cargo.toml"], false, [
      "rc-rust-protocols-tokio-cancellation-safety",
      "rc-rust-protocols-serde-fuzz-corpus",
    ], ["rust-protocols"]),
    makeTask("dv-027", "dev", "positive_en", "en", "Verify edge ML training-to-device feature pipeline parity and concept drift alerts", [], false, [
      "rc-edge-machine-learning-feature-pipeline-parity",
      "rc-edge-machine-learning-concept-drift-alerting",
    ], ["edge-machine-learning"]),
    makeTask("dv-028", "dev", "positive_en", "en", "Check finite-difference gradient verification and stochastic seed variance in solver", [], false, [
      "rc-optimization-experiments-gradient-finite-difference",
      "rc-optimization-experiments-stochastic-seed-variance",
    ], ["optimization-experiments"]),
    makeTask("dv-029", "dev", "positive_en", "en", "Prevent train-test preprocessing leakage and build replication package layout", [], false, [
      "rc-reproducible-research-preprocessing-leakage-review",
      "rc-reproducible-research-replication-package-layout",
    ], ["reproducible-research"]),
    makeTask("dv-030", "dev", "positive_en", "en", "Verify emergency stop hardware interlock precedence and safe state transitions", [], false, [
      "rc-safety-assurance-emergency-stop-interface",
      "rc-safety-assurance-safe-state-definition",
    ], ["safety-assurance"]),
    makeTask("dv-031", "dev", "positive_en", "en", "Design plastic enclosure snap-fit strain and injection mold draft angle review", [], false, [
      "rc-cad-3d-assembly-plastic-snap-fit-risk",
      "rc-cad-3d-assembly-injection-mold-draft",
    ], ["cad-3d-assembly"]),
    makeTask("dv-032", "dev", "positive_en", "en", "Align simulated SPICE circuit node waveforms with oscilloscope bench measurements", [], false, [
      "rc-circuit-simulation-simulation-to-bench-parity",
      "rc-circuit-simulation-spice-monte-carlo",
    ], ["circuit-simulation"]),
    makeTask("dv-033", "dev", "positive_en", "en", "Implement distributed saga orchestration and architecture decision records", [], false, [
      "saga-orchestration",
      "architecture-decision-records",
    ], ["architecture"]),
    makeTask("dv-034", "dev", "positive_en", "en", "Build embedding retrieval strategy and vector database index", [], false, [
      "embedding-strategies",
      "vector-database-engineer",
    ], ["data-ai"]),
    makeTask("dv-035", "dev", "positive_en", "en", "Configure Prometheus metrics and Grafana monitoring dashboards", [], false, [
      "prometheus-configuration",
      "grafana-dashboards",
      "observability-engineer",
    ], ["infrastructure"]),
    makeTask("dv-036", "dev", "positive_en", "en", "Design mobile field app barcode scan deduplication and encrypted local storage", [], false, [
      "rc-mobile-field-ops-barcode-scan-dedup",
      "rc-mobile-field-ops-device-storage-encryption",
    ], ["mobile-field-ops"]),
    makeTask("dv-037", "dev", "positive_tr", "tr", "Dört kanallı senkron ADC örnekleme ve anti-alias filtre tasarımı", [], false, [
      "rc-sensor-acquisition-synchronous-sampling-phase",
      "rc-sensor-acquisition-anti-alias-filter-choice",
      "rc-circuit-architecture-adc-reference-network",
    ], ["sensor-acquisition", "circuit-architecture"]),
    makeTask("dv-038", "dev", "positive_tr", "tr", "İki düzlemli rotor dengeleme kuplaj matrisi ve etki katsayısı doğrulama", [], false, [
      "rc-rotor-mass-balance-two-plane-coupling",
      "rc-rotor-mass-balance-influence-matrix-conditioning",
    ], ["rotor-mass-balance"]),
    makeTask("dv-039", "dev", "positive_tr", "tr", "Fusion 360 API ile kullanıcı parametre birimleri ve STEP ihracatı", ["case.f3d"], false, [
      "rc-fusion360-api-fusion-api-parameter-units",
      "rc-fusion360-api-fusion-api-export-step",
    ], ["fusion360-api"]),
    makeTask("dv-040", "dev", "positive_tr", "tr", "KiCad Gerber üretim dosyaları ve kart yığın kalınlık doğrulaması", ["pcb.kicad_pcb"], false, [
      "rc-kicad-ecad-kicad-gerber-drill-package",
      "rc-kicad-ecad-kicad-board-stackup",
    ], ["kicad-ecad"]),
    makeTask("dv-041", "dev", "positive_tr", "tr", "Gömülü sistem OTA güncelleme güç kesintisi ve imzalı imaj doğrulama", [], false, [
      "rc-firmware-ota-power-loss-injection",
      "rc-firmware-ota-image-signature-verification",
    ], ["firmware-ota"]),
    makeTask("dv-042", "dev", "positive_tr", "tr", "Tersine mühendislik ikili dosya fark analizi ve SHA-256 kanıt defteri", ["v1.wasm", "v2.wasm"], false, [
      "rei-binary-intelligence",
      "rei-evidence-ledger",
      "rei-casebook-forensics",
    ], ["reverse-engineering"]),
    makeTask("dv-043", "dev", "positive_tr", "tr", "IoT cihazı karşılıklı TLS el sıkışma ve kimlik doğrulama güvenliği", [], false, [
      "rc-iot-device-security-mutual-tls-handshake-audit",
      "rc-iot-device-security-device-identity-provisioning",
    ], ["iot-device-security"]),
    makeTask("dv-044", "dev", "positive_tr", "tr", "Filo telematik araç hız uyarısı histerezis ve çevrimdışı tampon sıralama", [], false, [
      "rc-fleet-telematics-speed-alert-hysteresis",
      "rc-fleet-telematics-offline-buffer-ordering",
    ], ["fleet-telematics"]),
    makeTask("dv-045", "dev", "multilingual_mixed", "mixed", "CNC freze 3 eksen takım yolu simülasyonu ve G-code postprocess kontrolü", [], false, [
      "rc-fusion360-cam-fusion-cam-3axis-finish",
      "rc-fusion360-cam-fusion-cam-postprocess-review",
      "rc-fusion360-cam-fusion-cam-toolpath-verify",
    ], ["fusion360-cam"]),
    makeTask("dv-046", "dev", "multilingual_mixed", "mixed", "PCB ile Fusion 360 su geçirmez conta O-ring ve konnektör boşluk analizi", ["board.step"], false, [
      "rc-ecad-mcad-fit-waterproof-gasket-stack",
      "rc-cad-3d-assembly-o-ring-groove-design",
    ], ["ecad-mcad-fit", "cad-3d-assembly"]),
    makeTask("dv-047", "dev", "multilingual_mixed", "mixed", "Docker container dağıtımı ve Terraform altyapı planı", ["Dockerfile", "main.tf"], false, [
      "docker-expert",
      "terraform-specialist",
      "deployment-procedures",
    ], ["infrastructure"]),
    makeTask("dv-048", "dev", "multilingual_mixed", "mixed", "TypeScript ve React frontend bileşen mimarisi ve test otomasyonu", ["Panel.tsx"], false, [
      "typescript-pro",
      "react-patterns",
      "frontend-developer",
    ], ["development"]),
    makeTask("dv-049", "dev", "ambiguous_multi_domain", "en", "Design a CNC-milled aluminium vibration sensor fixture with tolerance drawings", [], false, [
      "rc-fusion360-cam-fusion-cam-setup-wcs",
      "rc-cad-3d-assembly-drawing-release-inspection",
      "rc-ecad-mcad-fit-sensor-mount-orientation",
    ], ["fusion360-cam", "cad-3d-assembly", "ecad-mcad-fit"]),
    makeTask("dv-050", "dev", "ambiguous_multi_domain", "en", "Build a high-reliability CAN telemetry logger with hardware-in-loop and safety gate", [], false, [
      "rc-circuit-architecture-can-transceiver-protection",
      "rc-hardware-in-loop-can-traffic-replay",
      "rc-safety-assurance-release-safety-gate",
    ], ["circuit-architecture", "hardware-in-loop", "safety-assurance"]),
    makeTask("dv-051", "dev", "ambiguous_multi_domain", "en", "Reverse engineer mobile companion app and BLE telemetry protocol captures", ["app.apk", "ble.pcap"], false, [
      "rei-android-apks",
      "rei-web-and-protocols",
      "rc-ble-sensor-nodes-sensor-payload-crc",
    ], ["reverse-engineering", "ble-sensor-nodes"]),
    makeTask("dv-052", "dev", "safety_critical_filter", "en", "Evaluate CAD assembly tolerances and Fusion 360 STL export settings safely", ["part.f3d"], true, [
      "rc-cad-3d-assembly-tolerance-stack-up",
      "rc-fusion360-api-fusion-api-export-stl",
    ], ["cad-3d-assembly", "fusion360-api"]),
    makeTask("dv-053", "dev", "safety_critical_filter", "en", "Analyze Android APK manifest and Electron ASAR IPC routes safely read-only", ["app.apk", "app.asar"], true, [
      "rei-android-apks",
      "rei-electron-and-js",
    ], ["reverse-engineering"]),
    makeTask("dv-054", "dev", "safety_critical_filter", "en", "Verify database schema design and event outbox atomicity without unsafe cluster commands", [], true, [
      "database-design",
      "rc-event-streaming-event-outbox-atomicity",
    ], ["data-ai", "event-streaming"]),
    makeTask("dv-055", "dev", "safety_critical_filter", "en", "Run Python testing patterns and systematic debugging on failing unit suite", ["test_app.py"], true, [
      "python-testing-patterns",
      "systematic-debugging",
    ], ["testing"]),
    makeTask("dv-056", "dev", "safety_critical_filter", "tr", "Salt okunur modda SPICE filtre transfer fonksiyonu ve Monte Carlo analizi yap", [], true, [
      "rc-circuit-simulation-filter-transfer-verification",
      "rc-circuit-simulation-spice-monte-carlo",
    ], ["circuit-simulation"]),
    makeTask("dv-057", "dev", "negative_out_of_scope", "en", "Recommend top jazz albums from the 1960s to listen to while driving", [], false, [], []),
    makeTask("dv-058", "dev", "negative_out_of_scope", "en", "How do I renew a tourist passport and apply for a Schengen visa", [], false, [], []),
    makeTask("dv-059", "dev", "negative_out_of_scope", "tr", "İstanbul boğazında sabah koşusu için en güzel parkurlar hangileri", [], false, [], []),
    makeTask("dv-060", "dev", "negative_out_of_scope", "en", "What is the best watering schedule for indoor monstera plants", [], false, [], []),

    // =========================================================================
    // HELD-OUT EVAL SPLIT (120 tasks)
    // =========================================================================
    makeTask("ev-001", "eval", "ambiguous_multi_domain", "en", "Design a four-channel vibration measurement PCB and its Fusion 360 enclosure", [], false, [
      "rc-sensor-acquisition-accelerometer-sensitivity",
      "rc-circuit-architecture-adc-reference-network",
      "rc-kicad-ecad-kicad-ecad-release-gate",
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-fusion360-parametric-fusion-design-parameter-table",
    ], ["sensor-acquisition", "circuit-architecture", "kicad-ecad", "ecad-mcad-fit", "fusion360-parametric"]),
    makeTask("ev-002", "eval", "positive_en", "en", "Bound op-amp input bias current and sensor source impedance in analog front-end", [], false, [
      "rc-circuit-architecture-analog-front-end-bias",
      "rc-circuit-architecture-sensor-bridge-conditioning",
    ], ["circuit-architecture"]),
    makeTask("ev-003", "eval", "positive_en", "en", "Compare ideal MOSFET vs diode reverse polarity protection and boost startup inrush", [], false, [
      "rc-circuit-architecture-reverse-polarity-protection",
      "rc-circuit-architecture-boost-startup-sequencing",
    ], ["circuit-architecture"]),
    makeTask("ev-004", "eval", "positive_en", "en", "Run SPICE small-signal AC Bode plot and integrated noise budget simulation", [], false, [
      "rc-circuit-simulation-spice-small-signal-ac",
      "rc-circuit-simulation-spice-noise-budget",
      "rc-circuit-simulation-filter-transfer-verification",
    ], ["circuit-simulation"]),
    makeTask("ev-005", "eval", "positive_en", "en", "Run worst-case corner sweep across supply voltage and junction temperature in SPICE", [], false, [
      "rc-circuit-simulation-worst-case-corner-sweep",
      "rc-circuit-simulation-thermal-electrical-iterate",
    ], ["circuit-simulation"]),
    makeTask("ev-006", "eval", "positive_en", "en", "Verify KiCad netclass clearance rules, copper zone return paths, and BOM DNI variants", ["board.kicad_pcb"], false, [
      "rc-kicad-ecad-kicad-netclass-routing",
      "rc-kicad-ecad-kicad-zone-return-paths",
      "rc-kicad-ecad-kicad-bom-variant",
    ], ["kicad-ecad"]),
    makeTask("ev-007", "eval", "positive_en", "en", "Export KiCad board STEP 3D model and verify symbol 3D model footprint links", ["board.kicad_pcb"], false, [
      "rc-kicad-ecad-kicad-step-export",
      "rc-kicad-ecad-kicad-3d-model-links",
    ], ["kicad-ecad"]),
    makeTask("ev-008", "eval", "positive_en", "en", "Verify schematic pin-to-pad net parity, pick-and-place origins, and Gerber layers", [], false, [
      "rc-pcb-design-review-schematic-pcb-net-parity",
      "rc-kicad-ecad-kicad-pickplace-origins",
      "rc-pcb-design-review-gerber-drill-review",
    ], ["pcb-design-review", "kicad-ecad"]),
    makeTask("ev-009", "eval", "positive_en", "en", "Check PCB creepage clearance spacing and mounting hole chassis standoff tolerances", [], false, [
      "rc-pcb-design-review-creepage-clearance-review",
      "rc-pcb-design-review-mounting-hole-clearance",
    ], ["pcb-design-review"]),
    makeTask("ev-010", "eval", "positive_en", "en", "Audit Fusion 360 sketch constraint degrees of freedom and origin reference geometry", ["housing.f3d"], false, [
      "rc-fusion360-parametric-fusion-sketch-constraint-audit",
      "rc-fusion360-parametric-fusion-reference-geometry",
    ], ["fusion360-parametric"]),
    makeTask("ev-011", "eval", "positive_en", "en", "Create Fusion 360 sheet metal flat pattern bend layout and configured dimensional variants", ["bracket.f3d"], false, [
      "rc-fusion360-parametric-fusion-sheet-metal-flat",
      "rc-fusion360-parametric-fusion-configured-variants",
    ], ["fusion360-parametric"]),
    makeTask("ev-012", "eval", "positive_en", "en", "Traverse Fusion 360 component occurrences and feature timeline without breaking parameters", [], false, [
      "rc-fusion360-api-fusion-api-component-occurrence",
      "rc-fusion360-api-fusion-api-feature-timeline",
      "rc-fusion360-api-fusion-api-user-parameters",
    ], ["fusion360-api"]),
    makeTask("ev-013", "eval", "positive_en", "en", "Verify Fusion 360 add-in lifecycle cleanup and batch export safety gates", [], false, [
      "rc-fusion360-api-fusion-api-addin-lifecycle",
      "rc-fusion360-api-fusion-api-batch-safety",
    ], ["fusion360-api"]),
    makeTask("ev-014", "eval", "positive_en", "en", "Inspect CNC work coordinate origin WCS, fixture collision clearances, and tool library", [], false, [
      "rc-fusion360-cam-fusion-cam-setup-wcs",
      "rc-fusion360-cam-fusion-cam-fixture-clearance",
      "rc-fusion360-cam-fusion-cam-tool-library",
    ], ["fusion360-cam"]),
    makeTask("ev-015", "eval", "positive_en", "en", "Prepare additive 3D printing slicing check and part layer anisotropy orientation", ["enclosure.stl"], false, [
      "rc-fusion360-cam-fusion-additive-slicing",
      "rc-cad-3d-assembly-printed-part-anisotropy",
    ], ["fusion360-cam", "cad-3d-assembly"]),
    makeTask("ev-016", "eval", "positive_en", "en", "Establish GD&T datum reference frame, bearing housing fits, and fastener boss geometry", [], false, [
      "rc-cad-3d-assembly-gdandt-datum-selection",
      "rc-cad-3d-assembly-bearing-housing-tolerance",
      "rc-cad-3d-assembly-fastener-boss-placement",
    ], ["cad-3d-assembly"]),
    makeTask("ev-017", "eval", "positive_en", "en", "Check mechanical thermal expansion clearance and assembly BOM structure consistency", [], false, [
      "rc-cad-3d-assembly-mechanical-thermal-expansion",
      "rc-cad-3d-assembly-assembly-bom-structure",
    ], ["cad-3d-assembly"]),
    makeTask("ev-018", "eval", "positive_en", "en", "Synchronize 2D PCB outline with mechanical enclosure cavity and verify board thickness", ["board.step"], false, [
      "rc-ecad-mcad-fit-board-outline-synchronization",
      "rc-ecad-mcad-fit-board-thickness-allowance",
    ], ["ecad-mcad-fit"]),
    makeTask("ev-019", "eval", "positive_en", "en", "Analyze thermal heat dissipation path from power regulator PCB to aluminum chassis", [], false, [
      "rc-ecad-mcad-fit-thermal-enclosure-coupling",
      "rc-pcb-design-review-thermal-via-path",
    ], ["ecad-mcad-fit", "pcb-design-review"]),
    makeTask("ev-020", "eval", "positive_en", "en", "Validate antenna RF keep-out clearance and CAD roundtrip STEP/STL unit conversion", [], false, [
      "rc-ecad-mcad-fit-antenna-rf-keepout",
      "rc-ecad-mcad-fit-cad-format-roundtrip",
    ], ["ecad-mcad-fit"]),
    makeTask("ev-021", "eval", "positive_en", "en", "Check cross-channel phase coherence and order-tracked vibration spectrum across changing RPM", [], false, [
      "rc-machine-vibration-phase-coherence-review",
      "rc-machine-vibration-order-tracked-spectrum",
    ], ["machine-vibration"]),
    makeTask("ev-022", "eval", "positive_en", "en", "Verify anti-alias Nyquist sampling margin and waveform impact clipping vs transient shocks", [], false, [
      "rc-machine-vibration-sampling-alias-bound",
      "rc-machine-vibration-waveform-impact-events",
    ], ["machine-vibration"]),
    makeTask("ev-023", "eval", "positive_en", "en", "Validate rotor ISO balance quality grade G2.5 and discrete blade correction constraints", [], false, [
      "rc-rotor-mass-balance-balance-quality-grade",
      "rc-rotor-mass-balance-correction-location-constraints",
    ], ["rotor-mass-balance"]),
    makeTask("ev-024", "eval", "positive_en", "en", "Verify keyphasor angle polarity and residual 1X unbalance acceptance check", [], false, [
      "rc-rotor-mass-balance-angle-reference-polarity",
      "rc-rotor-mass-balance-residual-unbalance-check",
    ], ["rotor-mass-balance"]),
    makeTask("ev-025", "eval", "positive_en", "en", "Characterize sensor noise floor PSD, reference voltage drift, and transducer open-wire fault", [], false, [
      "rc-sensor-acquisition-noise-floor-characterization",
      "rc-sensor-acquisition-reference-voltage-drift",
      "rc-sensor-acquisition-transducer-open-wire",
    ], ["sensor-acquisition"]),
    makeTask("ev-026", "eval", "positive_en", "en", "Verify oversampling decimation filter gain and bridge strain-gauge conditioning", [], false, [
      "rc-sensor-acquisition-oversampling-decimation",
      "rc-sensor-acquisition-bridge-sensor-conditioning",
    ], ["sensor-acquisition"]),
    makeTask("ev-027", "eval", "positive_en", "en", "Convert multi-constellation GPS Galileo BeiDou time and import RINEX observation files", [], false, [
      "rc-gnss-measurement-multi-constellation-time",
      "rc-gnss-measurement-rinex-observation-import",
    ], ["gnss-measurement"]),
    makeTask("ev-028", "eval", "positive_en", "en", "Check GNSS float vs fixed carrier ambiguity status and antenna phase center lever arm", [], false, [
      "rc-gnss-measurement-cycle-ambiguity-status",
      "rc-gnss-measurement-antenna-phase-center",
    ], ["gnss-measurement"]),
    makeTask("ev-029", "eval", "positive_en", "en", "Profile RTOS WCET hard deadline scheduling budget and mutex deadlock acquisition order", [], false, [
      "rc-embedded-rtos-wcet-scheduling-budget",
      "rc-embedded-rtos-mutex-deadlock-triage",
    ], ["embedded-rtos"]),
    makeTask("ev-030", "eval", "positive_en", "en", "Verify dynamic clock domain transition baud rates and tickless idle sleep timers", [], false, [
      "rc-embedded-rtos-clock-domain-transition",
      "rc-embedded-rtos-rtos-tickless-idle",
    ], ["embedded-rtos"]),
    makeTask("ev-031", "eval", "positive_en", "en", "Verify delta OTA firmware hash reconstruction and fleet canary rollout stop conditions", [], false, [
      "rc-firmware-ota-delta-update-integrity",
      "rc-firmware-ota-fleet-rollout-canary",
    ], ["firmware-ota"]),
    makeTask("ev-032", "eval", "positive_en", "en", "Calculate flash wear erase cycle budget and encrypted OTA key rotation plan", [], false, [
      "rc-firmware-ota-flash-wear-budgeting",
      "rc-firmware-ota-secure-key-rotation",
    ], ["firmware-ota"]),
    makeTask("ev-033", "eval", "positive_en", "en", "Recover binary protocol frame parser and checksum CRC polynomial from firmware", ["modem.bin"], false, [
      "rc-binary-forensics-protocol-frame-recovery",
      "rc-binary-forensics-checksum-routine-identify",
    ], ["binary-forensics"]),
    makeTask("ev-034", "eval", "positive_en", "en", "Compare binary firmware versions while separating compiler noise from code changes", ["fw_v1.elf", "fw_v2.elf"], false, [
      "rc-binary-forensics-binary-diff-provenance",
      "rei-binary-intelligence",
      "rei-reconstruction-parity",
    ], ["binary-forensics", "reverse-engineering"]),
    makeTask("ev-035", "eval", "positive_en", "en", "Investigate suspicious PE/Mach-O executable imports and build forensic casebook", ["target.exe"], false, [
      "rei-native-binaries",
      "rei-casebook-forensics",
      "rei-evidence-ledger",
    ], ["reverse-engineering"]),
    makeTask("ev-036", "eval", "positive_en", "en", "Audit WebAssembly custom sections and .NET/JVM managed bytecode types", ["module.wasm"], false, [
      "rei-wasm-and-managed",
      "rei-binary-intelligence",
    ], ["reverse-engineering"]),
    makeTask("ev-037", "eval", "positive_en", "en", "Examine Android APK native JNI calls and plan isolated Frida runtime inspection", ["app.apk"], false, [
      "rei-android-apks",
      "rei-mobile-runtime",
    ], ["reverse-engineering"]),
    makeTask("ev-038", "eval", "positive_en", "en", "Inspect Electron desktop app preload bridge and HAR/PCAP network frame captures", ["app.asar", "trace.har"], false, [
      "rei-electron-and-js",
      "rei-web-and-protocols",
    ], ["reverse-engineering"]),
    makeTask("ev-039", "eval", "positive_en", "en", "Balance BLE advertisement payload size and connection interval power consumption", [], false, [
      "rc-ble-sensor-nodes-advertisement-payload-budget",
      "rc-ble-sensor-nodes-connection-interval-power",
    ], ["ble-sensor-nodes"]),
    makeTask("ev-040", "eval", "positive_en", "en", "Handle BLE disconnect state recovery and notification backpressure under subscriber stall", [], false, [
      "rc-ble-sensor-nodes-disconnect-state-recovery",
      "rc-ble-sensor-nodes-notification-backpressure",
    ], ["ble-sensor-nodes"]),
    makeTask("ev-041", "eval", "positive_en", "en", "Bound cellular modem reconnect backoff jitter and characterize TX current burst", [], false, [
      "rc-cellular-gateway-reconnect-backoff-budget",
      "rc-cellular-gateway-cellular-power-burst",
    ], ["cellular-gateway"]),
    makeTask("ev-042", "eval", "positive_en", "en", "Handle cellular SIM failover credential isolation and APN roaming profile validation", [], false, [
      "rc-cellular-gateway-sim-failover-isolation",
      "rc-cellular-gateway-apn-profile-selection",
    ], ["cellular-gateway"]),
    makeTask("ev-043", "eval", "positive_en", "en", "Reconstruct split TCP JT808 protocol frame boundaries and fuzz malformed length flags", [], false, [
      "rc-jt808-protocol-packet-boundary-recovery",
      "rc-jt808-protocol-frame-fuzz-negative-cases",
    ], ["jt808-protocol"]),
    makeTask("ev-044", "eval", "positive_en", "en", "Correlate JT808 command ACKs and preserve terminal authentication session across reconnect", [], false, [
      "rc-jt808-protocol-command-ack-correlation",
      "rc-jt808-protocol-reconnect-session-state",
    ], ["jt808-protocol"]),
    makeTask("ev-045", "eval", "positive_en", "en", "Diagnose industrial Ethernet TSN scheduled traffic windows and PHY cable pair faults", [], false, [
      "rc-industrial-ethernet-time-sensitive-networking",
      "rc-industrial-ethernet-cable-pair-faults",
    ], ["industrial-ethernet"]),
    makeTask("ev-046", "eval", "positive_en", "en", "Detect spanning tree miswired loops and switch microburst buffer tail drop", [], false, [
      "rc-industrial-ethernet-spanning-tree-loop-guard",
      "rc-industrial-ethernet-switch-buffer-tail-drop",
    ], ["industrial-ethernet"]),
    makeTask("ev-047", "eval", "positive_en", "en", "Enforce IoT cloud policy least privilege and protocol nonce replay protection", [], false, [
      "rc-iot-device-security-cloud-policy-least-privilege",
      "rc-iot-device-security-protocol-replay-protection",
    ], ["iot-device-security"]),
    makeTask("ev-048", "eval", "positive_en", "en", "Rotate compromised IoT device keys and verify factory reset revokes stored secrets", [], false, [
      "rc-iot-device-security-incident-key-containment",
      "rc-iot-device-security-factory-reset-secrets",
    ], ["iot-device-security"]),
    makeTask("ev-049", "eval", "positive_en", "en", "Check cable harness radiated emission resonance and chassis shield termination", [], false, [
      "rc-electromagnetic-compat-cable-harness-resonance",
      "rc-electromagnetic-compat-shield-termination-study",
    ], ["electromagnetic-compat"]),
    makeTask("ev-050", "eval", "positive_en", "en", "Test clock slew-rate emission reduction and filter insertion loss impedance matching", [], false, [
      "rc-electromagnetic-compat-clock-edge-noise-reduction",
      "rc-electromagnetic-compat-filter-insertion-loss",
    ], ["electromagnetic-compat"]),
    makeTask("ev-051", "eval", "positive_en", "en", "Validate HIL brownout supply droop reset sequence and UART noisy frame recovery", [], false, [
      "rc-hardware-in-loop-brownout-edge-sequences",
      "rc-hardware-in-loop-uart-frame-loss",
    ], ["hardware-in-loop"]),
    makeTask("ev-052", "eval", "positive_en", "en", "Test HIL GPIO startup glitch state and watchdog hang fail-safe recovery", [], false, [
      "rc-hardware-in-loop-gpio-startup-glitch",
      "rc-hardware-in-loop-watchdog-hang-recovery",
    ], ["hardware-in-loop"]),
    makeTask("ev-053", "eval", "positive_en", "en", "Separate stationary engine idling from traffic stops and reconcile engine hours", [], false, [
      "rc-fleet-telematics-idle-time-estimation",
      "rc-fleet-telematics-engine-hours-consistency",
    ], ["fleet-telematics"]),
    makeTask("ev-054", "eval", "positive_en", "en", "Deduplicate fleet replay alerts and flag GPS track route gaps without inventing geometry", [], false, [
      "rc-fleet-telematics-fleet-alert-dedup",
      "rc-fleet-telematics-route-gap-reporting",
    ], ["fleet-telematics"]),
    makeTask("ev-055", "eval", "positive_en", "en", "Handle DST time-bucket boundaries and sparse zero-vs-missing timeseries telemetry", [], false, [
      "rc-timeseries-telemetry-time-bucket-boundary",
      "rc-timeseries-telemetry-sparse-series-display",
    ], ["timeseries-telemetry"]),
    makeTask("ev-056", "eval", "positive_en", "en", "Bound high-cardinality telemetry labels and replay continuous queries after outage", [], false, [
      "rc-timeseries-telemetry-high-cardinality-labels",
      "rc-timeseries-telemetry-continuous-query-replay",
    ], ["timeseries-telemetry"]),
    makeTask("ev-057", "eval", "positive_en", "en", "Preserve per-entity Kafka event ordering and handle consumer group rebalance checkpoints", [], false, [
      "rc-event-streaming-event-order-consistency",
      "rc-event-streaming-consumer-group-rebalance",
    ], ["event-streaming"]),
    makeTask("ev-058", "eval", "positive_en", "en", "Design idempotency keys and window aggregation with late event corrections", [], false, [
      "rc-event-streaming-idempotency-key-design",
      "rc-event-streaming-stream-window-aggregation",
    ], ["event-streaming"]),
    makeTask("ev-059", "eval", "positive_en", "en", "Audit Rust async lock ordering, zero-copy borrowed buffer lifetimes, and FFI ABI safety", ["lib.rs"], false, [
      "rc-rust-protocols-async-lock-order",
      "rc-rust-protocols-zero-copy-lifetime-audit",
      "rc-rust-protocols-rust-ffi-message-boundary",
    ], ["rust-protocols"]),
    makeTask("ev-060", "eval", "positive_en", "en", "Profile Rust tail latency p95/p99 and implement graceful shutdown connection draining", ["Cargo.toml"], false, [
      "rc-rust-protocols-latency-tail-profiling",
      "rc-rust-protocols-graceful-shutdown-drain",
    ], ["rust-protocols"]),
    makeTask("ev-061", "eval", "positive_en", "en", "Fit edge anomaly model memory arena budget and run shadow inference rollout", [], false, [
      "rc-edge-machine-learning-model-memory-budget",
      "rc-edge-machine-learning-model-rollout-shadow",
    ], ["edge-machine-learning"]),
    makeTask("ev-062", "eval", "positive_en", "en", "Evaluate solver trust-region step acceptance and mixed-integer discrete feasibility", [], false, [
      "rc-optimization-experiments-trust-region-step",
      "rc-optimization-experiments-mixed-integer-rounding",
    ], ["optimization-experiments"]),
    makeTask("ev-063", "eval", "positive_en", "en", "Perform ablation baseline isolation and preserve negative experiment outcomes", [], false, [
      "rc-reproducible-research-ablation-baseline-design",
      "rc-reproducible-research-negative-result-reporting",
    ], ["reproducible-research"]),
    makeTask("ev-064", "eval", "positive_en", "en", "Build FMEA detection coverage matrix and hardware watchdog safety case", [], false, [
      "rc-safety-assurance-fmea-detection-coverage",
      "rc-safety-assurance-watchdog-safety-case",
    ], ["safety-assurance"]),
    makeTask("ev-065", "eval", "positive_en", "en", "Perform zero-downtime database schema migration and disaster backup restore drill", [], false, [
      "rc-cloud-service-ops-zero-downtime-schema",
      "rc-cloud-service-ops-disaster-restore-drill",
    ], ["cloud-service-ops"]),
    makeTask("ev-066", "eval", "positive_en", "en", "Verify mobile field app multilingual TR/EN label overflow and map GPS coordinate roundtrip", [], false, [
      "rc-mobile-field-ops-multilingual-label-overflow",
      "rc-mobile-field-ops-map-coordinate-roundtrip",
    ], ["mobile-field-ops"]),
    makeTask("ev-067", "eval", "positive_en", "en", "Design FastAPI async backend with OpenAPI contracts and PostgreSQL optimization", ["api.py", "schema.sql"], false, [
      "fastapi-pro",
      "openapi-spec-generation",
      "postgres-best-practices",
    ], ["development", "data-ai"]),
    makeTask("ev-068", "eval", "positive_en", "en", "Configure SAST pipeline security scanning and threat model attack trees", [], false, [
      "sast-configuration",
      "threat-modeling-expert",
      "attack-tree-construction",
    ], ["security"]),
    makeTask("ev-069", "eval", "positive_en", "en", "Build Node.js microservices backend API design and GraphQL schema architecture", [], false, [
      "nodejs-backend-patterns",
      "api-design-principles",
      "graphql-architect",
    ], ["development", "architecture"]),
    makeTask("ev-070", "eval", "positive_en", "en", "Run systematic root-cause debugging and verify bugfix before marking complete", [], false, [
      "systematic-debugging",
      "verification-before-completion",
    ], ["general", "testing"]),
    makeTask("ev-071", "eval", "positive_en", "en", "Design C4 architecture context diagrams and event-driven microservices patterns", [], false, [
      "c4-context",
      "microservices-patterns",
      "architecture",
    ], ["architecture"]),
    makeTask("ev-072", "eval", "positive_en", "en", "Set up Helm chart scaffolding and Kubernetes cloud-native cluster architecture", ["Chart.yaml"], false, [
      "helm-chart-scaffolding",
      "kubernetes-architect",
    ], ["infrastructure"]),

    // Turkish technical queries in held-out eval
    makeTask("ev-073", "eval", "positive_tr", "tr", "Dört kanallı titreşim ölçüm PCB kartı ve Fusion 360 muhafaza kutusu tasarla", [], false, [
      "rc-sensor-acquisition-accelerometer-sensitivity",
      "rc-circuit-architecture-adc-reference-network",
      "rc-kicad-ecad-kicad-ecad-release-gate",
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-fusion360-parametric-fusion-design-parameter-table",
    ], ["sensor-acquisition", "circuit-architecture", "kicad-ecad", "ecad-mcad-fit", "fusion360-parametric"]),
    makeTask("ev-074", "eval", "positive_tr", "tr", "Elektronik devre şematik çizimi ve RS485 hat sonlandırma TVS koruması", [], false, [
      "rc-circuit-architecture-rs485-bus-termination",
      "rc-circuit-architecture-esd-tvs-coordination",
    ], ["circuit-architecture"]),
    makeTask("ev-075", "eval", "positive_tr", "tr", "KiCad baskı devre yerleşimi ve şematik netlist eşitlik kontrolü", ["vibration.kicad_pcb"], false, [
      "rc-pcb-design-review-schematic-pcb-net-parity",
      "rc-kicad-ecad-kicad-drc-ci",
    ], ["pcb-design-review", "kicad-ecad"]),
    makeTask("ev-076", "eval", "positive_tr", "tr", "Fusion 360 parametrik kutu duvar kalınlığı ve çakışma girişim kontrolü", ["kutu.f3d"], false, [
      "rc-fusion360-parametric-fusion-shell-uniform-wall",
      "rc-fusion360-parametric-fusion-interference-detection",
    ], ["fusion360-parametric"]),
    makeTask("ev-077", "eval", "positive_tr", "tr", "3D baskı yönlendirme ve mekanik parça katman anizotropisi incelemesi", ["kapak.stl"], false, [
      "rc-fusion360-cam-fusion-additive-orientation",
      "rc-cad-3d-assembly-printed-part-anisotropy",
    ], ["fusion360-cam", "cad-3d-assembly"]),
    makeTask("ev-078", "eval", "positive_tr", "tr", "Rotor kütle balanslama açı referans yönü ve kalan dengesizlik kontrolü", [], false, [
      "rc-rotor-mass-balance-angle-reference-polarity",
      "rc-rotor-mass-balance-residual-unbalance-check",
    ], ["rotor-mass-balance"]),
    makeTask("ev-079", "eval", "positive_tr", "tr", "İvmeölçer sensör kalibrasyon zinciri ve FFT pencere sızıntısı hesabı", [], false, [
      "rc-machine-vibration-sensor-calibration-chain",
      "rc-machine-vibration-fft-window-leakage",
    ], ["machine-vibration"]),
    makeTask("ev-080", "eval", "positive_tr", "tr", "GNSS NMEA cümle doğrulama ve uydu yörünge efemeris yaş süzgeci", [], false, [
      "rc-gnss-measurement-nmea-talker-validation",
      "rc-gnss-measurement-ephemeris-age-screening",
    ], ["gnss-measurement"]),
    makeTask("ev-081", "eval", "positive_tr", "tr", "Gömülü yazılım A/B OTA bellek bölümü ve geri dönüş koruması", [], false, [
      "rc-firmware-ota-ab-slot-state-machine",
      "rc-firmware-ota-anti-rollback-versioning",
    ], ["firmware-ota"]),
    makeTask("ev-082", "eval", "positive_tr", "tr", "RTOS zamanlama bütçesi WCET ve bekçi köpeği watchdog kurtarma ağacı", [], false, [
      "rc-embedded-rtos-wcet-scheduling-budget",
      "rc-embedded-rtos-watchdog-supervision-tree",
    ], ["embedded-rtos"]),
    makeTask("ev-083", "eval", "positive_tr", "tr", "WebAssembly ikili modül tersine mühendislik ve temiz oda eşdeğerlik testi", ["dsp.wasm"], false, [
      "rei-wasm-and-managed",
      "rei-reconstruction-parity",
    ], ["reverse-engineering"]),
    makeTask("ev-084", "eval", "positive_tr", "tr", "Gömülü aygıt yazılımı bölüm haritası ve entropi analizi", ["dump.bin"], false, [
      "rei-firmware-and-iot",
      "rc-binary-forensics-firmware-partition-map",
    ], ["reverse-engineering", "binary-forensics"]),
    makeTask("ev-085", "eval", "positive_tr", "tr", "BLE sensör düğümü pil voltajı yorumlama ve bağlantı aralığı güç ölçümü", [], false, [
      "rc-ble-sensor-nodes-battery-voltage-interpretation",
      "rc-ble-sensor-nodes-connection-interval-power",
    ], ["ble-sensor-nodes"]),
    makeTask("ev-086", "eval", "positive_tr", "tr", "Hücresel IoT modem sinyal kalitesi RSRP SINR ve çevrimdışı kuyruk dayanıklılığı", [], false, [
      "rc-cellular-gateway-signal-quality-rsrp-sinr",
      "rc-cellular-gateway-offline-queue-durability",
    ], ["cellular-gateway"]),
    makeTask("ev-087", "eval", "positive_tr", "tr", "Endüstriyel Ethernet gPTP saat senkron hatası ve PoE güç bütçesi", [], false, [
      "rc-industrial-ethernet-ptp-clock-error",
      "rc-industrial-ethernet-poe-load-budget",
    ], ["industrial-ethernet"]),
    makeTask("ev-088", "eval", "positive_tr", "tr", "PCB elektromanyetik uyumluluk yakın alan taraması ve ESD deşarj yolu", [], false, [
      "rc-electromagnetic-compat-radiated-near-field-map",
      "rc-electromagnetic-compat-esd-discharge-path",
    ], ["electromagnetic-compat"]),
    makeTask("ev-089", "eval", "positive_tr", "tr", "Çok amaçlı optimizasyon Pareto sınırı ve kısıt fizibilite denetimi", [], false, [
      "rc-optimization-experiments-multiobjective-pareto-review",
      "rc-optimization-experiments-constraint-feasibility-audit",
    ], ["optimization-experiments"]),
    makeTask("ev-090", "eval", "positive_tr", "tr", "Acil durdurma güvenlik kilidi ve hata ağacı ayrıştırma analizi", [], false, [
      "rc-safety-assurance-emergency-stop-interface",
      "rc-safety-assurance-fault-tree-decomposition",
    ], ["safety-assurance"]),
    makeTask("ev-091", "eval", "positive_tr", "tr", "Mikroservis olay güdümlü mimari ve alan güdümlü tasarım DDD sınırları", [], false, [
      "domain-driven-design",
      "ddd-strategic-design",
      "microservices-patterns",
    ], ["architecture"]),
    makeTask("ev-092", "eval", "positive_tr", "tr", "Bulut servisi log gizliliği PII maskeleme ve sıfır kesintili şema geçişi", [], false, [
      "rc-cloud-service-ops-audit-log-redaction",
      "rc-cloud-service-ops-zero-downtime-schema",
    ], ["cloud-service-ops"]),

    // Multilingual mixed in held-out eval
    makeTask("ev-093", "eval", "multilingual_mixed", "mixed", "Fusion 360 ile PCB STEP montaj uyumu ve konnektör yönü doğrulama", ["board.step", "case.f3d"], false, [
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-ecad-mcad-fit-connector-mating-sweep",
    ], ["ecad-mcad-fit"]),
    makeTask("ev-094", "eval", "multilingual_mixed", "mixed", "SPICE simülasyonu ile osiloskop ölçüm dalga formu karşılaştırması", [], false, [
      "rc-circuit-simulation-simulation-to-bench-parity",
      "rc-circuit-simulation-spice-transient-startup",
    ], ["circuit-simulation"]),
    makeTask("ev-095", "eval", "multilingual_mixed", "mixed", "Android saha uygulaması çevrimdışı senkronizasyon ve barkod tekilleştirme", [], false, [
      "rc-mobile-field-ops-sync-resume-after-loss",
      "rc-mobile-field-ops-barcode-scan-dedup",
    ], ["mobile-field-ops"]),
    makeTask("ev-096", "eval", "multilingual_mixed", "mixed", "Zaman serisi telemetri geç gelen veri watermark ve sorgu gecikme bütçesi", [], false, [
      "rc-timeseries-telemetry-late-event-watermarks",
      "rc-timeseries-telemetry-query-latency-budget",
    ], ["timeseries-telemetry"]),
    makeTask("ev-097", "eval", "multilingual_mixed", "mixed", "Electron masaüstü uygulaması ASAR ve preload köprü güvenlik incelemesi", ["app.asar"], false, [
      "rei-electron-and-js",
      "rei-evidence-ledger",
    ], ["reverse-engineering"]),
    makeTask("ev-098", "eval", "multilingual_mixed", "mixed", "Rust protokol çerçeveleme codec sınırları ve yeniden bağlanma tekrar koruması", ["gateway.rs"], false, [
      "rc-rust-protocols-framed-codec-bounds",
      "rc-rust-protocols-reconnect-state-replay",
    ], ["rust-protocols"]),

    // Ambiguous multi-domain in held-out eval
    makeTask("ev-099", "eval", "ambiguous_multi_domain", "en", "Build a cellular GNSS vehicle tracker speaking JT808 with secure OTA rollback", [], false, [
      "rc-gnss-measurement-nmea-talker-validation",
      "rc-jt808-protocol-location-body-decode",
      "rc-cellular-gateway-gnss-cellular-coexistence",
      "rc-firmware-ota-ab-slot-state-machine",
    ], ["gnss-measurement", "jt808-protocol", "cellular-gateway", "firmware-ota"]),
    makeTask("ev-100", "eval", "ambiguous_multi_domain", "en", "Diagnose motor bearing vibration spikes, balance rotor, and verify tachometer pulses", [], false, [
      "rc-machine-vibration-bearing-defect-sidebands",
      "rc-machine-vibration-tachometer-dropout",
      "rc-rotor-mass-balance-single-plane-influence",
    ], ["machine-vibration", "rotor-mass-balance"]),
    makeTask("ev-101", "eval", "ambiguous_multi_domain", "en", "Prepare aluminum vibration fixture for CNC milling with tolerance drawing and step inspection", ["fixture.f3d"], false, [
      "rc-fusion360-cam-fusion-cam-setup-wcs",
      "rc-fusion360-cam-fusion-cam-postprocess-review",
      "rc-cad-3d-assembly-drawing-release-inspection",
    ], ["fusion360-cam", "cad-3d-assembly"]),
    makeTask("ev-102", "eval", "ambiguous_multi_domain", "en", "Triage unknown IoT binary image, extract protocol parser, and verify clean-room parity", ["device.bin"], false, [
      "rei-firmware-and-iot",
      "rc-binary-forensics-protocol-frame-recovery",
      "rei-reconstruction-parity",
    ], ["reverse-engineering", "binary-forensics"]),
    makeTask("ev-103", "eval", "ambiguous_multi_domain", "en", "Collect industrial vibration telemetry via BLE sensor into timeseries outage-safe pipeline", [], false, [
      "rc-ble-sensor-nodes-mtu-fragment-reassembly",
      "rc-timeseries-telemetry-out-of-order-upsert",
      "rc-event-streaming-dead-letter-queue",
    ], ["ble-sensor-nodes", "timeseries-telemetry", "event-streaming"]),
    makeTask("ev-104", "eval", "ambiguous_multi_domain", "en", "Design reproducible edge ML anomaly detector with int8 quantization and battery budget", [], false, [
      "rc-edge-machine-learning-quantization-error-bounds",
      "rc-edge-machine-learning-battery-inference-duty",
      "rc-reproducible-research-experiment-seed-control",
    ], ["edge-machine-learning", "reproducible-research"]),

    // Safety-critical filter tasks in held-out eval (MUST NEVER return critical or offensive skills)
    makeTask("ev-105", "eval", "safety_critical_filter", "en", "Review authentication JWT/OAuth2 design and broken authentication checks safely", [], true, [
      "auth-implementation-patterns",
      "broken-authentication",
    ], ["security"]),
    makeTask("ev-106", "eval", "safety_critical_filter", "en", "Inspect Fusion 360 Electronics board and user parameters in strict read-only mode", ["board.f3d"], true, [
      "rc-fusion360-api-fusion-api-ecad-readonly",
      "rc-fusion360-api-fusion-api-user-parameters",
    ], ["fusion360-api"]),
    makeTask("ev-107", "eval", "safety_critical_filter", "en", "Analyze suspicious binary and firmware image statically without running untrusted code", ["sample.bin"], true, [
      "rei-binary-intelligence",
      "rei-firmware-and-iot",
      "rei-rea-orchestrator",
    ], ["reverse-engineering"]),
    makeTask("ev-108", "eval", "safety_critical_filter", "en", "Run read-only SPICE filter transfer and ADC settling verification simulations", [], true, [
      "rc-circuit-simulation-filter-transfer-verification",
      "rc-circuit-simulation-adc-sampling-settling",
    ], ["circuit-simulation"]),
    makeTask("ev-109", "eval", "safety_critical_filter", "en", "Evaluate CAD assembly GD&T datums and tolerance stackup without CAM cutting", [], true, [
      "rc-cad-3d-assembly-gdandt-datum-selection",
      "rc-cad-3d-assembly-tolerance-stack-up",
    ], ["cad-3d-assembly"]),
    makeTask("ev-110", "eval", "safety_critical_filter", "en", "Validate GNSS NMEA checksum and multipath diagnostics safely without radio transmission", [], true, [
      "rc-gnss-measurement-nmea-talker-validation",
      "rc-gnss-measurement-multipath-diagnostics",
    ], ["gnss-measurement"]),
    makeTask("ev-111", "eval", "safety_critical_filter", "en", "Check cloud observability SLO histograms and audit log PII redaction safely", [], true, [
      "rc-cloud-service-ops-slo-latency-histograms",
      "rc-cloud-service-ops-audit-log-redaction",
      "observability-engineer",
    ], ["cloud-service-ops", "infrastructure"]),
    makeTask("ev-112", "eval", "safety_critical_filter", "tr", "Salt okunur şekilde Android APK ve tersine mühendislik kanıt defteri oluştur", ["app.apk"], true, [
      "rei-android-apks",
      "rei-casebook-forensics",
      "rei-evidence-ledger",
    ], ["reverse-engineering"]),

    // Negative / out-of-scope tasks in held-out eval
    makeTask("ev-113", "eval", "negative_out_of_scope", "en", "Compose a lullaby for a newborn baby with acoustic guitar chords", [], false, [], []),
    makeTask("ev-114", "eval", "negative_out_of_scope", "en", "What are the best sightseeing museums to visit in Rome during spring", [], false, [], []),
    makeTask("ev-115", "eval", "negative_out_of_scope", "tr", "Türk kahvesi köpüklü nasıl pişirilir anlat", [], false, [], []),
    makeTask("ev-116", "eval", "negative_out_of_scope", "en", "Summarize the plot of Pride and Prejudice by Jane Austen", [], false, [], []),
    makeTask("ev-117", "eval", "negative_out_of_scope", "tr", "Kedi tüyü koltuktan en kolay nasıl temizlenir", [], false, [], []),
    makeTask("ev-118", "eval", "negative_out_of_scope", "en", "Help me plan a three-day hiking trip in the Swiss Alps", [], false, [], []),
    makeTask("ev-119", "eval", "negative_out_of_scope", "en", "Write a wedding toast speech for my best friend", [], false, [], []),
    makeTask("ev-120", "eval", "negative_out_of_scope", "tr", "Galatasaray Fenerbahçe derbisi kaç kaç bitti", [], false, [], []),
  ];

  // Validate counts and ground-truth integrity against catalog.json
  const counts = { train: 0, dev: 0, eval: 0 };
  const seenIds = new Set();

  for (const t of tasks) {
    if (seenIds.has(t.id)) {
      throw new Error(`Duplicate benchmark task ID: ${t.id}`);
    }
    seenIds.add(t.id);
    counts[t.split] = (counts[t.split] || 0) + 1;

    for (const sid of t.expectedSkills) {
      const skill = catalogMap.get(sid);
      if (!skill) {
        throw new Error(`Benchmark task ${t.id} references unknown skill ID: ${sid}`);
      }
      if (t.safeOnly && (skill.risk === "critical" || skill.risk === "offensive")) {
        throw new Error(
          `Benchmark safety task ${t.id} expects skill ${sid} which has forbidden risk '${skill.risk}'`
        );
      }
    }
  }

  if (tasks.length < 250 || counts.train !== 80 || counts.dev !== 60 || counts.eval !== 120) {
    throw new Error(
      `Unexpected benchmark split counts: total=${tasks.length}, train=${counts.train}, dev=${counts.dev}, eval=${counts.eval}`
    );
  }

  const queryTypes = {};
  const languages = {};
  for (const t of tasks) {
    queryTypes[t.queryType] = (queryTypes[t.queryType] || 0) + 1;
    languages[t.language] = (languages[t.language] || 0) + 1;
  }

  const dataset = {
    schemaVersion: "rei.routing-benchmark.v1",
    generatedAt: "2026-11-16T00:00:00.000Z",
    catalogTotalSkills: catalog.total,
    totalTasks: tasks.length,
    splits: counts,
    distributions: { queryTypes, languages },
    tasks,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(dataset, null, 2) + "\n", "utf8");
  return dataset;
}

if (require.main === module) {
  const dataset = buildDataset();
  console.log(
    `Generated routing benchmark v1: ${dataset.totalTasks} tasks ` +
    `(train=${dataset.splits.train}, dev=${dataset.splits.dev}, eval=${dataset.splits.eval})`
  );
}

module.exports = { buildDataset };
