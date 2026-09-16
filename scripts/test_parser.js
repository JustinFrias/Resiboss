import { parseReceiptFromText } from '../src/utils/receiptOcrParser.js';

const screenshotReceipt = `
CASH RECEIPT
Adress: 1234 Lorem Ipsum, Dolor
Tel: 123-456-7890
--------------------------------
Date: 01-01-2018         10:35
--------------------------------
Lorem                     6.50
Ipsum                     7.50
Dolor Sit                48.00
Amet                      9.30
Consectetur              11.90
Adipiscing Elit           1.20
Sed Do                    0.40
--------------------------------
Total                    84.80
Sub-total                76.80
Sales Tax                 8.00
Balance                  84.80

THANK YOU
`;

console.log('--- TEST USER SCREENSHOT RECEIPT ---');
const r = parseReceiptFromText(screenshotReceipt, 'mlkit', 95);
console.log('Merchant:', r.merchant);
console.log('Date:', r.date);
console.log('Total:', r.total);
console.log('Subtotal:', r.subtotal);
console.log('VAT/Tax:', r.vat);
console.log('Items count:', r.items.length);
console.log('Items:', r.items);

const jollibeeReceipt = `
JOLLIBEE
Store #1234 SM Megamall
TIN: 000-123-456-000-VAT
Date: 12/25/2025 14:30
1 1pc Chickenjoy w/ Rice 95.00 V
2 Peach Mango Pie 96.00 V
1 Regular Coke 45.00 V
Subtotal: 236.00
VAT 12%: 25.29
Total Amount Due: 236.00
CASH 500.00
CHANGE 264.00
`;

console.log('\n--- TEST JOLLIBEE RECEIPT WITH TAX CODES ---');
const rJollibee = parseReceiptFromText(jollibeeReceipt, 'mlkit', 95);
console.log('Merchant:', rJollibee.merchant);
console.log('Date:', rJollibee.date);
console.log('Total:', rJollibee.total);
console.log('Subtotal:', rJollibee.subtotal);
console.log('VAT/Tax:', rJollibee.vat);
console.log('Items count:', rJollibee.items.length);
console.log('Items:', rJollibee.items);

const sevenElevenReceipt = `
7-ELEVEN STORE 3042
BGC TAGUIG CITY
TIN: 111-222-333-000
05/18/2026 08:15 AM
1 BIG BITE HOTDOG 49.00
2 C2 ICED TEA 500ML 70.00
Vatable Sales 106.25
12% VAT 12.75
Total Amount: 119.00
GCASH 119.00
`;

console.log('\n--- TEST 7-ELEVEN RECEIPT ---');
const r711 = parseReceiptFromText(sevenElevenReceipt, 'mlkit', 95);
console.log('Merchant:', r711.merchant);
console.log('Date:', r711.date);
console.log('Total:', r711.total);
console.log('Subtotal:', r711.subtotal);
console.log('VAT/Tax:', r711.vat);
console.log('Payment Method:', r711.paymentMethod);
console.log('Items count:', r711.items.length);
console.log('Items:', r711.items);
