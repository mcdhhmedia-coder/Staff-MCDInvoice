const { jsPDF } = window.jspdf;

/* =========================
   HELPERS
========================= */

const toNumber = v => parseFloat(v) || 0;

const getVal = id =>
    document.getElementById(id)?.value || "";

const formatMoney = v =>
    `$${Number(v).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

/* =========================
   MAIN
========================= */

function downloadPDF() {

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
    });

    const PAGE_MARGIN = 50;
    const PAGE_HEIGHT = pdf.internal.pageSize.height;

    let y = PAGE_MARGIN;

    const COLORS = {
        green: [0, 77, 20],
        text: [40, 40, 40],
        border: [181, 181, 181]
    };

    const INFO_STYLE = {
        border: [181, 181, 181],
        green: [0, 77, 20],
        labelBg: [249, 249, 249],
        rowH: 22
    };

    const drawInfoTable = (title, rows) => {

        const x = 40;
        const labelW = 160;
        const valueW = 372;
        const h = INFO_STYLE.rowH;
        const totalW = labelW + valueW;

        // HEADER (like your .info-grid th)
        pdf.setFillColor(...INFO_STYLE.green);
        pdf.setTextColor(255, 255, 255);

        pdf.rect(x, y, totalW, h, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);

        pdf.text(title, x + totalW / 2, y + 15, { align: "center" });

        y += h;

        pdf.setTextColor(40, 40, 40);

        rows.forEach(([label, value]) => {

            pdf.setDrawColor(...INFO_STYLE.border);

            // label cell (matches td:first-child)
            pdf.setFillColor(...INFO_STYLE.labelBg);
            pdf.rect(x, y, labelW, h, "F");
            pdf.rect(x, y, labelW, h);
            pdf.rect(x + labelW, y, valueW, h);

            // label text
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.text(label, x + 6, y + 15);

            // value text
            pdf.setFont("helvetica", "normal");
            pdf.text(value || "", x + labelW + 6, y + 15);

            y += h;
        });

        y += 10;
    };


    const PAGE_CENTER = 306;

    /* =========================
       HEADER (MATCH STYLE 2)
    ========================= */

    pdf.setTextColor(...COLORS.green);
    pdf.setFontSize(22);
    pdf.text("Staff CART Captioner and Interpreter", PAGE_CENTER, y, { align: "center" });

    y += 28;

    pdf.setFontSize(12);
    pdf.text("Service has been rendered", PAGE_CENTER, y, { align: "center" });

    y += 35;

    pdf.setTextColor(...COLORS.text);

/* =========================
   ASSIGNMENT (FULL WIDTH)
========================= */

drawInfoTable("Assignment Information", [
    ["Provider", getVal("providerName")],
    ["Request ID", getVal("requestId")],
    ["Service Date", getVal("serviceDate")],
    ["Start Time", getVal("startTime")],
    ["End Time", getVal("endTime")]
]);

/* =========================
   REQUESTER + BILLING SIDE BY SIDE
========================= */

const topY = y;

const drawHalfTable = (title, rows, x) => {

    const labelW = 75;
    const valueW = 181;
    const rowH = 22;
    const totalW = labelW + valueW;

    let localY = topY;

    // Header
    pdf.setFillColor(0, 70, 20);
    pdf.setTextColor(255, 255, 255);

    pdf.rect(x, localY, totalW, rowH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text(
        title,
        x + totalW / 2,
        localY + 15,
        { align: "center" }
    );

    localY += rowH;

    pdf.setTextColor(40, 40, 40);

    rows.forEach(([label, value]) => {

        pdf.setFillColor(249, 249, 249);

        pdf.rect(x, localY, labelW, rowH, "F");
        pdf.rect(x, localY, labelW, rowH);

        pdf.rect(x + labelW, localY, valueW, rowH);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(label, x + 4, localY + 15);

        pdf.setFont("helvetica", "normal");
        pdf.text(value || "", x + labelW + 4, localY + 15);

        localY += rowH;
    });

    return localY;
};

const requesterBottom = drawHalfTable(
    "Requester Information",
    [
        ["Name", getVal("requesterName")],
        ["Company", getVal("requesterCompany")],
        ["Address", getVal("requesterAddress1")],
        ["Address 2", getVal("requesterAddress2")],
        ["Email", getVal("requesterEmail")]
    ],
    40
);

const billingBottom = drawHalfTable(
    "Billing Information",
    [
        ["Name", getVal("billingName")],
        ["Company", getVal("billingCompany")],
        ["Address", getVal("billingAddress1")],
        ["Address 2", getVal("billingAddress2")],
        ["Email", getVal("billingEmail")]
    ],
    316
);

y = Math.max(requesterBottom, billingBottom) + 15;

    /* =========================
       TABLE SETUP (STYLE 2)
    ========================= */

    const startX = 40;
    const width = 532;

    const c1 = width * 0.55;
    const c2 = width * 0.15;
    const c3 = width * 0.15;
    const c4 = width * 0.15;

    const x = {
        desc: startX,
        qty: startX + c1,
        rate: startX + c1 + c2,
        total: startX + c1 + c2 + c3
    };

    const h = 24;

    /* =========================
       TABLE HEADER
    ========================= */

    pdf.setFillColor(...COLORS.green);
    pdf.setTextColor(255, 255, 255);

    pdf.rect(x.desc, y, c1, h, "F");
    pdf.rect(x.qty, y, c2, h, "F");
    pdf.rect(x.rate, y, c3, h, "F");
    pdf.rect(x.total, y, c4, h, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text("Description", x.desc + c1 / 2, y + 16, { align: "center" });
    pdf.text("Qty", x.qty + c2 / 2, y + 16, { align: "center" });
    pdf.text("Rate", x.rate + c3 / 2, y + 16, { align: "center" });
    pdf.text("Total", x.total + c4 / 2, y + 16, { align: "center" });

    y += h;

/* =========================
   ROWS
========================= */

pdf.setTextColor(...COLORS.text);
pdf.setFont("helvetica", "normal");

let grand = 0;

const rows = document.querySelectorAll("#invoiceBody tr");

rows.forEach(tr => {

    // Description
    let desc = "";
    const descInput = tr.cells[0].querySelector("input");

    if (descInput) {
        desc = descInput.value.trim();
    } else {
        desc = tr.cells[0].textContent.trim();
    }

    // Qty
    const qtyInput = tr.querySelector(".qty, .miles");
    const qty = qtyInput ? qtyInput.value : "";

    // Rate
    let rate = "";
    const providerRate = tr.querySelector(".provider-rate");
    const rateInput = tr.querySelector(".rate");

    if (providerRate) {
        rate = providerRate.value;
    } else if (rateInput) {
        rate = rateInput.value;
    } else {
        rate = "Auto";
    }

    // Total
    const totalInput = tr.querySelector(".total");
    const totalText = totalInput ? totalInput.value : "";
    const total = toNumber(totalText);

    grand += total;

    pdf.setDrawColor(...COLORS.border);

    pdf.rect(x.desc, y, c1, h);
    pdf.rect(x.qty, y, c2, h);
    pdf.rect(x.rate, y, c3, h);
    pdf.rect(x.total, y, c4, h);

    pdf.text(desc, x.desc + 6, y + 16);

    pdf.text(String(qty), x.qty + c2 - 6, y + 16, {
        align: "right"
    });

    pdf.text(String(rate), x.rate + c3 - 6, y + 16, {
        align: "right"
    });

    pdf.text(
        total ? total.toFixed(2) : "",
        x.total + c4 - 6,
        y + 16,
        {
            align: "right"
        }
    );

    y += h;
});

/* =========================
   GRAND TOTAL
========================= */

pdf.setDrawColor(...COLORS.border);

pdf.rect(startX, y, c1 + c2 + c3, h);
pdf.rect(x.total, y, c4, h);

pdf.setFont("helvetica", "bold");

pdf.text("Grand Total", startX + 6, y + 16);

pdf.text(
    formatMoney(grand),
    x.total + c4 - 6,
    y + 16,
    { align: "right" }
);

pdf.save("invoice.pdf");

}  

/* =========================
   BUTTON
========================= */

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("downloadPdfBtn")
        ?.addEventListener("click", downloadPDF);
});