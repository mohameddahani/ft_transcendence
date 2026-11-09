"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  ScanLine,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";

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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Initialize Camera Scanner when modal is open
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen) {
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
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md toota-card border border-border/40 p-6 sm:p-7 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-toota-inner flex items-center justify-center text-toota-ink border border-border/40 shrink-0 shadow-inner">
              <ScanLine className="size-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold tracking-tight text-toota-ink">
                  {t("scanQrCheckIn", "Scan Member QR Pass")}
                </h3>
                <span className="font-mono text-xs text-toota-muted tabular-nums">
                  / {t("qrCheckIn", "Live Scanner")}
                </span>
              </div>
              <p className="text-xs text-toota-muted mt-0.5">
                {t("holdQrInFrontOfCamera", "Hold member QR pass in front of camera")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Live Camera Scanner Viewport */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black/95 aspect-square flex flex-col items-center justify-center border border-border/40 shadow-inner">
            {/* html5-qrcode target div */}
            <div id="interactive-qr-reader" className="w-full h-full" />

            {/* Modern Targeting Reticle */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-52 relative">
                  <span className="absolute top-0 left-0 size-5 border-t-2 border-l-2 border-[#a3e635] rounded-tl-lg" />
                  <span className="absolute top-0 right-0 size-5 border-t-2 border-r-2 border-[#a3e635] rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 size-5 border-b-2 border-l-2 border-[#a3e635] rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 size-5 border-b-2 border-r-2 border-[#a3e635] rounded-br-lg" />
                </div>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 text-white z-20">
                <Loader2 className="size-7 animate-spin text-[#a3e635]" />
                <p className="text-xs font-mono font-medium tracking-wide">
                  {t("verifyingQrToken", "Verifying token...")}
                </p>
              </div>
            )}

            {/* Camera Error / No permission state */}
            {cameraError && (
              <div className="p-6 text-center space-y-3 z-10">
                <div className="size-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {t("cameraOffline", "Camera Offline")}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    {t("cameraPermissionPrompt", "Camera permission was denied or device is unavailable.")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="toota-pill h-9 px-4 text-xs font-semibold border-white/20 text-white hover:bg-white/10"
                >
                  {t("close", "Close")}
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-toota-muted font-mono">
            {t("positionQrGuide", "Align the QR code within the frame to automatically scan.")}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="toota-pill w-full h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
          >
            {t("cancel", "Cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
