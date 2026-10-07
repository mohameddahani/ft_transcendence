"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ScanLine,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => Promise<void>;
  isProcessing: boolean;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  isProcessing,
}: QrScannerModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Initialize Camera Scanner when modal is open and on 'camera' tab
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen && activeTab === "camera") {
      setCameraError(null);
      const scannerElementId = "interactive-qr-reader";

      // Small delay to ensure DOM element is mounted
      const timer = setTimeout(async () => {
        try {
          const element = document.getElementById(scannerElementId);
          if (!element) return;

          html5QrCode = new Html5Qrcode(scannerElementId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            async (decodedText) => {
              if (isScanningRef.current) return;
              isScanningRef.current = true;

              try {
                // Pause scanner on detect
                await html5QrCode?.pause(true);
                await onScanSuccess(decodedText.trim());
              } finally {
                setTimeout(() => {
                  isScanningRef.current = false;
                  try {
                    html5QrCode?.resume();
                  } catch {
                    // ignore
                  }
                }, 1500);
              }
            },
            () => {
              // ignore frame read misses
            }
          );

          setIsCameraActive(true);
        } catch (err: unknown) {
          const errMessage =
            err instanceof Error ? err.message : "Unable to access device camera";
          setCameraError(errMessage);
          setIsCameraActive(false);
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          try {
            html5QrCode
              .stop()
              .then(() => html5QrCode?.clear())
              .catch(() => {});
          } catch {
            // ignore
          }
        }
        setIsCameraActive(false);
      };
    }
  }, [isOpen, activeTab, onScanSuccess]);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || isProcessing) return;
    await onScanSuccess(manualToken.trim());
    setManualToken("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 p-6 z-10 animate-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl primary-gradient text-white flex items-center justify-center shadow-xs">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                {t("scanQrCheckIn") || "Scan Member QR Pass"}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Hold member QR pass in front of camera or scanner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Camera vs USB Scanner/Manual */}
        <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "camera"
                ? "bg-surface-bright text-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t("liveCamera") || "Live Camera"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "manual"
                ? "bg-surface-bright text-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{t("usbOrManual") || "USB / Manual Token"}</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === "camera" && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black/90 aspect-square flex flex-col items-center justify-center border border-outline-variant/60 shadow-inner">
              {/* html5-qrcode target div */}
              <div id="interactive-qr-reader" className="w-full h-full" />

              {/* Scanning visual overlay box */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary/80 rounded-2xl relative animate-pulse shadow-lg shadow-primary/20">
                    <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 text-white z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs font-bold">Verifying QR Token...</p>
                </div>
              )}

              {/* Camera Error / No permission state */}
              {cameraError && (
                <div className="p-6 text-center space-y-3 z-10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Camera Offline</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Please allow camera permission or switch to the USB scanner tab to enter the token.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-95 transition-opacity"
                  >
                    Switch to Manual / USB
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-on-surface-variant">
              💡 Position member QR pass clearly inside the viewfinder.
            </p>
          </div>
        )}

        {/* Tab 2: USB Scanner / Keyboard Input */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5 text-xs">
              <strong className="text-on-surface font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Handheld USB Scanner Ready
              </strong>
              <p className="text-on-surface-variant leading-relaxed text-[11px]">
                If using a handheld USB barcode gun, click inside the input below and pull the scanner trigger. It will auto-submit.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">
                {t("qrTokenString") || "QR Token / Member Pass Code"}
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. 8f14e45fceea167a5a36dedd4bea2543"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-on-surface-variant/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!manualToken.trim() || isProcessing}
                className="px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t("validateAndCheckIn") || "Validate & Check In"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
