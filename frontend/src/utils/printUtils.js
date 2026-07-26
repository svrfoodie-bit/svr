/**
 * Opens a styled print window for a given HTML string.
 * @param {string} html - Complete inner HTML to print
 * @param {string} title - Window/document title
 */
import { getCompanyName } from '../context/companyStore';

const openPrintWindow = (html, title = getCompanyName()) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Please allow pop-ups for this site to print.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 24px; }
    .page { max-width: 780px; margin: 0 auto; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .company-name { font-size: 22px; font-weight: 700; color: #2563eb; }
    .company-sub  { font-size: 11px; color: #555; margin-top: 2px; }
    .doc-title    { font-size: 18px; font-weight: 700; text-align: right; color: #1e3a8a; }
    .doc-meta     { font-size: 11px; color: #555; text-align: right; margin-top: 4px; }
    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .info-box  { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .info-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px; }
    .info-row  { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .info-label { color: #64748b; }
    .info-value { font-weight: 600; }
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #1e3a8a; color: #fff; padding: 9px 12px; text-align: left; font-size: 12px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .text-right { text-align: right; }
    /* Totals */
    .totals { margin-left: auto; width: 320px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.grand { background: #1e3a8a; color: #fff; font-size: 15px; font-weight: 700; }
    .totals-row.paid   { background: #f0fdf4; color: #166534; font-weight: 600; }
    .totals-row.balance{ background: #fef9c3; color: #854d0e; font-weight: 600; }
    /* Badge */
    .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge-green  { background: #dcfce7; color: #166534; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-red    { background: #fee2e2; color: #991b1b; }
    .badge-blue   { background: #dbeafe; color: #1e40af; }
    /* Footer */
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    .sig-box { width: 180px; text-align: center; }
    .sig-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 4px; font-size: 11px; color: #64748b; }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">
${html}
</div>
<div style="text-align:center;margin-top:20px;">
  <button onclick="window.print()" style="padding:10px 32px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
    🖨️ Print
  </button>
  &nbsp;
  <button onclick="window.close()" style="padding:10px 24px;background:#e5e7eb;color:#374151;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
    Close
  </button>
</div>
</body>
</html>`);
  win.document.close();
};

/**
 * Print a Sales Order invoice.
 * @param {object} order - Sales order object
 * @param {object} companyInfo - { companyName, ownerName, phone, address }
 */
export const printSalesInvoice = (order, companyInfo = {}) => {
  const company = companyInfo.companyName || getCompanyName();
  const address = companyInfo.address || '';
  const phone   = companyInfo.phone || '';

  const statusBadge = (s) => {
    if (s === 'Paid')    return `<span class="badge badge-green">${s}</span>`;
    if (s === 'Partial') return `<span class="badge badge-yellow">${s}</span>`;
    return `<span class="badge badge-red">${s}</span>`;
  };

  const items = Array.isArray(order.lineItems) ? order.lineItems : [];

  const itemRows = items.map(item => `
    <tr>
      <td>${item.grade || item.itemName || '-'}</td>
      <td class="text-right">${parseFloat(item.quantity || 0).toFixed(2)} KG</td>
      <td class="text-right">₹${parseFloat(item.rate || 0).toLocaleString('en-IN')}</td>
      <td class="text-right">₹${(parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const outstanding = parseFloat(order.outstandingAmount || 0);

  const html = `
    <div class="header">
      <div>
        <div class="company-name">${company}</div>
        <div class="company-sub">Cashew Processing &amp; Sales</div>
        ${address ? `<div class="company-sub">${address}</div>` : ''}
        ${phone   ? `<div class="company-sub">Ph: ${phone}</div>` : ''}
      </div>
      <div>
        <div class="doc-title">SALES INVOICE</div>
        <div class="doc-meta">Order No: <strong>${order.orderNumber || '-'}</strong></div>
        <div class="doc-meta">Date: <strong>${new Date(order.date).toLocaleDateString('en-IN')}</strong></div>
        <div class="doc-meta">Status: ${statusBadge(order.paymentStatus)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Bill To</h4>
        <div class="info-row"><span class="info-value" style="font-size:14px">${order.customerName || '-'}</span></div>
        ${order.customerArea ? `<div class="info-row"><span class="info-label">Area:</span><span class="info-value">${order.customerArea}</span></div>` : ''}
        ${order.customerContact ? `<div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${order.customerContact}</span></div>` : ''}
      </div>
      <div class="info-box">
        <h4>Order Info</h4>
        <div class="info-row"><span class="info-label">Payment Type:</span><span class="info-value">${order.paymentType || 'Cash'}</span></div>
        <div class="info-row"><span class="info-label">Customer Type:</span><span class="info-value">${order.customerType || '-'}</span></div>
        ${order.remarks ? `<div class="info-row"><span class="info-label">Remarks:</span><span class="info-value">${order.remarks}</span></div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Grade / Item</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Rate / KG</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">No items</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row grand">
        <span>Order Total</span>
        <span>₹${parseFloat(order.orderTotal || 0).toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row paid">
        <span>Amount Paid</span>
        <span>₹${parseFloat(order.paidAmount || 0).toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row balance">
        <span>Balance Due</span>
        <span>₹${outstanding.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <div class="footer">
      <div>
        <div>Generated: ${new Date().toLocaleString('en-IN')}</div>
        <div>${company} Management System</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Authorised Signature</div>
      </div>
    </div>`;

  openPrintWindow(html, `Invoice - ${order.orderNumber}`);
};

/**
 * Print a Job Work slip.
 * @param {object} job - Job work object
 * @param {object} companyInfo
 */
export const printJobWorkSlip = (job, companyInfo = {}) => {
  const company = companyInfo.companyName || getCompanyName();

  const sentQty   = parseFloat(job.quantitySent || 0);
  const recvQty   = parseFloat(job.quantityReceived || 0);
  const rate      = parseFloat(job.ratePerKg || 0);
  const lossKg    = Math.max(0, sentQty - recvQty).toFixed(2);
  const lossPct   = sentQty > 0 ? ((sentQty - recvQty) / sentQty * 100).toFixed(1) : '0.0';
  const total     = (recvQty * rate).toFixed(2);
  const paid      = parseFloat(job.totalPaid || 0);
  const balance   = parseFloat(total) - paid;

  const statusBadge = (s) => {
    if (s === 'Completed')  return `<span class="badge badge-green">${s}</span>`;
    if (s === 'In Progress') return `<span class="badge badge-blue">${s}</span>`;
    return `<span class="badge badge-red">${s}</span>`;
  };

  const html = `
    <div class="header">
      <div>
        <div class="company-name">${company}</div>
        <div class="company-sub">Cashew Processing &amp; Sales</div>
      </div>
      <div>
        <div class="doc-title">JOB WORK SLIP</div>
        <div class="doc-meta">Date: <strong>${new Date(job.jobDate).toLocaleDateString('en-IN')}</strong></div>
        <div class="doc-meta">Status: ${statusBadge(job.status)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Worker Details</h4>
        <div class="info-row"><span class="info-label">Worker Name:</span><span class="info-value">${job.jobWorkerName || '-'}</span></div>
        <div class="info-row"><span class="info-label">Cashew Type:</span><span class="info-value">${job.cashewType || '-'}</span></div>
      </div>
      <div class="info-box">
        <h4>Job Summary</h4>
        <div class="info-row"><span class="info-label">Qty Sent:</span><span class="info-value">${sentQty.toFixed(2)} KG</span></div>
        <div class="info-row"><span class="info-label">Qty Received:</span><span class="info-value">${recvQty.toFixed(2)} KG</span></div>
        <div class="info-row"><span class="info-label">Loss:</span><span class="info-value" style="color:#dc2626">${lossKg} KG (${lossPct}%)</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Rate / KG</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Processing Charges — ${job.cashewType || 'Cashew'}</td>
          <td class="text-right">${recvQty.toFixed(2)} KG</td>
          <td class="text-right">₹${rate.toLocaleString('en-IN')}</td>
          <td class="text-right">₹${parseFloat(total).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row grand">
        <span>Total Amount</span>
        <span>₹${parseFloat(total).toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row paid">
        <span>Amount Paid</span>
        <span>₹${paid.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row balance">
        <span>Balance Due</span>
        <span>₹${Math.abs(balance).toLocaleString('en-IN')}</span>
      </div>
    </div>

    ${job.remarks ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;">
      <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Remarks</span>
      <p style="margin-top:4px;">${job.remarks}</p>
    </div>` : ''}

    <div class="footer">
      <div>
        <div>Generated: ${new Date().toLocaleString('en-IN')}</div>
        <div>${company} Management System</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Worker Signature</div>
      </div>
    </div>`;

  openPrintWindow(html, `Job Work Slip - ${job.jobWorkerName}`);
};

/**
 * Print a Raw Purchase receipt.
 */
export const printPurchaseReceipt = (purchase, companyInfo = {}) => {
  const company = companyInfo.companyName || getCompanyName();
  const total   = parseFloat(purchase.totalAmount || 0);
  const paid    = parseFloat(purchase.totalPaid || purchase.paidAmount || 0);
  const balance = total - paid;

  const statusBadge = (s) => {
    if (s === 'Paid')    return `<span class="badge badge-green">${s}</span>`;
    if (s === 'Partial') return `<span class="badge badge-yellow">${s}</span>`;
    return `<span class="badge badge-red">${s}</span>`;
  };

  const html = `
    <div class="header">
      <div>
        <div class="company-name">${company}</div>
        <div class="company-sub">Cashew Processing &amp; Sales</div>
      </div>
      <div>
        <div class="doc-title">PURCHASE RECEIPT</div>
        <div class="doc-meta">Date: <strong>${new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</strong></div>
        <div class="doc-meta">Status: ${statusBadge(purchase.paymentStatus)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Supplier</h4>
        <div class="info-row"><span class="info-value" style="font-size:14px">${purchase.supplierName || '-'}</span></div>
        ${purchase.supplierContact ? `<div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${purchase.supplierContact}</span></div>` : ''}
        ${purchase.supplierLocation ? `<div class="info-row"><span class="info-label">Location:</span><span class="info-value">${purchase.supplierLocation}</span></div>` : ''}
      </div>
      <div class="info-box">
        <h4>Purchase Details</h4>
        <div class="info-row"><span class="info-label">Quality:</span><span class="info-value">${purchase.rawQuality || '-'}</span></div>
        <div class="info-row"><span class="info-label">Quantity:</span><span class="info-value">${parseFloat(purchase.quantityKg || 0).toFixed(2)} KG</span></div>
        <div class="info-row"><span class="info-label">Rate:</span><span class="info-value">₹${parseFloat(purchase.pricePerKg || 0).toLocaleString('en-IN')} / KG</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Item</th><th class="text-right">Qty (KG)</th><th class="text-right">Rate</th><th class="text-right">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Raw Cashew — ${purchase.rawQuality || '-'}</td>
          <td class="text-right">${parseFloat(purchase.quantityKg || 0).toFixed(2)}</td>
          <td class="text-right">₹${parseFloat(purchase.pricePerKg || 0).toLocaleString('en-IN')}</td>
          <td class="text-right">₹${total.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row grand"><span>Total Amount</span><span>₹${total.toLocaleString('en-IN')}</span></div>
      <div class="totals-row paid"><span>Amount Paid</span><span>₹${paid.toLocaleString('en-IN')}</span></div>
      <div class="totals-row balance"><span>Balance Due</span><span>₹${balance.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="footer">
      <div><div>Generated: ${new Date().toLocaleString('en-IN')}</div><div>${company} Management System</div></div>
      <div class="sig-box"><div class="sig-line">Authorised Signature</div></div>
    </div>`;

  openPrintWindow(html, `Purchase Receipt - ${purchase.supplierName}`);
};
