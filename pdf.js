const { jsPDF } = window.jspdf;

/* =========================
   CONFIG
========================= */

const PDF_CONFIG = {
  orientation: "portrait",
  unit: "pt",
  format: "letter"
};

const COLORS = {
  green: [0, 77, 20],
  text: [40, 40, 40],
  border: [181, 181, 181],
  labelBg: [249, 249, 249]
};

const PAGE_MARGIN = 50;
const PAGE_CENTER = 306;
const INFO_ROW_H = 22;
const TABLE_ROW_H = 24;
const START_X = 40;
const TABLE_WIDTH = 532;

/* =========================
   HELPERS
========================= */

const toNumber = v => parseFloat(v) || 0;
const getVal = id => document.getElementById(id)?.value || "";

const formatMoney = value =>
  `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

function setFont(pdf, style, size) {
  pdf.setFont("helvetica", style);
  pdf.setFontSize(size);
}

function drawCell(pdf, x, y, w, h, fill = null) {
  if (fill) {
    pdf.setFillColor(...fill);
    pdf.rect(x, y, w, h, "F");
  }
  pdf.rect(x, y, w, h);
}

function drawRightText(pdf, text, x, width, y) {
  pdf.text(String(text ?? ""), x + width - 6, y + 16, {
    align: "right"
  });
}

function drawRowCells(pdf, columns, y, height, fill = null) {
  columns.forEach(col => {
    drawCell(pdf, col.x, y, col.w, height, fill);
  });
}

function getRowDescription(tr) {
  const input = tr.cells[0].querySelector("input");
  return input
    ? input.value.trim()
    : tr.cells[0].textContent.trim();
}

function getRowQty(tr) {
  return tr.querySelector(".qty, .miles")?.value || "";
}

function getRowRate(tr) {
  return (
    tr.querySelector(".provider-rate")?.value ||
    tr.querySelector(".rate")?.value ||
    "Auto"
  );
}

function getRowTotal(tr) {
  return toNumber(
    tr.querySelector(".total")?.value
  );
}

/* =========================
   INFO TABLE
========================= */

function drawInfoTable(pdf, title, rows, y) {
  const x = 40;
  const labelW = 160;
  const valueW = 372;
  const totalW = labelW + valueW;

  pdf.setFillColor(...COLORS.green);
  pdf.setTextColor(255, 255, 255);

  pdf.rect(x, y, totalW, INFO_ROW_H, "F");

  setFont(pdf, "bold", 10);

  pdf.text(
    title,
    x + totalW / 2,
    y + 15,
    { align: "center" }
  );

  y += INFO_ROW_H;

  pdf.setTextColor(...COLORS.text);

  rows.forEach(([label, value]) => {
    pdf.setDrawColor(...COLORS.border);

    drawCell(
      pdf,
      x,
      y,
      labelW,
      INFO_ROW_H,
      COLORS.labelBg
    );

    drawCell(
      pdf,
      x + labelW,
      y,
      valueW,
      INFO_ROW_H
    );

    setFont(pdf, "bold", 9);
    pdf.text(label, x + 6, y + 15);

    setFont(pdf, "normal", 9);
    pdf.text(
      String(value ?? ""),
      x + labelW + 6,
      y + 15
    );

    y += INFO_ROW_H;
  });

  return y + 10;
}

/* =========================
   MAIN
========================= */

function downloadPDF() {
  const pdf = new jsPDF(PDF_CONFIG);

  let y = PAGE_MARGIN;

  pdf.setTextColor(...COLORS.green);

  setFont(pdf, "normal", 22);
  pdf.text(
    "Staff CART Captioner and Interpreter",
    PAGE_CENTER,
    y,
    { align: "center" }
  );

  y += 28;

  setFont(pdf, "normal", 12);
  pdf.text(
    "Service has been rendered",
    PAGE_CENTER,
    y,
    { align: "center" }
  );

  y += 35;

  pdf.setTextColor(...COLORS.text);

  y = drawInfoTable(
    pdf,
    "Assignment Information",
    [
      ["Provider", getVal("providerName")],
      ["Request ID", getVal("requestId")],
      ["Requestor", getVal("requestorName")],
      ["Requestor's Email", getVal("requestorEmail")],
      ["Address", getVal("requestorAddress")],
      ["Service Date", getVal("serviceDate")],
      ["Start Time", getVal("startTime")],
      ["End Time", getVal("endTime")]
    ],
    y
  );

  y = drawInfoTable(
    pdf,
    "Billing Information",
    [
      ["Name", getVal("billingName")],
      ["Company", getVal("billingCompany")],
      ["Address", getVal("billingAddress")],
      ["Email", getVal("billingEmail")]
    ],
    y
  );

  const c1 = TABLE_WIDTH * 0.55;
  const c2 = TABLE_WIDTH * 0.15;
  const c3 = TABLE_WIDTH * 0.15;
  const c4 = TABLE_WIDTH * 0.15;

  const columns = [
    { x: START_X, w: c1 },
    { x: START_X + c1, w: c2 },
    { x: START_X + c1 + c2, w: c3 },
    { x: START_X + c1 + c2 + c3, w: c4 }
  ];

  pdf.setFillColor(...COLORS.green);
  pdf.setTextColor(255, 255, 255);

  drawRowCells(
    pdf,
    columns,
    y,
    TABLE_ROW_H,
    COLORS.green
  );

  setFont(pdf, "bold", 10);

  pdf.text(
    "Description",
    columns[0].x + c1 / 2,
    y + 16,
    { align: "center" }
  );

  pdf.text(
    "Qty",
    columns[1].x + c2 / 2,
    y + 16,
    { align: "center" }
  );

  pdf.text(
    "Rate",
    columns[2].x + c3 / 2,
    y + 16,
    { align: "center" }
  );

  pdf.text(
    "Total",
    columns[3].x + c4 / 2,
    y + 16,
    { align: "center" }
  );

  y += TABLE_ROW_H;

  pdf.setTextColor(...COLORS.text);
  setFont(pdf, "normal", 10);

  let grand = 0;

  document
    .querySelectorAll("#invoiceBody tr")
    .forEach(tr => {
      const desc = getRowDescription(tr);
      const qty = getRowQty(tr);
      const rate = getRowRate(tr);
      const total = getRowTotal(tr);

      grand += total;

      pdf.setDrawColor(...COLORS.border);

      drawRowCells(
        pdf,
        columns,
        y,
        TABLE_ROW_H
      );

      pdf.text(
        desc,
        columns[0].x + 6,
        y + 16
      );

      drawRightText(
        pdf,
        qty,
        columns[1].x,
        c2,
        y
      );

      drawRightText(
        pdf,
        rate,
        columns[2].x,
        c3,
        y
      );

      drawRightText(
        pdf,
        total ? total.toFixed(2) : "",
        columns[3].x,
        c4,
        y
      );

      y += TABLE_ROW_H;
    });

  drawCell(
    pdf,
    START_X,
    y,
    c1 + c2 + c3,
    TABLE_ROW_H
  );

  drawCell(
    pdf,
    columns[3].x,
    y,
    c4,
    TABLE_ROW_H
  );

  setFont(pdf, "bold", 10);

  pdf.text(
    "Grand Total",
    START_X + 6,
    y + 16
  );

  drawRightText(
    pdf,
    formatMoney(grand),
    columns[3].x,
    c4,
    y
  );

  pdf.save("invoice.pdf");
}

/* =========================
   BUTTON
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document
      .getElementById("downloadPdfBtn")
      ?.addEventListener(
        "click",
        downloadPDF
      );
  }
);

window.downloadPDF = downloadPDF;