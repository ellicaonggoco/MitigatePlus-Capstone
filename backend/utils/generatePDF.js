const PDFDocument = require("pdfkit");

const generateActivityLogPDF = (logs) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc
        .fontSize(20)
        .text("MitigatePlus Activity Log Report", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(`Generated on: ${new Date().toLocaleString()}`, {
          align: "center",
        });
      doc.moveDown(2);

      // Table Header
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 50, doc.y, { width: 100 });
      doc.text("User", 150, doc.y, { width: 100 });
      doc.text("Role", 250, doc.y, { width: 80 });
      doc.text("Action", 330, doc.y, { width: 100 });
      doc.text("Details", 430, doc.y, { width: 150 });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
      doc.moveDown(0.5);

      // Table Rows
      doc.font("Helvetica");
      logs.forEach((log) => {
        const y = doc.y;
        doc.text(new Date(log.createdAt).toLocaleDateString(), 50, y, {
          width: 100,
        });
        doc.text(log.userName || "N/A", 150, y, { width: 100 });
        doc.text(log.userRole || "N/A", 250, y, { width: 80 });
        doc.text(log.action || "N/A", 330, y, { width: 100 });
        doc.text(log.details || "N/A", 430, y, { width: 150 });
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateActivityLogPDF };
