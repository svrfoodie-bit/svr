const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const ExportTemplate = require('../models/ExportTemplate.model');
const Settings = require('../models/Settings.model');

class ExportService {
  constructor() {
    // Create exports directory if it doesn't exist
    this.exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Generate Excel file from data
   */
  async generateExcel(data, columns, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

      // Set up columns
      worksheet.columns = columns.map(col => ({
        header: col.header || col,
        key: col.key || col.toLowerCase().replace(/\s+/g, '_'),
        width: col.width || 15
      }));

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(row);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `${options.module || 'export'}_${timestamp}_${Date.now()}.xlsx`;
      const filePath = path.join(this.exportsDir, fileName);

      // Write to file
      await workbook.xlsx.writeFile(filePath);

      const stats = fs.statSync(filePath);

      logger.info(`Excel file generated: ${fileName}`);

      return {
        filePath,
        fileName,
        fileSize: stats.size,
        recordCount: data.length
      };
    } catch (error) {
      logger.error('Failed to generate Excel file:', error);
      throw error;
    }
  }

  /**
   * Generate PDF file from data
   */
  async generatePDF(data, columns, options = {}) {
    try {
      const companyName = await Settings.getCompanyName();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `${options.module || 'export'}_${timestamp}_${Date.now()}.pdf`;
      const filePath = path.join(this.exportsDir, fileName);

      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Add header
      doc.fontSize(20)
         .fillColor('#4472C4')
         .text(`${companyName} Management`, { align: 'center' });

      doc.fontSize(14)
         .fillColor('#333333')
         .text(options.title || `${options.module || 'Export'} Report`, { align: 'center' });

      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(2);

      // Add table header
      const startX = 50;
      let startY = doc.y;
      const columnWidth = (doc.page.width - 100) / columns.length;

      // Header background
      doc.rect(startX, startY, doc.page.width - 100, 25)
         .fillAndStroke('#4472C4', '#4472C4');

      // Header text
      doc.fillColor('#FFFFFF')
         .fontSize(10);

      columns.forEach((col, i) => {
        doc.text(
          col.header || col,
          startX + (i * columnWidth) + 5,
          startY + 7,
          { width: columnWidth - 10, align: 'left' }
        );
      });

      startY += 25;

      // Add data rows
      doc.fillColor('#333333')
         .fontSize(9);

      data.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (startY > doc.page.height - 100) {
          doc.addPage();
          startY = 50;
        }

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.rect(startX, startY, doc.page.width - 100, 20)
             .fillAndStroke('#F5F5F5', '#F5F5F5');
        }

        // Row data
        columns.forEach((col, i) => {
          const key = col.key || col.toLowerCase().replace(/\s+/g, '_');
          const value = row[key] !== undefined ? row[key].toString() : '';

          doc.fillColor('#333333')
             .text(
               value,
               startX + (i * columnWidth) + 5,
               startY + 5,
               { width: columnWidth - 10, align: 'left', ellipsis: true }
             );
        });

        startY += 20;
      });

      // Add footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Total Records: ${data.length} | ${companyName} © ${new Date().getFullYear()}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );

      doc.end();

      // Wait for PDF to finish writing
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      const stats = fs.statSync(filePath);

      logger.info(`PDF file generated: ${fileName}`);

      return {
        filePath,
        fileName,
        fileSize: stats.size,
        recordCount: data.length
      };
    } catch (error) {
      logger.error('Failed to generate PDF file:', error);
      throw error;
    }
  }

  /**
   * Delete export file
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Export file deleted: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete export file:', error);
      throw error;
    }
  }

  /**
   * Get module data for export when no payload is provided
   */
  async getModuleData(module) {
    const defaultData = {
      SALES: [
        { order_number: 'SO-001', customer: 'SVR Foods', date: new Date().toISOString().split('T')[0], amount: 45000, status: 'COMPLETED' }
      ],
      PAYMENTS: [
        { date: new Date().toISOString().split('T')[0], party: 'Rajesh Traders', amount: 32000, payment_mode: 'UPI', status: 'SUCCESS' }
      ],
      RAW_PURCHASE: [
        { purchase_no: 'RP-001', farmer: 'Lakshmi Farm', date: new Date().toISOString().split('T')[0], quantity: 120, amount: 36000 }
      ],
      JOB_WORK: [
        { job_no: 'JW-001', processor: 'Modern Cashew Works', date: new Date().toISOString().split('T')[0], quantity: 80, cost: 24000 }
      ],
      EXPENSES: [
        { date: new Date().toISOString().split('T')[0], category: 'Logistics', description: 'Transportation costs', amount: 5000 }
      ],
      CUSTOMERS: [
        { name: 'Sundar Enterprise', contact: '9876543210', email: 'sundar@example.com', address: 'Hyderabad', balance: 15000 }
      ]
    };

    return defaultData[module] || [{ id: 1, date: new Date().toISOString().split('T')[0], description: 'No data available', amount: 0 }];
  }

  /**
   * Get default columns for a module or use template if available
   */
  async getColumns(module, templateId) {
    if (templateId) {
      try {
        const template = await ExportTemplate.findById(templateId);
        if (template && template.columns && template.columns.length > 0) {
          return template.columns;
        }
      } catch (error) {
        logger.warn(`Could not load template ${templateId}: ${error.message}`);
      }
    }

    const defaultColumns = {
      SALES: ['Order Number', 'Customer', 'Date', 'Amount', 'Status'],
      PAYMENTS: ['Date', 'Party', 'Amount', 'Payment Mode', 'Status'],
      RAW_PURCHASE: ['Purchase No', 'Farmer', 'Date', 'Quantity', 'Amount'],
      JOB_WORK: ['Job No', 'Processor', 'Date', 'Quantity', 'Cost'],
      EXPENSES: ['Date', 'Category', 'Description', 'Amount'],
      CUSTOMERS: ['Name', 'Contact', 'Email', 'Address', 'Balance']
    };

    return defaultColumns[module] || ['ID', 'Date', 'Description', 'Amount'];
  }

  /**
   * Clean up old export files
   */
  async cleanupOldFiles(daysToKeep = 7) {
    try {
      const files = fs.readdirSync(this.exportsDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      files.forEach(file => {
        const filePath = path.join(this.exportsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      logger.info(`Cleaned up ${deletedCount} old export files`);

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
      throw error;
    }
  }
}

module.exports = new ExportService();
