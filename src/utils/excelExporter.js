/**
 * Generates an Excel SpreadsheetML (.xls) document with:
 * - Automatic column width adjustment (ss:AutoFitWidth="1")
 * - Pre-calculated optimal column widths so no text is truncated or dates show '########'
 * - Clean header styling (bold, colored background, centered)
 * - Formatted numbers (#,##0.00) and dates (yyyy-mm-dd)
 */

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateExcelSpreadsheet({
  sheetName = 'Receipts Journal',
  headers = [],
  rows = [],
  minColWidth = 100,
}) {
  // Calculate optimal width for each column based on content
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    for (const row of rows) {
      const cell = row[colIdx];
      const val = cell !== null && cell !== undefined ? (typeof cell === 'object' ? cell.value : cell) : '';
      const strLen = String(val).length;
      if (strLen > maxLen) maxLen = strLen;
    }
    // Each character is roughly 7.5 to 8.5 points in Excel Calibri 11pt, plus padding
    return Math.max(minColWidth, Math.round(maxLen * 8.5 + 26));
  });

  const columnsXml = colWidths
    .map((w) => `   <Column ss:AutoFitWidth="1" ss:Width="${w}"/>`)
    .join('\n');

  const headersXml = headers
    .map((h) => `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('\n');

  const rowsXml = rows
    .map((row) => {
      const cellsXml = row
        .map((cell) => {
          let val = cell;
          let isNum = false;
          let isDate = false;

          if (typeof cell === 'object' && cell !== null) {
            val = cell.value;
            isNum = cell.isNumber || typeof val === 'number';
            isDate = cell.isDate;
          } else if (typeof cell === 'number') {
            isNum = true;
          } else if (typeof cell === 'string') {
            if (/^-?\d+(\.\d+)?$/.test(cell.trim()) && !/^0\d+/.test(cell.trim())) {
              isNum = true;
              val = parseFloat(cell.trim());
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(cell.trim())) {
              isDate = true;
            }
          }

          if (isNum && !isNaN(val)) {
            return `    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${val}</Data></Cell>`;
          }
          if (isDate) {
            return `    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          }
          return `    <Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        })
        .join('\n');

      return `   <Row ss:AutoFitHeight="1" ss:Height="22">\n${cellsXml}\n   </Row>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Resiboss</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0f766e" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#115e59"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#115e59"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#115e59"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#115e59"/>
   </Borders>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DateStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="yyyy-mm-dd"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TextStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName.substring(0, 31))}">
  <Table ss:DefaultRowHeight="20">
${columnsXml}
   <Row ss:AutoFitHeight="1" ss:Height="26">
${headersXml}
   </Row>
${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}
