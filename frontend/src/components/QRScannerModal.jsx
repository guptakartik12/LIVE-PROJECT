import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, Keyboard, AlertCircle } from 'lucide-react';

export const QRScannerModal = ({ onScanSuccess, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'manual'
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (activeMode !== 'camera') return;

    let scannerInstance = null;
    try {
      scannerInstance = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scannerInstance.render(
        (decodedText) => {
          if (scannerInstance) {
            scannerInstance.clear().catch(() => {});
          }
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Continuous scan frame error, silently ignore until successful decode
        }
      );
      scannerRef.current = scannerInstance;
    } catch (err) {
      console.warn('QR camera scanner initialization failed:', err);
      setScanError('Camera permission not granted or camera unavailable. You can enter Pass ID manually.');
      setActiveMode('manual');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [activeMode, onScanSuccess]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-elevated border border-surface-border overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-sm tracking-wide">Optical QR Pass Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode('camera')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'camera'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-surface-muted hover:text-primary'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>
            <button
              onClick={() => setActiveMode('manual')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'manual'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-surface-muted hover:text-primary'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual Pass ID</span>
            </button>
          </div>

          {activeMode === 'camera' ? (
            <div className="space-y-3">
              <div
                id="qr-reader-container"
                className="w-full bg-slate-900 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center text-white text-xs"
              >
                <span>Initializing optical camera feed...</span>
              </div>
              <p className="text-[11px] text-center text-surface-muted">
                Align the digital parking pass QR code inside the camera viewfinder frame.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Digital Pass ID (e.g. PK-1001)</span>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="PK-XXXX"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono uppercase focus:outline-none focus:border-secondary"
                  autoFocus
                />
              </label>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-xs shadow-sm transition-colors"
              >
                Verify & Authorize
              </button>
            </form>
          )}

          {scanError && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
