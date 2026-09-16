// Test new parser logic
const monthMap = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function parseAmount(str) {
  if (!str) return null;
  const s = String(str).trim().replace(/^[^\d]+/, '').replace(/[^\d.,]/g, '');
  if (!s) return null;
  let normalized = s;
  if (s.includes(',') && s.includes('.')) {
    if (s.indexOf(',') < s.indexOf('.')) {
      normalized = s.replace(/,/g, '');
    } else {
      normalized = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = parts[0] + '.' + parts[1];
    } else {
      normalized = s.replace(/,/g, '');
    }
  }
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? +(num.toFixed(2)) : null;
}

function normalizeOcrRow(line) {
  if (!line || typeof line !== 'string') return '';
  let cleaned = line.trim();

  // Strip trailing tax flags, brackets, asterisks, e.g. " 95.00 V" -> " 95.00", " 120.00 T" -> " 120.00"
  cleaned = cleaned.replace(/\s+([VTNABFX\*\#\(\)\[\]]{1,3})\s*$/i, '');

  // Normalize thousands dot: e.g. 7.402.60 -> 7402.60
  cleaned = cleaned.replace(/\b(\d+)\.(\d{3})\.(\d{2})\b/g, '$1$2.$3');

  // Candidate amount token at the end of the line
  cleaned = cleaned.replace(/([0-9OolISGB]+[.,\s][0-9OolISGB]+)\s*$/i, (match) => {
    let norm = match
      .replace(/[Oo]/g, '0')
      .replace(/[lI]/g, '1')
      .replace(/[Ss]/g, '5')
      .replace(/B/g, '8')
      .replace(/G/g, '6');
    norm = norm.replace(/(\d+)\s+(\d{2})$/, '$1.$2');
    return norm;
  });

  return cleaned;
}

function parseDateString(str) {
  if (!str) return null;
  const s = str.trim();
  const dmy = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s\-\/\.']+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:[\s,\-\/\.']+|['])(?:20|19)?(\d{2,4})\b/i);
  if (dmy) {
    let yr = dmy[3];
    if (yr.length === 2) yr = parseInt(yr, 10) > 50 ? `19${yr}` : `20${yr}`;
    return `${yr}-${monthMap[dmy[2].toLowerCase().substring(0, 3)]}-${String(dmy[1]).padStart(2, '0')}`;
  }
  const mdy = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?[\s\-\/\.']+(\d{1,2})(?:st|nd|rd|th)?(?:[\s,\-\/\.']+|['])(?:20|19)?(\d{2,4})\b/i);
  if (mdy) {
    let yr = mdy[3];
    if (yr.length === 2) yr = parseInt(yr, 10) > 50 ? `19${yr}` : `20${yr}`;
    return `${yr}-${monthMap[mdy[1].toLowerCase().substring(0, 3)]}-${String(mdy[2]).padStart(2, '0')}`;
  }
  const num = s.match(/\b(\d{1,4})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
  if (num) {
    if (num[1].length === 4) {
      return `${num[1]}-${String(num[2]).padStart(2, '0')}-${String(num[3]).padStart(2, '0')}`;
    } else {
      let yr = num[3];
      if (yr.length === 2) yr = parseInt(yr, 10) > 50 ? `19${yr}` : `20${yr}`;
      const first = parseInt(num[1], 10);
      const second = parseInt(num[2], 10);
      const mo = first > 12 ? second : first;
      const dy = first > 12 ? first : second;
      return `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
    }
  }
  return null;
}

const skipPrefixes = [
  'subtotal', 'sub-total', 'sub total', 'total', 'cash', 'change', 'tendered',
  'amount tendered', 'cash tendered', 'balance', 'amount due', 'total amount due',
  'total due', 'please pay', 'due date', 'billing period', 'bill date',
  'customer account', 'account number', 'meter number', 'multiplier',
  'remaining balance', 'previous bill', 'tin:', 'tin #', 'vat reg', 'tax id',
  'computation summary', 'your electric bill', 'rate:', 'can:', 'can (',
  'vat', '12% vat', 'vat 12%', 'vatable', 'vatable sales', 'vat exempt', 'zero rated', 'non-vat',
  'sales tax', 'local tax', 'tax', 'taxable', 'service charge',
  'discount', 'less discount', 'senior citizen', 'pwd disc', 'promo disc',
  'gcash', 'maya', 'paymaya', 'grabpay', 'shopeepay', 'visa', 'mastercard',
  'credit card', 'debit card', 'card', 'online payment', 'check', 'gift cert',
  'items count', 'total items', 'item count', 'no. of items', 'total qty',
  'order #', 'order no', 'order:', 'trans #', 'txn #', 'pos #', 'or #', 'si #',
  'cashier:', 'cashier', 'server:', 'terminal:', 'table:', 'table #', 'dine in', 'take out'
];

const decimalPriceRegex = /(?:[\$₱P€£]|php|eur)?\s*(\d{1,3}(?:,\d{3})+[.,]\d{1,2}|\d+[.,]\d{1,2})\s*(?:[VTNABFX\*\#\(\)\[\]]{1,3})?\s*$/i;
const currencyIntRegex = /(?:[\$₱P€£]|php|eur)\s*(\d{1,6})\s*(?:[VTNABFX\*\#\(\)\[\]]{1,3})?\s*$/i;

function testParse(sampleText) {
  const rawLines = sampleText.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  const droppedRows = [];

  for (let rawLine of rawLines) {
    const normLine = normalizeOcrRow(rawLine);
    const lowerNorm = normLine.toLowerCase();

    const isSkipPrefix = skipPrefixes.some(p => lowerNorm.startsWith(p) || lowerNorm === p);
    if (isSkipPrefix) {
      droppedRows.push({ line: rawLine, reason: 'Matched skipPrefix' });
      continue;
    }

    if (/(?:tel|phone|fax|hotline|cel|mobile|contact|website|www|http|address|addr|zip|blvd|ave|st\.|rd\.|ln\.|fl\.|suite?|ste\.?)\b/i.test(rawLine)) {
      droppedRows.push({ line: rawLine, reason: 'Address/contact line' });
      continue;
    }
    if (/^\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*$/i.test(rawLine)) {
      droppedRows.push({ line: rawLine, reason: 'Timestamp line' });
      continue;
    }

    const priceMatch = normLine.match(decimalPriceRegex) || normLine.match(currencyIntRegex);
    if (priceMatch) {
      const priceVal = parseAmount(priceMatch[1]);
      let desc = normLine.substring(0, priceMatch.index).trim();
      let qty = 1;

      desc = desc.replace(/^\d{5,14}\s+/, '').trim();
      desc = desc.replace(/^[#\-\.\*\s§©|~\[\]_]+|[#\-\.\*\s§©|~\[\]_]+$/g, '').trim();
      desc = desc.replace(/[₱\$€£]$/, '').trim();

      const explicitQty = desc.match(/^[|\[\]\s]*(\d+)\s*(?:[xX\*]|pcs?|@|pk|box|can|und)\s*/i);
      if (explicitQty) {
        qty = parseInt(explicitQty[1], 10) || 1;
        desc = desc.substring(explicitQty[0].length).trim();
      } else {
        const softQty = desc.match(/^[|\[\]\s]*(\d{1,2})\s+/);
        if (softQty) {
          const potentialNumber = parseInt(softQty[1], 10);
          const remainder = desc.substring(softQty[0].length).trim();
          const isMonth = /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(remainder);
          if (!isMonth && potentialNumber > 0 && potentialNumber <= 50) {
            qty = potentialNumber;
            desc = remainder;
          }
        }
      }

      // Check if desc has a unit price at the end, e.g. "HAMBURGER 50.00" -> unit 50, total 100
      let unitPrice = +(priceVal / qty).toFixed(2);
      const trailingUnitPrice = desc.match(/\s+(\d+[.,]\d{1,2})\s*$/);
      if (trailingUnitPrice) {
        const up = parseAmount(trailingUnitPrice[1]);
        if (up && Math.abs(up * qty - priceVal) < 0.05) {
          unitPrice = up;
          desc = desc.substring(0, trailingUnitPrice.index).trim();
        }
      }

      desc = desc.replace(/^[#\-\.\*\s§©|~\[\]_]+|[#\-\.\*\s§©|~\[\]_]+$/g, '').trim();

      if (desc.length >= 2) {
        items.push({ name: desc, qty, price: unitPrice, total: priceVal });
      }
    }
  }

  // Date detection with fallback
  let date = null;
  const billMatch = sampleText.match(/(?:bill\s*date|billing\s*date|statement\s*date|invoice\s*date|sil\s*date)\s*[:#\-]?\s*([A-Za-z0-9\s,\/\.\-']{6,25})/i);
  if (billMatch) date = parseDateString(billMatch[1]);
  if (!date) {
    const genMatch = sampleText.match(/(?:fecha|receipt\s*date|date)\s*[:#\-]?\s*([A-Za-z0-9\s,\/\.\-']{6,25})/i);
    if (genMatch) date = parseDateString(genMatch[1]);
  }
  if (!date) {
    for (let line of rawLines) {
      const d = parseDateString(line);
      if (d) {
        date = d;
        break;
      }
    }
  }

  return { items, date, droppedRows };
}

const sample1 = `
JOLLIBEE FOODS CORP
TIN: 000-477-103-000
STORE # 1245 - SM MEGAMALL
DATE: 09/15/2026  12:45 PM

1 1PC CHICKENJOY          95.00 V
2 YUMBURGER W/ CHS       120.00 V
1 JOLLY SPAGHETTI         65.00 V
1 REGULAR COKE            40.00 V

SUBTOTAL                 320.00
VAT 12%                   34.29
TOTAL AMOUNT DUE         320.00
CASH                     500.00
CHANGE                   180.00
`;

const sample2 = `
MCDONALD'S
GOLDEN ARCHES DEV CORP
TIN: 000-123-456-000
09/14/2026 18:22
ORDER # 45

1 BIG MAC                 210.00 T
1 MEDIUM FRIES             75.00 T
1 COKE ZERO 16OZ           45.00 T

TOTAL                    330.00
CASH                     500.00
CHANGE                   170.00
`;

const sample3 = `
7-ELEVEN STORE 3122
PHILIPPINE SEVEN CORP
SI # 987654
12-SEP-2026 08:15:00

BIG BITE HOTDOG           45.00
GULP 22OZ                 35.00
SIOPAO ASADO              42.00

TOTAL DUE                122.00
GCASH                    122.00
`;

console.log('Sample 1 (Jollibee):', testParse(sample1));
console.log('\nSample 2 (McDonalds):', testParse(sample2));
console.log('\nSample 3 (7-Eleven):', testParse(sample3));
