import PDFDocument from 'pdfkit';

export function clientSummaryPDF(res, client) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="client_${client.plateNumber}.pdf"`);

  const doc = new PDFDocument();
  doc.pipe(res);

  doc.fontSize(18).text('Client Vehicle Summary', { underline: true }).moveDown();
  [
    `Names: ${client.names}`,
    `Car Type: ${client.carType}`,
    `Car Make: ${client.carMake}`,
    `Plate Number: ${client.plateNumber}`,
    `Issues: ${client.issues || '-'}`,
    `Recovered By: ${client.recoveredBy || '-'}`,
    `Payment: ${client.payment}`,
    `Status: ${client.status}`,
    `Proforma: ${client.proformaPath || '-'}`
  ].forEach((line) => doc.fontSize(12).text(line));

  doc.end();
}
