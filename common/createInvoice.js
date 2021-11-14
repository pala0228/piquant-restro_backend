const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require('path');

module.exports = createInvoice = (invoice, path) => {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc, invoice); // writes header information
  generateCustomerInformation(doc, invoice); // writes customer information
  generateInvoiceTable(doc, invoice); // writes purchased items information
  generateFooter(doc); // writes footer information

  doc.end();
  doc.pipe(fs.createWriteStream(path)); // writes all the data into file path
}

/**
 * Function to write header information
 */
const generateHeader = (doc, invoice) => {
  const imagePath = path.join(__dirname, '..', '/images/invoice-logo.png');
  doc
    .image(imagePath, 45, 25, { width: 90 })
    .fillColor("#444444")
    .fontSize(20)
    .text(invoice.restaurantName, 200, 50, { align: "right" })
    .fontSize(8)
    .text(invoice.restaurantSubTitle, 200, 70, { align: "right" })
    .fontSize(10)
    .text(invoice.restaurantAddress, 200, 90, { align: "right" })
    .moveDown();
}

/**
 * Function to write user information
 */
const generateCustomerInformation = (doc, invoice) => {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185); // writes horizental row

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(invoice.createdOn), 150, customerInformationTop + 15)
    .text("Balance Due:", 50, customerInformationTop + 30)
    .text(
      formatCurrency(invoice.subtotal - invoice.paid),
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 300, customerInformationTop)
    .font("Helvetica")
    .text(
      invoice.shipping.email +
      ", " +
      invoice.shipping.contactNumber +
      ".",
      300,
      customerInformationTop + 15)
    .font("Helvetica")
    .text(invoice.shipping.address, 300, customerInformationTop + 30)
    .moveDown();

  generateHr(doc, 252);
}

/**
 * Function to write purchased items information
 */
const generateInvoiceTable = (doc, invoice) => {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item Name",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.itemName,
      formatCurrency(item.totalItemsCost / item.quantity),
      item.quantity,
      formatCurrency(item.totalItemsCost)
    );

    generateHr(doc, position + 20);
  }

  const gstPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    gstPosition,
    "",
    "GST Charges",
    "",
    formatCurrency(invoice.GST)
  );

  const subtotalPosition = gstPosition + 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "Paid To Date",
    "",
    formatCurrency(invoice.paid)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    duePosition,
    "",
    "Balance Due",
    "",
    formatCurrency(invoice.subtotal - invoice.paid)
  );
  doc.font("Helvetica");
}

/**
 * Function to write footer information
 */
const generateFooter = (doc) => {
  doc
    .fontSize(10)
    .text(
      "We would love to see you again. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

const generateTableRow = (
  doc,
  y,
  item,
  unitCost,
  quantity,
  lineTotal
) => {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

const generateHr = (doc, y) => {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

const formatCurrency = (cents) => {
  return '$' + (cents).toFixed(2);
}

const formatDate = (createdOn) => {
  let date = new Date(createdOn);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + "/" + month + "/" + year;
}
