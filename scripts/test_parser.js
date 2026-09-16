import { parseReceiptFromText } from '../src/utils/receiptOcrParser.js';

const sampleReceipt1 = `
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

const sampleReceipt2 = `
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

const sampleReceipt3 = `
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

console.log('--- TEST 1: Jollibee with V flag ---');
const r1 = parseReceiptFromText(sampleReceipt1, 'mlkit', 95);
console.log('Items count:', r1.items.length);
console.log('Items:', r1.items);
console.log('Total:', r1.total, 'Date:', r1.date, 'Merchant:', r1.merchant);
console.log('Dropped rows:', r1.droppedRows);

console.log('\n--- TEST 2: McDonald with T flag and no DATE label ---');
const r2 = parseReceiptFromText(sampleReceipt2, 'mlkit', 95);
console.log('Items count:', r2.items.length);
console.log('Items:', r2.items);
console.log('Total:', r2.total, 'Date:', r2.date, 'Merchant:', r2.merchant);

console.log('\n--- TEST 3: 7-Eleven ---');
const r3 = parseReceiptFromText(sampleReceipt3, 'mlkit', 95);
console.log('Items count:', r3.items.length);
console.log('Items:', r3.items);
console.log('Total:', r3.total, 'Date:', r3.date, 'Merchant:', r3.merchant);
