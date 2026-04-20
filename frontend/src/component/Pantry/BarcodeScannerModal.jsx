import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const isNotFoundScanError = (err) =>
  err && (err.name === "NotFoundException" || /not found/i.test(String(err.message || "")));

const BarcodeScannerModal = ({ open, onClose, onDecoded }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const onDecodedRef = useRef(onDecoded);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  onDecodedRef.current = onDecoded;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      try {
        readerRef.current?.reset();
      } catch {
        /* ignore */
      }
      readerRef.current = null;
      setError(null);
      setScanning(false);
      return;
    }

    let cancelled = false;

    const stop = () => {
      try {
        readerRef.current?.reset();
      } catch {
        /* ignore */
      }
      readerRef.current = null;
      if (!cancelled) setScanning(false);
    };

    const start = async () => {
      setError(null);
      setScanning(true);
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      await new Promise((r) => requestAnimationFrame(() => r()));
      const el = videoRef.current;
      if (!el || cancelled) {
        stop();
        return;
      }

      try {
        await reader.decodeFromVideoDevice(undefined, el, (result, err) => {
          if (cancelled) return;
          if (result) {
            const text = result.getText?.() || String(result);
            if (text) {
              stop();
              onDecodedRef.current?.(text.trim());
              onCloseRef.current?.();
            }
          } else if (err && !isNotFoundScanError(err)) {
            setError(err.message || "Scan error");
          }
        });
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.message || "Could not access camera. Allow permission or use HTTPS (localhost is OK).",
          );
          stop();
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-blinkit-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-blinkit-border">
          <h3 className="text-sm font-bold text-blinkit-dark">Scan barcode</h3>
          <button
            type="button"
            onClick={() => {
              try {
                readerRef.current?.reset();
              } catch {
                /* ignore */
              }
              readerRef.current = null;
              onClose?.();
            }}
            className="text-blinkit-gray hover:text-blinkit-dark text-sm font-semibold"
          >
            Close
          </button>
        </div>
        <div className="relative bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {scanning && !error && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-white/90">
              Align barcode in frame
            </div>
          )}
        </div>
        {error && (
          <p className="px-4 py-3 text-xs text-red-600 bg-red-50">{error}</p>
        )}
        <p className="px-4 py-3 text-[11px] text-blinkit-gray">
          Product must exist in the catalog with this code in{" "}
          <span className="font-semibold">sku</span> or{" "}
          <span className="font-semibold">barcodeVariants</span>.
        </p>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
