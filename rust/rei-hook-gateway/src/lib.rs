//! REI Skills Typed Secure Communication Gateway Library (`v0.2.0`).
//!
//! Architecture & security boundaries:
//! - Loopback IPC by default (`127.0.0.1:9783`); non-loopback binds fail closed unless
//!   `MtlsReadinessConfig.remote_enabled` AND verified mTLS credentials + CA + SAN allowlist
//!   are explicitly supplied.
//! - Zero arbitrary shell execution: `shell.execute` and unknown events are denied by default.
//! - Machine and engineering adapters (`kicad`, `fusion360`, `embedded_diagnostics`,
//!   `telemetry`, `lab_equipment`) expose typed, read-only or approval-gated contracts only.
//! - Provides replay protection, correlation deduplication, per-client capabilities,
//!   sliding-window rate limiting, concurrency backpressure, cancellation, sanitized audit
//!   logging, metrics, and graceful shutdown without external async runtimes.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use subtle::ConstantTimeEq;

/// Maximum single frame size in bytes (4 KiB framing cap).
pub const MAX_FRAME_BYTES: usize = 4096;
/// Maximum correlation_id length.
pub const MAX_CORRELATION_ID_LEN: usize = 128;
/// Default replay clock skew tolerance (5 minutes).
pub const DEFAULT_MAX_TIMESTAMP_SKEW_MS: u64 = 300_000;

/// Operation risk classification for events and adapter calls.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SafetyClass {
    /// Pure inspection, health check, telemetry read, or dry-run validation.
    ReadOnly = 0,
    /// Modifies generated workspace/design artifacts (requires operator preview/approval check).
    StateChanging = 1,
    /// Interacts with physical actuators, hardware flashing, or energized lab equipment.
    PotentiallyHazardous = 2,
}

impl SafetyClass {
    /// Canonical lowercase label.
    pub fn as_str(&self) -> &'static str {
        match self {
            SafetyClass::ReadOnly => "read_only",
            SafetyClass::StateChanging => "state_changing",
            SafetyClass::PotentiallyHazardous => "potentially_hazardous",
        }
    }
}

/// Static specification of an isolated engineering adapter operation.
#[derive(Debug, Clone, Serialize)]
pub struct AdapterOperationSpec {
    pub adapter: &'static str,
    pub operation: &'static str,
    pub safety_class: SafetyClass,
    pub executes_external_process: bool,
    pub requires_operator_approval: bool,
    pub description: &'static str,
}

/// Returns all built-in isolated engineering adapter contracts.
/// Note: every contract executes typed schema validation / planning in-process only;
/// none of these operations invoke external OS shells.
pub fn list_adapter_contracts() -> Vec<AdapterOperationSpec> {
    vec![
        AdapterOperationSpec {
            adapter: "kicad",
            operation: "inspect_schematic_summary",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Read-only contract verifying KiCad schematic reference metadata.",
        },
        AdapterOperationSpec {
            adapter: "kicad",
            operation: "plan_erc_check",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Builds a dry-run ERC verification plan without mutating schematic files.",
        },
        AdapterOperationSpec {
            adapter: "kicad",
            operation: "plan_drc_check",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Builds a dry-run PCB DRC verification plan with manufacturing constraints.",
        },
        AdapterOperationSpec {
            adapter: "kicad",
            operation: "export_gerber_preview",
            safety_class: SafetyClass::StateChanging,
            executes_external_process: false,
            requires_operator_approval: true,
            description: "Validates Gerber/drill export manifest prior to operator execution.",
        },
        AdapterOperationSpec {
            adapter: "fusion360",
            operation: "inspect_assembly_metadata",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Read-only contract validating CAD assembly unit and bounding box schema.",
        },
        AdapterOperationSpec {
            adapter: "fusion360",
            operation: "verify_enclosure_clearance",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Computational PCB-to-enclosure wall/standoff clearance contract.",
        },
        AdapterOperationSpec {
            adapter: "fusion360",
            operation: "export_step_preview",
            safety_class: SafetyClass::StateChanging,
            executes_external_process: false,
            requires_operator_approval: true,
            description: "Prepares approval-gated STEP/STL export specification for operator CAD run.",
        },
        AdapterOperationSpec {
            adapter: "embedded_diagnostics",
            operation: "read_device_telemetry",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Read-only validation of serial/SWD telemetry frame descriptors.",
        },
        AdapterOperationSpec {
            adapter: "embedded_diagnostics",
            operation: "validate_nmea_frame",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Verifies GNSS NMEA-0183 framing contract in read-only mode.",
        },
        AdapterOperationSpec {
            adapter: "embedded_diagnostics",
            operation: "decode_can_j1939",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Validates J1939 PGN/SA arbitration ID contract.",
        },
        AdapterOperationSpec {
            adapter: "embedded_diagnostics",
            operation: "flash_firmware_image",
            safety_class: SafetyClass::PotentiallyHazardous,
            executes_external_process: false,
            requires_operator_approval: true,
            description: "Approval-gated firmware flashing intent (fails closed without operator token).",
        },
        AdapterOperationSpec {
            adapter: "telemetry",
            operation: "ingest_readonly_sample",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Accepts read-only structured sensor sample metadata for observability.",
        },
        AdapterOperationSpec {
            adapter: "telemetry",
            operation: "query_stream_health",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Returns read-only telemetry buffer and drop-rate health contract.",
        },
        AdapterOperationSpec {
            adapter: "lab_equipment",
            operation: "read_instrument_identity",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Read-only SCPI/VISA instrument identification envelope validator.",
        },
        AdapterOperationSpec {
            adapter: "lab_equipment",
            operation: "validate_calibration_cert",
            safety_class: SafetyClass::ReadOnly,
            executes_external_process: false,
            requires_operator_approval: false,
            description: "Validates instrument calibration expiry and uncertainty metadata.",
        },
        AdapterOperationSpec {
            adapter: "lab_equipment",
            operation: "energize_actuator",
            safety_class: SafetyClass::PotentiallyHazardous,
            executes_external_process: false,
            requires_operator_approval: true,
            description: "Hazardous actuator command gate; strictly requires operator approval.",
        },
    ]
}

/// Looks up a registered adapter operation contract.
pub fn lookup_adapter_operation(adapter: &str, operation: &str) -> Option<AdapterOperationSpec> {
    list_adapter_contracts()
        .into_iter()
        .find(|spec| spec.adapter == adapter && spec.operation == operation)
}

/// mTLS configuration contract for prospective remote gateway deployments.
/// Remote control MUST remain disabled (`remote_enabled: false`) until threat modeling,
/// credential lifecycle, and authorization policies are verified.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MtlsReadinessConfig {
    pub remote_enabled: bool,
    pub require_client_certificate: bool,
    pub tls_cert_path: Option<String>,
    pub tls_key_path: Option<String>,
    pub ca_bundle_path: Option<String>,
    pub allowed_client_sans: Vec<String>,
}

impl Default for MtlsReadinessConfig {
    fn default() -> Self {
        Self {
            remote_enabled: false,
            require_client_certificate: true,
            tls_cert_path: None,
            tls_key_path: None,
            ca_bundle_path: None,
            allowed_client_sans: Vec::new(),
        }
    }
}

/// Validates a listener socket address against local-only and mTLS security invariants.
/// Non-loopback bindings fail closed unless remote transport is explicitly enabled,
/// mTLS verification has succeeded, and TLS cert/key + CA + SAN allowlists are populated.
pub fn validate_bind_address(
    addr: SocketAddr,
    mtls_config: &MtlsReadinessConfig,
    mtls_verified: bool,
) -> Result<(), String> {
    if addr.ip().is_loopback() {
        return Ok(());
    }
    if !mtls_config.remote_enabled {
        return Err(format!(
            "Refusing non-loopback bind address {addr}: remote transport is disabled by default (mTLS required)"
        ));
    }
    if !mtls_verified || !mtls_config.require_client_certificate {
        return Err(format!(
            "Refusing non-loopback bind address {addr}: verified mutual TLS client authentication is mandatory"
        ));
    }
    let has_paths = mtls_config.tls_cert_path.as_deref().is_some_and(|s| !s.is_empty())
        && mtls_config.tls_key_path.as_deref().is_some_and(|s| !s.is_empty())
        && mtls_config.ca_bundle_path.as_deref().is_some_and(|s| !s.is_empty());
    if !has_paths || mtls_config.allowed_client_sans.is_empty() {
        return Err(format!(
            "Refusing non-loopback bind address {addr}: incomplete mTLS certificate, CA bundle, or SAN allowlist"
        ));
    }
    Ok(())
}

/// Incoming JSON line request frame.
/// Preserves full backwards compatibility with legacy `{ token, event, correlation_id }` frames
/// while supporting typed capabilities, replay nonces, adapter calls, and operator approvals.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct GatewayRequest {
    pub token: String,
    pub event: String,
    pub correlation_id: String,
    #[serde(default)]
    pub client_id: Option<String>,
    #[serde(default)]
    pub nonce: Option<String>,
    #[serde(default)]
    pub timestamp_ms: Option<u64>,
    #[serde(default)]
    pub safety_class: Option<SafetyClass>,
    #[serde(default)]
    pub adapter: Option<String>,
    #[serde(default)]
    pub operation: Option<String>,
    #[serde(default)]
    pub dry_run: Option<bool>,
    #[serde(default)]
    pub approval_token: Option<String>,
    #[serde(default)]
    pub payload: Option<serde_json::Value>,
}

/// Structured error metadata reported on denied/rejected/failed gateway responses.
#[derive(Debug, Clone, Serialize)]
pub struct StructuredError {
    pub code: &'static str,
    pub message: String,
}

/// Aggregated gateway telemetry metrics snapshot.
#[derive(Debug, Clone, Serialize, Default)]
pub struct GatewayMetricsSnapshot {
    pub total_requests: u64,
    pub accepted_count: u64,
    pub denied_count: u64,
    pub replay_rejected_count: u64,
    pub deduplicated_count: u64,
    pub rate_limited_count: u64,
    pub backpressure_rejected_count: u64,
    pub invalid_count: u64,
    pub oversized_count: u64,
    pub cancelled_or_timeout_count: u64,
    pub active_connections: usize,
    pub in_flight_requests: usize,
    pub remote_mtls_enabled: bool,
}

/// Sanitized audit entry (never contains shared secrets or approval tokens).
#[derive(Debug, Clone, Serialize)]
pub struct AuditEntry {
    pub sequence_id: u64,
    pub timestamp_ms: u64,
    pub client_id: String,
    pub event: String,
    pub correlation_id: String,
    pub adapter: Option<String>,
    pub operation: Option<String>,
    pub safety_class: Option<&'static str>,
    pub decision: &'static str,
    pub error_code: Option<&'static str>,
}

/// Typed gateway response returned on the socket as a single NDJSON line.
#[derive(Debug, Clone, Serialize)]
pub struct GatewayResponse {
    pub status: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sequence_id: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_class: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deduplicated: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<StructuredError>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub adapter_contract: Option<AdapterOperationSpec>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metrics: Option<GatewayMetricsSnapshot>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_note: Option<&'static str>,
}

impl GatewayResponse {
    fn error_only(status: &'static str, code: &'static str, message: impl Into<String>) -> Self {
        Self {
            status,
            event: None,
            correlation_id: None,
            sequence_id: None,
            client_id: None,
            safety_class: None,
            deduplicated: None,
            error: Some(StructuredError {
                code,
                message: message.into(),
            }),
            health: None,
            adapter_contract: None,
            metrics: None,
            execution_note: None,
        }
    }
}

/// Per-client authorization profile limiting allowed events, adapters, and max safety level.
#[derive(Debug, Clone)]
pub struct ClientCapabilityProfile {
    pub client_id: String,
    pub allowed_events: HashSet<String>,
    pub allowed_adapters: HashSet<String>,
    pub max_safety_class: SafetyClass,
    pub max_requests_per_window: usize,
}

impl ClientCapabilityProfile {
    /// Default profile preserving legacy compatibility for local hook/health inspection and read-only adapters.
    pub fn local_default() -> Self {
        Self {
            client_id: "local-default".to_string(),
            allowed_events: [
                "health",
                "hook.preview",
                "hook.audit",
                "gateway.metrics",
                "gateway.capabilities",
                "adapter.describe",
                "adapter.invoke_preview",
            ]
            .into_iter()
            .map(str::to_string)
            .collect(),
            allowed_adapters: [
                "kicad",
                "fusion360",
                "embedded_diagnostics",
                "telemetry",
                "lab_equipment",
            ]
            .into_iter()
            .map(str::to_string)
            .collect(),
            max_safety_class: SafetyClass::StateChanging,
            max_requests_per_window: 120,
        }
    }

    /// Strictly read-only inspector profile (cannot invoke state-changing or hazardous contracts).
    pub fn readonly_inspector(client_id: impl Into<String>) -> Self {
        Self {
            client_id: client_id.into(),
            allowed_events: [
                "health",
                "hook.preview",
                "gateway.metrics",
                "adapter.describe",
                "adapter.invoke_preview",
            ]
            .into_iter()
            .map(str::to_string)
            .collect(),
            allowed_adapters: ["kicad", "fusion360", "embedded_diagnostics", "telemetry"]
                .into_iter()
                .map(str::to_string)
                .collect(),
            max_safety_class: SafetyClass::ReadOnly,
            max_requests_per_window: 60,
        }
    }

    /// Operator profile permitting explicitly approval-gated hazardous contracts (still preview-only, zero shell exec).
    pub fn engineering_operator(client_id: impl Into<String>) -> Self {
        let mut base = Self::local_default();
        base.client_id = client_id.into();
        base.max_safety_class = SafetyClass::PotentiallyHazardous;
        base
    }
}

/// Configuration for `GatewayEngine`.
#[derive(Debug, Clone)]
pub struct GatewayConfig {
    pub shared_secret: String,
    pub operator_approval_secret: Option<String>,
    pub rate_limit_window: Duration,
    pub max_in_flight: usize,
    pub max_replay_entries: usize,
    pub max_audit_entries: usize,
    pub max_timestamp_skew_ms: u64,
    pub request_timeout: Duration,
    pub mtls: MtlsReadinessConfig,
}

impl GatewayConfig {
    /// Creates a hardened default configuration bound for local loopback usage.
    pub fn with_secret(secret: impl Into<String>) -> Self {
        Self {
            shared_secret: secret.into(),
            operator_approval_secret: None,
            rate_limit_window: Duration::from_secs(60),
            max_in_flight: 32,
            max_replay_entries: 1024,
            max_audit_entries: 512,
            max_timestamp_skew_ms: DEFAULT_MAX_TIMESTAMP_SKEW_MS,
            request_timeout: Duration::from_secs(3),
            mtls: MtlsReadinessConfig::default(),
        }
    }
}

/// Cooperative cancellation signal checked across connection and dispatch phases.
#[derive(Debug, Clone, Default)]
pub struct CancellationToken {
    cancelled: Arc<AtomicBool>,
}

impl CancellationToken {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }
}

/// Coordinates graceful server shutdown and active connection tracking.
#[derive(Debug, Clone, Default)]
pub struct ShutdownController {
    shutdown: Arc<AtomicBool>,
    active_connections: Arc<AtomicUsize>,
}

impl ShutdownController {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn trigger_shutdown(&self) {
        self.shutdown.store(true, Ordering::SeqCst);
    }

    pub fn is_shutting_down(&self) -> bool {
        self.shutdown.load(Ordering::SeqCst)
    }

    pub fn active_connections(&self) -> usize {
        self.active_connections.load(Ordering::SeqCst)
    }

    fn enter_connection(&self) -> ActiveConnectionGuard {
        self.active_connections.fetch_add(1, Ordering::SeqCst);
        ActiveConnectionGuard {
            counter: Arc::clone(&self.active_connections),
        }
    }
}

struct ActiveConnectionGuard {
    counter: Arc<AtomicUsize>,
}

impl Drop for ActiveConnectionGuard {
    fn drop(&mut self) {
        self.counter.fetch_sub(1, Ordering::SeqCst);
    }
}

struct InFlightGuard {
    counter: Arc<AtomicUsize>,
}

impl Drop for InFlightGuard {
    fn drop(&mut self) {
        self.counter.fetch_sub(1, Ordering::SeqCst);
    }
}

#[derive(Debug, Default)]
struct MutableGatewayState {
    seen_nonces: HashSet<String>,
    nonce_order: VecDeque<String>,
    dedup_cache: HashMap<String, GatewayResponse>,
    dedup_order: VecDeque<String>,
    rate_windows: HashMap<String, VecDeque<Instant>>,
    audit_log: VecDeque<AuditEntry>,
    client_profiles: HashMap<String, ClientCapabilityProfile>,
    metrics: GatewayMetricsSnapshot,
}

/// Thread-safe, zero-shell-execution typed gateway engine.
pub struct GatewayEngine {
    config: GatewayConfig,
    state: Mutex<MutableGatewayState>,
    sequence: AtomicU64,
    in_flight: Arc<AtomicUsize>,
    shutdown: ShutdownController,
}

impl GatewayEngine {
    /// Constructs a new `GatewayEngine` requiring a secret of at least 32 characters.
    pub fn new(config: GatewayConfig) -> Result<Self, String> {
        if config.shared_secret.len() < 32 {
            return Err("Gateway secret must be at least 32 characters".to_string());
        }
        let mut initial_state = MutableGatewayState::default();
        let default_profile = ClientCapabilityProfile::local_default();
        initial_state
            .client_profiles
            .insert(default_profile.client_id.clone(), default_profile);
        initial_state.metrics.remote_mtls_enabled = config.mtls.remote_enabled;
        Ok(Self {
            config,
            state: Mutex::new(initial_state),
            sequence: AtomicU64::new(0),
            in_flight: Arc::new(AtomicUsize::new(0)),
            shutdown: ShutdownController::new(),
        })
    }

    /// Registers or replaces a per-client capability profile.
    pub fn register_client_profile(&self, profile: ClientCapabilityProfile) {
        if let Ok(mut guard) = self.state.lock() {
            guard
                .client_profiles
                .insert(profile.client_id.clone(), profile);
        }
    }

    /// Returns shutdown controller for coordinated drain and termination.
    pub fn shutdown_controller(&self) -> ShutdownController {
        self.shutdown.clone()
    }

    /// Returns a current metrics snapshot.
    pub fn metrics_snapshot(&self) -> GatewayMetricsSnapshot {
        let mut snapshot = self
            .state
            .lock()
            .map(|g| g.metrics.clone())
            .unwrap_or_default();
        snapshot.active_connections = self.shutdown.active_connections();
        snapshot.in_flight_requests = self.in_flight.load(Ordering::SeqCst);
        snapshot
    }

    /// Returns a cloned snapshot of recent sanitized audit entries.
    pub fn audit_snapshot(&self) -> Vec<AuditEntry> {
        self.state
            .lock()
            .map(|g| g.audit_log.iter().cloned().collect())
            .unwrap_or_default()
    }

    fn try_acquire_in_flight(&self) -> Option<InFlightGuard> {
        loop {
            let current = self.in_flight.load(Ordering::SeqCst);
            if current >= self.config.max_in_flight {
                return None;
            }
            if self
                .in_flight
                .compare_exchange(current, current + 1, Ordering::SeqCst, Ordering::SeqCst)
                .is_ok()
            {
                return Some(InFlightGuard {
                    counter: Arc::clone(&self.in_flight),
                });
            }
        }
    }

    /// Evaluates raw bytes representing a single NDJSON request line under backpressure,
    /// cancellation, replay, rate-limit, capability, and adapter safety policies.
    pub fn process_raw_frame(
        &self,
        raw_line: &[u8],
        cancellation: &CancellationToken,
    ) -> GatewayResponse {
        self.process_raw_frame_at(raw_line, cancellation, current_epoch_ms())
    }

    /// Deterministic clock-injectable variant used by both live server and replay tests.
    pub fn process_raw_frame_at(
        &self,
        raw_line: &[u8],
        cancellation: &CancellationToken,
        now_ms: u64,
    ) -> GatewayResponse {
        let deadline = Instant::now() + self.config.request_timeout;

        if cancellation.is_cancelled() || self.shutdown.is_shutting_down() {
            self.bump_metric(|m| {
                m.total_requests += 1;
                m.cancelled_or_timeout_count += 1;
            });
            return GatewayResponse::error_only(
                "cancelled",
                "ERR_CANCELLED",
                "Request rejected due to cancellation or gateway shutdown",
            );
        }

        let Some(_flight_guard) = self.try_acquire_in_flight() else {
            self.bump_metric(|m| {
                m.total_requests += 1;
                m.backpressure_rejected_count += 1;
            });
            return GatewayResponse::error_only(
                "backpressure_rejected",
                "ERR_BACKPRESSURE",
                "Gateway concurrent execution budget exhausted; retry with backoff",
            );
        };

        if raw_line.is_empty() || raw_line.len() > MAX_FRAME_BYTES || !raw_line.ends_with(b"\n") {
            self.bump_metric(|m| {
                m.total_requests += 1;
                m.oversized_count += 1;
            });
            return GatewayResponse::error_only(
                "rejected",
                "ERR_FRAME_LIMIT",
                "Frame missing newline terminator or exceeds 4096-byte ceiling",
            );
        }

        let request: GatewayRequest = match serde_json::from_slice(raw_line) {
            Ok(req) => req,
            Err(err) => {
                self.bump_metric(|m| {
                    m.total_requests += 1;
                    m.invalid_count += 1;
                });
                return GatewayResponse::error_only(
                    "invalid_request",
                    "ERR_INVALID_JSON",
                    format!("Malformed or schema-violating request frame: {err}"),
                );
            }
        };

        if Instant::now() > deadline || cancellation.is_cancelled() {
            self.bump_metric(|m| {
                m.total_requests += 1;
                m.cancelled_or_timeout_count += 1;
            });
            return GatewayResponse::error_only(
                "timeout",
                "ERR_TIMEOUT",
                "Request processing exceeded deadline",
            );
        }

        self.evaluate_request(request, now_ms)
    }

    fn evaluate_request(&self, request: GatewayRequest, now_ms: u64) -> GatewayResponse {
        let seq = self.sequence.fetch_add(1, Ordering::SeqCst) + 1;
        let client_id = request
            .client_id
            .clone()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "local-default".to_string());

        // 1. Constant-time token authentication (secret never serialized or logged).
        let token_ok = constant_time_equal(&request.token, &self.config.shared_secret);
        if !token_ok || request.correlation_id.is_empty() || request.correlation_id.len() > MAX_CORRELATION_ID_LEN {
            return self.record_and_return(
                seq,
                now_ms,
                &client_id,
                &request,
                None,
                "denied",
                Some("ERR_AUTH_OR_CORRELATION"),
                GatewayResponse {
                    status: "denied",
                    event: None,
                    correlation_id: None,
                    sequence_id: Some(seq),
                    client_id: Some(client_id.clone()),
                    safety_class: None,
                    deduplicated: None,
                    error: Some(StructuredError {
                        code: "ERR_AUTH_OR_CORRELATION",
                        message: "Authentication failed or correlation_id invalid".to_string(),
                    }),
                    health: None,
                    adapter_contract: None,
                    metrics: None,
                    execution_note: None,
                },
            );
        }

        // 2. Reject embedded shell command keys / metacharacters in payload before dispatch.
        if let Some(ref payload) = request.payload {
            if let Some(reason) = detect_unsafe_payload(payload) {
                return self.record_and_return(
                    seq,
                    now_ms,
                    &client_id,
                    &request,
                    None,
                    "denied",
                    Some("ERR_UNSAFE_PAYLOAD"),
                    GatewayResponse {
                        status: "denied",
                        event: Some(request.event.clone()),
                        correlation_id: Some(request.correlation_id.clone()),
                        sequence_id: Some(seq),
                        client_id: Some(client_id.clone()),
                        safety_class: None,
                        deduplicated: None,
                        error: Some(StructuredError {
                            code: "ERR_UNSAFE_PAYLOAD",
                            message: reason,
                        }),
                        health: None,
                        adapter_contract: None,
                        metrics: None,
                        execution_note: None,
                    },
                );
            }
        }

        // 3. Per-client capability + sliding-window rate limit check.
        {
            let mut guard = self.state.lock().expect("gateway mutex");
            guard.metrics.total_requests += 1;

            let profile = match guard.client_profiles.get(&client_id).cloned() {
                Some(p) => p,
                None => {
                    guard.metrics.denied_count += 1;
                    let resp = GatewayResponse {
                        status: "denied",
                        event: Some(request.event.clone()),
                        correlation_id: Some(request.correlation_id.clone()),
                        sequence_id: Some(seq),
                        client_id: Some(client_id.clone()),
                        safety_class: None,
                        deduplicated: None,
                        error: Some(StructuredError {
                            code: "ERR_UNKNOWN_CLIENT",
                            message: format!("Unknown client profile '{client_id}' denied by default"),
                        }),
                        health: None,
                        adapter_contract: None,
                        metrics: None,
                        execution_note: None,
                    };
                    push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_UNKNOWN_CLIENT"));
                    return resp;
                }
            };

            let window_start = Instant::now()
                .checked_sub(self.config.rate_limit_window)
                .unwrap_or_else(Instant::now);
            let bucket = guard.rate_windows.entry(client_id.clone()).or_default();
            while matches!(bucket.front(), Some(ts) if *ts < window_start) {
                bucket.pop_front();
            }
            if bucket.len() >= profile.max_requests_per_window {
                guard.metrics.rate_limited_count += 1;
                let resp = GatewayResponse {
                    status: "rate_limited",
                    event: Some(request.event.clone()),
                    correlation_id: Some(request.correlation_id.clone()),
                    sequence_id: Some(seq),
                    client_id: Some(client_id.clone()),
                    safety_class: None,
                    deduplicated: None,
                    error: Some(StructuredError {
                        code: "ERR_RATE_LIMITED",
                        message: format!(
                            "Rate limit exceeded for client '{client_id}' ({} req/window)",
                            profile.max_requests_per_window
                        ),
                    }),
                    health: None,
                    adapter_contract: None,
                    metrics: None,
                    execution_note: None,
                };
                push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "rate_limited", Some("ERR_RATE_LIMITED"));
                return resp;
            }
            bucket.push_back(Instant::now());

            // 4. Replay protection (timestamp skew + nonce uniqueness).
            if let Some(ts) = request.timestamp_ms {
                let diff = now_ms.abs_diff(ts);
                if diff > self.config.max_timestamp_skew_ms {
                    guard.metrics.replay_rejected_count += 1;
                    let resp = GatewayResponse {
                        status: "replay_rejected",
                        event: Some(request.event.clone()),
                        correlation_id: Some(request.correlation_id.clone()),
                        sequence_id: Some(seq),
                        client_id: Some(client_id.clone()),
                        safety_class: None,
                        deduplicated: None,
                        error: Some(StructuredError {
                            code: "ERR_STALE_TIMESTAMP",
                            message: format!(
                                "Request timestamp_ms outside allowed +/-{}ms window",
                                self.config.max_timestamp_skew_ms
                            ),
                        }),
                        health: None,
                        adapter_contract: None,
                        metrics: None,
                        execution_note: None,
                    };
                    push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "replay_rejected", Some("ERR_STALE_TIMESTAMP"));
                    return resp;
                }
            }

            if let Some(ref nonce) = request.nonce {
                if nonce.is_empty() || nonce.len() > 128 {
                    guard.metrics.invalid_count += 1;
                    let resp = GatewayResponse::error_only(
                        "invalid_request",
                        "ERR_INVALID_NONCE",
                        "Nonce must be 1..=128 characters when provided",
                    );
                    push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "invalid_request", Some("ERR_INVALID_NONCE"));
                    return resp;
                }
                let nonce_key = format!("{client_id}:{nonce}");
                if guard.seen_nonces.contains(&nonce_key) {
                    guard.metrics.replay_rejected_count += 1;
                    let resp = GatewayResponse {
                        status: "replay_rejected",
                        event: Some(request.event.clone()),
                        correlation_id: Some(request.correlation_id.clone()),
                        sequence_id: Some(seq),
                        client_id: Some(client_id.clone()),
                        safety_class: None,
                        deduplicated: None,
                        error: Some(StructuredError {
                            code: "ERR_REPLAY_NONCE",
                            message: "Nonce already consumed; replay rejected".to_string(),
                        }),
                        health: None,
                        adapter_contract: None,
                        metrics: None,
                        execution_note: None,
                    };
                    push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "replay_rejected", Some("ERR_REPLAY_NONCE"));
                    return resp;
                }
                if guard.nonce_order.len() >= self.config.max_replay_entries {
                    if let Some(oldest) = guard.nonce_order.pop_front() {
                        guard.seen_nonces.remove(&oldest);
                    }
                }
                guard.seen_nonces.insert(nonce_key.clone());
                guard.nonce_order.push_back(nonce_key);
            }

            // 5. Request deduplication (when nonce is absent or explicit idempotent correlation_id repeats for mutating/adapter events).
            let dedup_key = format!("{}:{}:{}", client_id, request.event, request.correlation_id);
            if request.event != "health"
                && request.event != "gateway.metrics"
                && request.nonce.is_none()
            {
                if let Some(cached) = guard.dedup_cache.get(&dedup_key).cloned() {
                    guard.metrics.deduplicated_count += 1;
                    let mut dup = cached;
                    dup.deduplicated = Some(true);
                    push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "deduplicated", None);
                    return dup;
                }
            }

            // 6. Event allowlist & per-client capability authorization.
            if !profile.allowed_events.contains(&request.event) {
                guard.metrics.denied_count += 1;
                let resp = GatewayResponse {
                    status: "denied",
                    event: Some(request.event.clone()),
                    correlation_id: Some(request.correlation_id.clone()),
                    sequence_id: Some(seq),
                    client_id: Some(client_id.clone()),
                    safety_class: None,
                    deduplicated: None,
                    error: Some(StructuredError {
                        code: "ERR_EVENT_DENIED",
                        message: format!(
                            "Event '{}' not authorized for client '{}'",
                            request.event, client_id
                        ),
                    }),
                    health: None,
                    adapter_contract: None,
                    metrics: None,
                    execution_note: None,
                };
                push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_EVENT_DENIED"));
                return resp;
            }

            // 7. Dispatch typed allowlisted events (never shell execution).
            let mut effective_safety = SafetyClass::ReadOnly;
            let mut adapter_contract: Option<AdapterOperationSpec> = None;
            let mut metrics_payload: Option<GatewayMetricsSnapshot> = None;
            let mut health_str: Option<&'static str> = None;
            let status_str: &'static str;
            let execution_note: &'static str;

            match request.event.as_str() {
                "health" => {
                    status_str = "accepted_preview_only";
                    health_str = Some("ok");
                    let mut m = guard.metrics.clone();
                    m.accepted_count += 1;
                    metrics_payload = Some(m);
                    execution_note = "Loopback gateway healthy; remote mTLS disabled by default";
                }
                "hook.preview" | "hook.audit" => {
                    status_str = "accepted_preview_only";
                    execution_note = "Authenticated preview/audit frame acknowledged without shell execution";
                }
                "gateway.metrics" => {
                    status_str = "accepted_preview_only";
                    let mut m = guard.metrics.clone();
                    m.accepted_count += 1;
                    m.active_connections = self.shutdown.active_connections();
                    m.in_flight_requests = self.in_flight.load(Ordering::SeqCst);
                    metrics_payload = Some(m);
                    execution_note = "Gateway telemetry snapshot";
                }
                "gateway.capabilities" => {
                    status_str = "accepted_preview_only";
                    execution_note = "Client capability boundaries verified";
                }
                "adapter.describe" | "adapter.invoke_preview" => {
                    let adapter = request.adapter.as_deref().unwrap_or("");
                    let operation = request.operation.as_deref().unwrap_or("");
                    if !profile.allowed_adapters.contains(adapter) {
                        guard.metrics.denied_count += 1;
                        let resp = GatewayResponse {
                            status: "denied",
                            event: Some(request.event.clone()),
                            correlation_id: Some(request.correlation_id.clone()),
                            sequence_id: Some(seq),
                            client_id: Some(client_id.clone()),
                            safety_class: None,
                            deduplicated: None,
                            error: Some(StructuredError {
                                code: "ERR_ADAPTER_DENIED",
                                message: format!("Adapter '{adapter}' not authorized for client '{client_id}'"),
                            }),
                            health: None,
                            adapter_contract: None,
                            metrics: None,
                            execution_note: None,
                        };
                        push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_ADAPTER_DENIED"));
                        return resp;
                    }
                    let Some(spec) = lookup_adapter_operation(adapter, operation) else {
                        guard.metrics.denied_count += 1;
                        let resp = GatewayResponse {
                            status: "denied",
                            event: Some(request.event.clone()),
                            correlation_id: Some(request.correlation_id.clone()),
                            sequence_id: Some(seq),
                            client_id: Some(client_id.clone()),
                            safety_class: None,
                            deduplicated: None,
                            error: Some(StructuredError {
                                code: "ERR_UNKNOWN_ADAPTER_OP",
                                message: format!("Unknown adapter contract '{adapter}.{operation}'"),
                            }),
                            health: None,
                            adapter_contract: None,
                            metrics: None,
                            execution_note: None,
                        };
                        push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_UNKNOWN_ADAPTER_OP"));
                        return resp;
                    };

                    if let Some(declared) = request.safety_class {
                        if declared < spec.safety_class {
                            guard.metrics.denied_count += 1;
                            let resp = GatewayResponse {
                                status: "denied",
                                event: Some(request.event.clone()),
                                correlation_id: Some(request.correlation_id.clone()),
                                sequence_id: Some(seq),
                                client_id: Some(client_id.clone()),
                                safety_class: Some(spec.safety_class.as_str()),
                                deduplicated: None,
                                error: Some(StructuredError {
                                    code: "ERR_SAFETY_DOWNGRADE",
                                    message: "Caller cannot downgrade adapter operation safety_class".to_string(),
                                }),
                                health: None,
                                adapter_contract: Some(spec),
                                metrics: None,
                                execution_note: None,
                            };
                            push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_SAFETY_DOWNGRADE"));
                            return resp;
                        }
                    }

                    if spec.safety_class > profile.max_safety_class {
                        guard.metrics.denied_count += 1;
                        let resp = GatewayResponse {
                            status: "denied",
                            event: Some(request.event.clone()),
                            correlation_id: Some(request.correlation_id.clone()),
                            sequence_id: Some(seq),
                            client_id: Some(client_id.clone()),
                            safety_class: Some(spec.safety_class.as_str()),
                            deduplicated: None,
                            error: Some(StructuredError {
                                code: "ERR_CAPABILITY_ESCALATION",
                                message: format!(
                                    "Client '{client_id}' max safety_class ({}) cannot invoke {} operation",
                                    profile.max_safety_class.as_str(),
                                    spec.safety_class.as_str()
                                ),
                            }),
                            health: None,
                            adapter_contract: Some(spec),
                            metrics: None,
                            execution_note: None,
                        };
                        push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_CAPABILITY_ESCALATION"));
                        return resp;
                    }

                    if request.event == "adapter.invoke_preview" && spec.requires_operator_approval {
                        let approved = match (&self.config.operator_approval_secret, &request.approval_token) {
                            (Some(expected), Some(supplied)) => constant_time_equal(supplied, expected),
                            _ => false,
                        };
                        if !approved {
                            guard.metrics.denied_count += 1;
                            let resp = GatewayResponse {
                                status: "approval_required",
                                event: Some(request.event.clone()),
                                correlation_id: Some(request.correlation_id.clone()),
                                sequence_id: Some(seq),
                                client_id: Some(client_id.clone()),
                                safety_class: Some(spec.safety_class.as_str()),
                                deduplicated: None,
                                error: Some(StructuredError {
                                    code: "ERR_APPROVAL_REQUIRED",
                                    message: format!(
                                        "Adapter operation '{}.{}' ({}) requires valid operator approval_token",
                                        spec.adapter,
                                        spec.operation,
                                        spec.safety_class.as_str()
                                    ),
                                }),
                                health: None,
                                adapter_contract: Some(spec),
                                metrics: None,
                                execution_note: None,
                            };
                            push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "approval_required", Some("ERR_APPROVAL_REQUIRED"));
                            return resp;
                        }
                    }

                    effective_safety = spec.safety_class;
                    adapter_contract = Some(spec);
                    status_str = "accepted_preview_only";
                    execution_note = if request.dry_run.unwrap_or(true) {
                        "Contract validated in dry-run preview mode; no physical device or external tool mutated"
                    } else {
                        "Contract accepted for gated operator handoff; gateway executes no host shells"
                    };
                }
                _ => {
                    guard.metrics.denied_count += 1;
                    let resp = GatewayResponse::error_only(
                        "denied",
                        "ERR_EVENT_DENIED",
                        "Event rejected by deny-by-default policy",
                    );
                    push_audit(&mut guard, self.config.max_audit_entries, seq, now_ms, &client_id, &request, None, "denied", Some("ERR_EVENT_DENIED"));
                    return resp;
                }
            }

            guard.metrics.accepted_count += 1;
            let resp = GatewayResponse {
                status: status_str,
                event: Some(request.event.clone()),
                correlation_id: Some(request.correlation_id.clone()),
                sequence_id: Some(seq),
                client_id: Some(client_id.clone()),
                safety_class: Some(effective_safety.as_str()),
                deduplicated: Some(false),
                error: None,
                health: health_str,
                adapter_contract,
                metrics: metrics_payload,
                execution_note: Some(execution_note),
            };

            if request.event != "health" && request.event != "gateway.metrics" {
                if guard.dedup_order.len() >= self.config.max_replay_entries {
                    if let Some(oldest) = guard.dedup_order.pop_front() {
                        guard.dedup_cache.remove(&oldest);
                    }
                }
                guard.dedup_cache.insert(dedup_key.clone(), resp.clone());
                guard.dedup_order.push_back(dedup_key);
            }

            push_audit(
                &mut guard,
                self.config.max_audit_entries,
                seq,
                now_ms,
                &client_id,
                &request,
                Some(effective_safety.as_str()),
                status_str,
                None,
            );
            resp
        }
    }

    fn bump_metric(&self, updater: impl FnOnce(&mut GatewayMetricsSnapshot)) {
        if let Ok(mut guard) = self.state.lock() {
            updater(&mut guard.metrics);
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn record_and_return(
        &self,
        seq: u64,
        now_ms: u64,
        client_id: &str,
        request: &GatewayRequest,
        safety_class: Option<&'static str>,
        decision: &'static str,
        error_code: Option<&'static str>,
        response: GatewayResponse,
    ) -> GatewayResponse {
        if let Ok(mut guard) = self.state.lock() {
            guard.metrics.total_requests += 1;
            if decision == "denied" || decision == "approval_required" {
                guard.metrics.denied_count += 1;
            }
            push_audit(
                &mut guard,
                self.config.max_audit_entries,
                seq,
                now_ms,
                client_id,
                request,
                safety_class,
                decision,
                error_code,
            );
        }
        response
    }
}

#[allow(clippy::too_many_arguments)]
fn push_audit(
    guard: &mut MutableGatewayState,
    max_entries: usize,
    seq: u64,
    now_ms: u64,
    client_id: &str,
    request: &GatewayRequest,
    safety_class: Option<&'static str>,
    decision: &'static str,
    error_code: Option<&'static str>,
) {
    if guard.audit_log.len() >= max_entries {
        guard.audit_log.pop_front();
    }
    guard.audit_log.push_back(AuditEntry {
        sequence_id: seq,
        timestamp_ms: now_ms,
        client_id: client_id.to_string(),
        event: request.event.clone(),
        correlation_id: request.correlation_id.clone(),
        adapter: request.adapter.clone(),
        operation: request.operation.clone(),
        safety_class,
        decision,
        error_code,
    });
}

fn constant_time_equal(a: &str, b: &str) -> bool {
    a.as_bytes().ct_eq(b.as_bytes()).unwrap_u8() == 1
}

/// Scans nested JSON payloads for shell-execution keys or command-injection patterns.
fn detect_unsafe_payload(val: &serde_json::Value) -> Option<String> {
    const FORBIDDEN_KEYS: &[&str] = &[
        "shell",
        "command",
        "cmd",
        "exec",
        "spawn",
        "bash",
        "powershell",
        "pwsh",
        "script_exec",
    ];
    match val {
        serde_json::Value::Object(map) => {
            for (k, v) in map {
                let lower = k.to_ascii_lowercase();
                if FORBIDDEN_KEYS.iter().any(|fk| lower == *fk) {
                    return Some(format!(
                        "Forbidden execution key '{k}' in structured payload"
                    ));
                }
                if let Some(reason) = detect_unsafe_payload(v) {
                    return Some(reason);
                }
            }
            None
        }
        serde_json::Value::Array(items) => items.iter().find_map(detect_unsafe_payload),
        serde_json::Value::String(s) => {
            let trimmed = s.trim();
            if trimmed.contains("&&")
                || trimmed.contains("$(")
                || trimmed.contains('`')
                || trimmed.contains("| bash")
                || trimmed.contains("| sh")
            {
                return Some("Shell control operator detected in payload string".to_string());
            }
            None
        }
        _ => None,
    }
}

/// Returns current UNIX epoch milliseconds.
pub fn current_epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Reads a single bounded NDJSON request from a socket stream, evaluates it through
/// `GatewayEngine`, and writes a single JSON response line.
pub fn handle_connection(
    mut stream: TcpStream,
    engine: &GatewayEngine,
    cancellation: &CancellationToken,
) -> std::io::Result<()> {
    let _conn_guard = engine.shutdown_controller().enter_connection();
    stream.set_read_timeout(Some(Duration::from_secs(3)))?;
    stream.set_write_timeout(Some(Duration::from_secs(3)))?;

    let mut line = Vec::new();
    let bytes = BufReader::new(stream.try_clone()?)
        .take((MAX_FRAME_BYTES + 1) as u64)
        .read_until(b'\n', &mut line)?;

    let response = if bytes == 0 || bytes > MAX_FRAME_BYTES || !line.ends_with(b"\n") {
        engine.bump_metric(|m| {
            m.total_requests += 1;
            m.oversized_count += 1;
        });
        GatewayResponse::error_only(
            "rejected",
            "ERR_FRAME_LIMIT",
            "Empty, unterminated, or oversized request frame",
        )
    } else {
        engine.process_raw_frame(&line, cancellation)
    };

    serde_json::to_writer(&mut stream, &response)?;
    stream.write_all(b"\n")?;
    stream.flush()?;
    Ok(())
}

/// Runs a bounded non-blocking accept loop with graceful shutdown and connection draining.
pub fn serve_until_shutdown(
    listener: TcpListener,
    engine: Arc<GatewayEngine>,
    drain_timeout: Duration,
) -> std::io::Result<()> {
    listener.set_nonblocking(true)?;
    let shutdown = engine.shutdown_controller();
    let mut handles = Vec::new();

    while !shutdown.is_shutting_down() {
        match listener.accept() {
            Ok((stream, _peer)) => {
                let eng = Arc::clone(&engine);
                let cancel = CancellationToken::new();
                handles.push(thread::spawn(move || {
                    if let Err(err) = handle_connection(stream, &eng, &cancel) {
                        eprintln!("connection error: {err}");
                    }
                }));
                handles.retain(|h| !h.is_finished());
            }
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(10));
            }
            Err(err) => return Err(err),
        }
    }

    let drain_deadline = Instant::now() + drain_timeout;
    while shutdown.active_connections() > 0 && Instant::now() < drain_deadline {
        thread::sleep(Duration::from_millis(10));
    }
    for handle in handles {
        let _ = handle.join();
    }
    Ok(())
}

/// Resolves the configured loopback listen address from `REI_HOOK_GATEWAY_PORT` (default `9783`).
pub fn resolve_loopback_listen_addr() -> SocketAddr {
    let port = std::env::var("REI_HOOK_GATEWAY_PORT")
        .ok()
        .and_then(|v| v.parse::<u16>().ok())
        .filter(|p| *p > 0)
        .unwrap_or(9783);
    SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port)
}
