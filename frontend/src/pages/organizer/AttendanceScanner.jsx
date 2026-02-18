import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { scanQRAttendance, markManualAttendance, getEventAttendance, exportAttendance } from '../../api/organizer';

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary, #0a0e0a)',
    color: 'var(--text-primary, #e8f5e9)',
    padding: '24px',
    fontFamily: 'inherit',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#ccc',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#a5d6a7',
    flex: 1,
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '0',
    flexWrap: 'wrap',
  },
  tab: (active) => ({
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #66bb6a' : '2px solid transparent',
    color: active ? '#66bb6a' : '#888',
    fontWeight: active ? 600 : 400,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-1px',
  }),
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#a5d6a7',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e8f5e9',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#90a4ae',
    marginBottom: '6px',
    fontWeight: 500,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 22px',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    padding: '10px 22px',
    color: '#ccc',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnDanger: {
    background: 'rgba(211,47,47,0.2)',
    border: '1px solid rgba(211,47,47,0.4)',
    borderRadius: '8px',
    padding: '10px 22px',
    color: '#ef9a9a',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
  },
  alert: (type) => ({
    borderRadius: '10px',
    padding: '14px 18px',
    marginBottom: '20px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: type === 'success'
      ? 'rgba(46,125,50,0.2)'
      : type === 'duplicate'
      ? 'rgba(245,124,0,0.2)'
      : 'rgba(198,40,40,0.2)',
    border: `1px solid ${
      type === 'success'
        ? 'rgba(76,175,80,0.4)'
        : type === 'duplicate'
        ? 'rgba(255,167,38,0.4)'
        : 'rgba(239,83,80,0.4)'
    }`,
    color: type === 'success' ? '#a5d6a7' : type === 'duplicate' ? '#ffcc80' : '#ef9a9a',
  }),
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  statBox: (color) => ({
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${color}33`,
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center',
  }),
  statValue: (color) => ({
    fontSize: '28px',
    fontWeight: 700,
    color: color,
    lineHeight: 1,
  }),
  statLabel: {
    fontSize: '12px',
    color: '#90a4ae',
    marginTop: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#90a4ae',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: '#ccc',
    verticalAlign: 'middle',
  },
  badge: (method) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    background: method === 'qr_scan' ? 'rgba(76,175,80,0.2)' : 'rgba(33,150,243,0.2)',
    color: method === 'qr_scan' ? '#81c784' : '#64b5f6',
    border: `1px solid ${method === 'qr_scan' ? 'rgba(76,175,80,0.4)' : 'rgba(33,150,243,0.4)'}`,
  }),
  scannerContainer: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────
export default function AttendanceScanner() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualQr, setManualQr] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRemarks, setManualRemarks] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scannerRef = useRef(null);
  const resultTimeoutRef = useRef(null);
  const loadingRef = useRef(false);

  // ── Fetch attendance list ──────────────────────────────────────────────────
  const fetchAttendance = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getEventAttendance(eventId);
      setAttendanceData(res.data);
    } catch (e) {
      console.error('Failed to fetch attendance:', e);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Auto-clear scan result ─────────────────────────────────────────────────
  const showResult = useCallback((result) => {
    setScanResult(result);
    clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => setScanResult(null), 6000);
  }, []);

  // ── Process QR code (shared by camera + manual text entry) ────────────────
  const processQRCode = useCallback(async (qrCode) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await scanQRAttendance(eventId, qrCode);
      showResult({
        type: 'success',
        message: `✓ Attendance marked for ${res.data.participant?.name || 'Participant'}`,
        sub: `Email: ${res.data.participant?.email} · ${new Date(res.data.scannedAt).toLocaleTimeString()}`,
      });
      fetchAttendance(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'Scan failed';
      const isDuplicate = e.response?.status === 400 && msg.toLowerCase().includes('already');
      const scannedAt = e.response?.data?.scannedAt;
      showResult({
        type: isDuplicate ? 'duplicate' : 'error',
        message: isDuplicate ? '⚠ Already scanned — duplicate rejected' : `✗ ${msg}`,
        sub: isDuplicate && scannedAt
          ? `Originally scanned at ${new Date(scannedAt).toLocaleString()}`
          : '',
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [eventId, fetchAttendance, showResult]);

  // ── Camera scanner lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'camera' || !cameraActive) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    const domId = 'qr-reader-div';
    const timer = setTimeout(() => {
      if (!document.getElementById(domId)) return;

      const scanner = new Html5QrcodeScanner(
        domId,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.pause(true);
          processQRCode(decodedText).then(() => {
            setTimeout(() => {
              if (scannerRef.current) {
                try { scannerRef.current.resume(); } catch (_) {}
              }
            }, 2500);
          });
        },
        () => {}
      );
      scannerRef.current = scanner;
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [activeTab, cameraActive, processQRCode]);

  const handleStartCamera = () => setCameraActive(true);
  const handleStopCamera = () => {
    setCameraActive(false);
    setScanResult(null);
  };

  // ── Text QR submit ─────────────────────────────────────────────────────────
  const handleManualQR = async (e) => {
    e.preventDefault();
    if (!manualQr.trim()) return;
    const code = manualQr.trim();
    setManualQr('');
    await processQRCode(code);
  };

  // ── Manual override by email ───────────────────────────────────────────────
  const handleManualOverride = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    setLoading(true);
    try {
      const res = await markManualAttendance(eventId, manualEmail.trim(), manualRemarks.trim());
      showResult({
        type: 'success',
        message: `✓ Manual attendance marked for ${res.data.participant?.name || manualEmail}`,
        sub: manualRemarks ? `Note: ${manualRemarks}` : '',
      });
      setManualEmail('');
      setManualRemarks('');
      fetchAttendance(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'Manual entry failed';
      const isDuplicate = e.response?.status === 400 && msg.toLowerCase().includes('already');
      showResult({
        type: isDuplicate ? 'duplicate' : 'error',
        message: isDuplicate ? '⚠ Attendance already marked for this participant' : `✗ ${msg}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await exportAttendance(eventId);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (attendanceData?.event?.name || eventId).replace(/\s+/g, '_');
      a.download = `attendance_${safeName}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed:', e);
      showResult({ type: 'error', message: '✗ Export failed. Please try again.' });
    }
  };

  // ── Shortcuts: switch tab to dashboard on result ───────────────────────────
  const stats = attendanceData?.stats;
  const records = attendanceData?.attendanceList || [];
  const eventName = attendanceData?.event?.name || 'Event';

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 style={S.title}>Attendance · {eventName}</h1>
        <button
          style={{ ...S.btnSecondary, fontSize: '13px', padding: '8px 16px' }}
          onClick={() => fetchAttendance()}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* ── Stats Row ── */}
      {stats && (
        <div style={S.statGrid}>
          <div style={S.statBox('#66bb6a')}>
            <div style={S.statValue('#66bb6a')}>{stats.attendanceCount}</div>
            <div style={S.statLabel}>Attended</div>
          </div>
          <div style={S.statBox('#42a5f5')}>
            <div style={S.statValue('#42a5f5')}>{stats.totalRegistrations}</div>
            <div style={S.statLabel}>Registered</div>
          </div>
          <div style={S.statBox('#ffb74d')}>
            <div style={S.statValue('#ffb74d')}>{stats.attendanceRate}%</div>
            <div style={S.statLabel}>Attendance Rate</div>
          </div>
          <div style={S.statBox('#ef5350')}>
            <div style={S.statValue('#ef5350')}>
              {stats.totalRegistrations - stats.attendanceCount}
            </div>
            <div style={S.statLabel}>Not Yet Scanned</div>
          </div>
        </div>
      )}

      {/* ── Scan Result Alert ── */}
      {scanResult && (
        <div style={S.alert(scanResult.type)}>
          <div>
            <div style={{ fontWeight: 600 }}>{scanResult.message}</div>
            {scanResult.sub && (
              <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.85 }}>
                {scanResult.sub}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={S.tabs}>
        {[
          { id: 'camera',    label: '📷 Camera Scanner' },
          { id: 'text',      label: '⌨ Text / Scanner' },
          { id: 'manual',    label: '✏️ Manual Override' },
          { id: 'dashboard', label: `📋 Records (${records.length})` },
        ].map(t => (
          <button
            key={t.id}
            style={S.tab(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Camera QR Scanner Tab                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'camera' && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Camera QR Scanner</h3>
          <p style={{ color: '#90a4ae', fontSize: '14px', margin: '0 0 16px 0' }}>
            Point your device camera at a participant's ticket QR code to instantly mark
            attendance. The camera will re-activate automatically after each scan.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            {!cameraActive ? (
              <button style={S.btnPrimary} onClick={handleStartCamera}>
                📷 Start Camera
              </button>
            ) : (
              <button style={S.btnDanger} onClick={handleStopCamera}>
                ⏹ Stop Camera
              </button>
            )}
            {loading && (
              <span style={{ color: '#90a4ae', fontSize: '14px' }}>Processing…</span>
            )}
          </div>

          {cameraActive ? (
            <div style={S.scannerContainer}>
              <div id="qr-reader-div" />
            </div>
          ) : (
            <div style={{
              border: '2px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#555',
            }}>
              <div style={{ fontSize: '52px', marginBottom: '12px' }}>📷</div>
              <div style={{ fontSize: '15px' }}>Click "Start Camera" to begin scanning</div>
              <div style={{ fontSize: '13px', marginTop: '8px', color: '#444' }}>
                You may be prompted to allow camera access
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Text / Keyboard Wedge Scanner Tab                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'text' && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Text / Keyboard Wedge Scanner</h3>
          <p style={{ color: '#90a4ae', fontSize: '14px', margin: '0 0 20px 0' }}>
            Works with USB barcode/QR scanners (keyboard wedge mode) — just click the input
            and scan. Also accepts pasted ticket IDs from the confirmation email.
          </p>
          <form onSubmit={handleManualQR} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <label style={S.label}>QR Code / Ticket ID</label>
              <input
                style={S.input}
                type="text"
                value={manualQr}
                onChange={e => setManualQr(e.target.value)}
                placeholder="Scan or paste ticket ID here"
                autoFocus
              />
            </div>
            <button
              type="submit"
              style={{ ...S.btnPrimary, marginBottom: '12px' }}
              disabled={loading || !manualQr.trim()}
            >
              {loading ? 'Processing…' : 'Mark Attendance'}
            </button>
          </form>
          <div style={{ color: '#555', fontSize: '13px' }}>
            💡 Tip: With a USB QR scanner, click the input field above then scan the participant's
            QR code — it submits automatically.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Manual Override Tab                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'manual' && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Manual Attendance Override</h3>
          <p style={{ color: '#90a4ae', fontSize: '14px', margin: '0 0 20px 0' }}>
            Mark attendance by participant email when QR code isn't available.
            A full audit log entry (including your reason) is saved.
          </p>
          <form onSubmit={handleManualOverride}>
            <label style={S.label}>Participant Email *</label>
            <input
              style={S.input}
              type="email"
              value={manualEmail}
              onChange={e => setManualEmail(e.target.value)}
              placeholder="participant@example.com"
              required
            />
            <label style={S.label}>Remarks / Reason (recorded in audit log)</label>
            <input
              style={S.input}
              type="text"
              value={manualRemarks}
              onChange={e => setManualRemarks(e.target.value)}
              placeholder="e.g. Phone lost, QR code not displaying correctly"
            />
            <button
              type="submit"
              style={S.btnPrimary}
              disabled={loading || !manualEmail.trim()}
            >
              {loading ? 'Processing…' : '✓ Mark Attendance Manually'}
            </button>
          </form>
          <div style={{
            marginTop: '20px',
            background: 'rgba(33,150,243,0.08)',
            border: '1px solid rgba(33,150,243,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#64b5f6',
          }}>
            ⓘ Manual entries appear in the attendance dashboard and CSV export with
            scanMethod = "manual_entry". Duplicate scans are automatically rejected.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Attendance Dashboard Tab                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <h3 style={{ margin: 0, color: '#a5d6a7', fontSize: '16px', fontWeight: 600 }}>
              Attendance Records
            </h3>
            <button style={S.btnSecondary} onClick={handleExport}>
              ⬇ Export CSV
            </button>
          </div>

          <div style={S.card}>
            {records.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', padding: '48px 0' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '15px' }}>No attendance records yet</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>
                  Start scanning QR codes to populate this list.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>Participant</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Scanned At</th>
                      <th style={S.th}>Method</th>
                      <th style={S.th}>Scanned By</th>
                      <th style={S.th}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <td style={{ ...S.td, color: '#555', width: '40px' }}>{idx + 1}</td>
                        <td style={S.td}>
                          <span style={{ color: '#e0e0e0', fontWeight: 500 }}>
                            {record.participant?.name}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize: '13px' }}>{record.participant?.email}</td>
                        <td style={{ ...S.td, fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {new Date(record.scannedAt).toLocaleString()}
                        </td>
                        <td style={S.td}>
                          <span style={S.badge(record.scanMethod)}>
                            {record.scanMethod === 'qr_scan' ? '📷 QR Scan' : '✏️ Manual'}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize: '13px' }}>
                          {record.scannedBy || '—'}
                        </td>
                        <td style={{ ...S.td, fontSize: '13px', color: '#78909c' }}>
                          {record.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
