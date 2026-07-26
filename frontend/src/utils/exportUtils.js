/**
 * Export & Print Utilities
 * Provides Excel and PDF export functionality for reports
 * Date range is mandatory for all exports
 */
import { getCompanyName } from '../context/companyStore';

/**
 * Export data to Excel (CSV format)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} filters - { startDate, endDate, timeRange }
 */
export const exportToExcel = (data, filename, filters = {}) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Validate date range if required
  if (!filters.timeRange && (!filters.startDate || !filters.endDate)) {
    alert('Date range is mandatory for export');
    return;
  }

  try {
    // Get column headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csv += values.join(',') + '\n';
    });

    // Add metadata header
    const dateRange = filters.timeRange
      ? filters.timeRange
      : `${filters.startDate} to ${filters.endDate}`;
    const metadata = `Report: ${filename}\nDate Range: ${dateRange}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    csv = metadata + csv;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Exported ${data.length} rows to ${filename}.csv`);
  } catch (error) {
    console.error('Export to Excel failed:', error);
    alert('Failed to export data');
  }
};

/**
 * Export data to PDF (HTML print)
 * @param {string} title - Report title
 * @param {Array} data - Array of objects to export
 * @param {Object} summary - Summary metrics object
 * @param {Object} filters - { startDate, endDate, timeRange }
 */
export const exportToPDF = (title, data, summary = {}, filters = {}) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Validate date range if required
  if (!filters.timeRange && (!filters.startDate || !filters.endDate)) {
    alert('Date range is mandatory for export');
    return;
  }

  try {
    const companyName = getCompanyName();
    const dateRange = filters.timeRange
      ? filters.timeRange
      : `${filters.startDate} to ${filters.endDate}`;

    // Create HTML content
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #333;
          }
          .metadata {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .summary-card {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #4F46E5;
          }
          .summary-card h3 {
            margin: 0 0 5px 0;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }
          .summary-card p {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #4F46E5;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <h2>${title}</h2>
        </div>

        <div class="metadata">
          <strong>Date Range:</strong> ${dateRange}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Total Records:</strong> ${data.length}
        </div>
    `;

    // Add summary if provided
    if (Object.keys(summary).length > 0) {
      html += '<div class="summary">';
      Object.entries(summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        html += `
          <div class="summary-card">
            <h3>${label}</h3>
            <p>${value}</p>
          </div>
        `;
      });
      html += '</div>';
    }

    // Add table
    if (data.length > 0) {
      const headers = Object.keys(data[0]);

      html += '<table>';
      html += '<thead><tr>';
      headers.forEach(header => {
        const label = header.replace(/([A-Z])/g, ' $1').trim();
        html += `<th>${label}</th>`;
      });
      html += '</tr></thead>';

      html += '<tbody>';
      data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
    }

    html += `
        <div class="footer">
          <p>This is a system-generated report. All data is read-only and non-editable.</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName} - Cashew Management System</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    console.log(`Exported ${data.length} rows to PDF`);
  } catch (error) {
    console.error('Export to PDF failed:', error);
    alert('Failed to export data');
  }
};

/**
 * Simple print function for current page
 */
export const printCurrentPage = () => {
  window.print();
};

/**
 * Validate export filters
 * @param {Object} filters - { startDate, endDate, timeRange }
 * @returns {boolean} - True if valid
 */
export const validateExportFilters = (filters) => {
  if (filters.timeRange) {
    return true; // Predefined time range is valid
  }

  if (!filters.startDate || !filters.endDate) {
    alert('Please select a date range for export');
    return false;
  }

  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);

  if (start > end) {
    alert('Start date cannot be after end date');
    return false;
  }

  return true;
};

/**
 * Format data for export (convert objects to flat structure)
 * @param {Array} data - Array of objects
 * @param {Array} fields - Fields to include in export
 * @returns {Array} - Formatted data
 */
export const formatDataForExport = (data, fields = null) => {
  if (!data || data.length === 0) return [];

  return data.map(item => {
    const formatted = {};
    const keys = fields || Object.keys(item);

    keys.forEach(key => {
      // Handle nested objects
      if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
        formatted[key] = JSON.stringify(item[key]);
      } else if (Array.isArray(item[key])) {
        formatted[key] = item[key].join(', ');
      } else {
        formatted[key] = item[key];
      }
    });

    return formatted;
  });
};
