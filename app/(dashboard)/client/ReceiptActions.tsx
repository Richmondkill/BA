"use client";

import { useState } from "react";
import { downloadReceipt, shareReceipt, type ReceiptData } from "@/lib/receipt";
import { DownloadIcon, PaperPlaneIcon } from "@/icons";

export default function ReceiptActions({ data }: { data: ReceiptData }) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onShare() {
    setBusy(true);
    const r = await shareReceipt(data);
    setBusy(false);
    if (r === "copied") setNote("Receipt details copied to clipboard.");
    else if (r === "unsupported") setNote("Sharing isn't supported on this device.");
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => downloadReceipt(data)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          <DownloadIcon />
          Download
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          <PaperPlaneIcon />
          Share
        </button>
      </div>
      {note && (
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{note}</p>
      )}
    </div>
  );
}
