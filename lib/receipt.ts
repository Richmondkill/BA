// Client-side receipt generator. Draws a transaction receipt onto a canvas and
// lets the user download it as a PNG or share it via the Web Share API.

export type ReceiptData = {
  reference: string;
  amountLabel: string; // already formatted, e.g. "-$250.00"
  type: string; // "Transfer" | "Funding"
  status: string; // "Completed" | "Pending"
  holder: string;
  fromAccount: string; // "•••• 0081"
  payeeName?: string;
  bank?: string;
  account?: string;
  balanceAfter?: string;
  date: string;
};

const FONT = "Arial, Helvetica, sans-serif";

function drawReceipt(data: ReceiptData): HTMLCanvasElement {
  const scale = 2;
  const W = 560;
  const rows: [string, string][] = [
    ["Reference", data.reference],
    ["Type", data.type],
    ...(data.payeeName ? ([["To", data.payeeName]] as [string, string][]) : []),
    ...(data.bank ? ([["Bank", data.bank]] as [string, string][]) : []),
    ...(data.account ? ([["Account", data.account]] as [string, string][]) : []),
    ["From", data.fromAccount],
    ["Date", data.date],
    ...(data.balanceAfter
      ? ([["Balance after", data.balanceAfter]] as [string, string][])
      : []),
  ];
  const H = 300 + rows.length * 46 + 90;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // header band
  ctx.fillStyle = "#ec111a";
  ctx.fillRect(0, 0, W, 110);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText("Scotiabank", 32, 52);
  ctx.font = `14px ${FONT}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText("Transaction Receipt", 32, 78);
  ctx.globalAlpha = 1;

  // success check (top-right)
  ctx.beginPath();
  ctx.arc(W - 52, 55, 22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W - 62, 55);
  ctx.lineTo(W - 55, 63);
  ctx.lineTo(W - 42, 47);
  ctx.stroke();

  // amount
  ctx.textAlign = "center";
  ctx.fillStyle = "#101828";
  ctx.font = `bold 40px ${FONT}`;
  ctx.fillText(data.amountLabel, W / 2, 185);
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = data.status === "Completed" ? "#12b76a" : "#f04438";
  ctx.fillText(data.status, W / 2, 214);
  ctx.textAlign = "left";

  // rows
  let y = 272;
  for (const [k, v] of rows) {
    ctx.fillStyle = "#667085";
    ctx.font = `13px ${FONT}`;
    ctx.fillText(k, 32, y);
    ctx.fillStyle = "#101828";
    ctx.font = `600 14px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(v, W - 32, y);
    ctx.textAlign = "left";
    ctx.strokeStyle = "#eef0f3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, y + 16);
    ctx.lineTo(W - 32, y + 16);
    ctx.stroke();
    y += 46;
  }

  // footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#98a2b3";
  ctx.font = `12px ${FONT}`;
  ctx.fillText("Simulated transaction • Keep this receipt for your records", W / 2, H - 40);
  ctx.textAlign = "left";

  return canvas;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render"))), "image/png");
  });
}

export async function downloadReceipt(data: ReceiptData) {
  const blob = await toBlob(drawReceipt(data));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${data.reference.replace(/[^A-Za-z0-9]/g, "")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ShareResult = "shared" | "copied" | "unsupported";

export async function shareReceipt(data: ReceiptData): Promise<ShareResult> {
  const text = `Scotiabank receipt ${data.reference}\n${data.type} ${data.amountLabel}${
    data.payeeName ? ` to ${data.payeeName}` : ""
  }\n${data.date} • ${data.status}`;

  try {
    const blob = await toBlob(drawReceipt(data));
    const file = new File([blob], `receipt-${data.reference}.png`, { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: "Scotiabank receipt", text });
      return "shared";
    }
    if (nav.share) {
      await nav.share({ title: "Scotiabank receipt", text });
      return "shared";
    }
  } catch {
    // fall through to clipboard
  }

  try {
    await navigator.clipboard?.writeText(text);
    return "copied";
  } catch {
    return "unsupported";
  }
}
