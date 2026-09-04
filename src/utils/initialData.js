export const initialReceipts = [
  {
    id: "REC-2026-001",
    merchant: "Jollibee - Bonifacio High Street",
    tin: "000-421-893-000",
    date: "2026-08-28",
    time: "12:45 PM",
    category: "Food",
    paymentMethod: "GCash",
    status: "Verified",
    currency: "PHP",
    subtotal: 650.00,
    vat: 78.00,
    total: 728.00,
    items: [
      { name: "2-pc Chickenjoy w/ Rice & Drink", qty: 2, price: 230.00, total: 460.00 },
      { name: "Jolly Spaghetti Solo", qty: 1, price: 90.00, total: 90.00 },
      { name: "Peach Mango Pie Trio", qty: 1, price: 100.00, total: 100.00 }
    ],
    confidence: 99.4,
    notes: "Lunch meeting with client",
    color: "#ff3b30",
    rawReceiptType: "restaurant"
  },
  {
    id: "REC-2026-002",
    merchant: "SM Supermarket - Megamall",
    tin: "000-112-984-001",
    date: "2026-08-25",
    time: "04:15 PM",
    category: "Groceries",
    paymentMethod: "Visa Card **** 8821",
    status: "Verified",
    currency: "PHP",
    subtotal: 3120.00,
    vat: 374.40,
    total: 3494.40,
    items: [
      { name: "Organic Arabica Coffee Beans 500g", qty: 2, price: 420.00, total: 840.00 },
      { name: "Fresh Milk 1L Whole", qty: 3, price: 110.00, total: 330.00 },
      { name: "Artisan Sourdough Loaf", qty: 2, price: 180.00, total: 360.00 },
      { name: "Eco-Friendly Surface Cleaner", qty: 1, price: 390.00, total: 390.00 },
      { name: "Assorted Organic Greens & Fruits", qty: 1, price: 1200.00, total: 1200.00 }
    ],
    confidence: 98.7,
    notes: "Office pantry replenishment",
    color: "#007aff",
    rawReceiptType: "retail"
  },
  {
    id: "REC-2026-003",
    merchant: "Meralco Electric Power Corp",
    tin: "000-101-526-000",
    date: "2026-08-20",
    time: "09:30 AM",
    category: "Utilities",
    paymentMethod: "Online Banking",
    status: "Verified",
    currency: "PHP",
    subtotal: 5850.00,
    vat: 702.00,
    total: 6552.00,
    items: [
      { name: "Base Energy Consumption (480 kWh)", qty: 1, price: 4850.00, total: 4850.00 },
      { name: "Transmission & Distribution Charge", qty: 1, price: 680.00, total: 680.00 },
      { name: "System Loss Charge & Universal Charge", qty: 1, price: 320.00, total: 320.00 }
    ],
    confidence: 99.8,
    notes: "Studio power bill for August",
    color: "#ff9500",
    rawReceiptType: "utility"
  },
  {
    id: "REC-2026-004",
    merchant: "Apple Store / Beyond The Box",
    tin: "007-889-321-000",
    date: "2026-08-14",
    time: "02:20 PM",
    category: "Technology",
    paymentMethod: "MasterCard **** 4192",
    status: "Verified",
    currency: "PHP",
    subtotal: 12400.00,
    vat: 1488.00,
    total: 13888.00,
    items: [
      { name: "Magic Keyboard with Touch ID", qty: 1, price: 7990.00, total: 7990.00 },
      { name: "USB-C to Thunderbolt 4 Cable (2m)", qty: 1, price: 2490.00, total: 2490.00 },
      { name: "MagSafe 35W Dual Port Charger", qty: 1, price: 1920.00, total: 1920.00 }
    ],
    confidence: 99.2,
    notes: "Workstation upgrades for mobile testing",
    color: "#5856d6",
    rawReceiptType: "tech"
  },
  {
    id: "REC-2026-005",
    merchant: "GrabCar Premium - Makati to BGC",
    tin: "009-654-118-000",
    date: "2026-08-10",
    time: "08:15 AM",
    category: "Travel",
    paymentMethod: "GrabPay Wallet",
    status: "Verified",
    currency: "PHP",
    subtotal: 420.00,
    vat: 50.40,
    total: 470.40,
    items: [
      { name: "GrabCar 6-Seater Ride Fare", qty: 1, price: 385.00, total: 385.00 },
      { name: "Skyway RFID Express Toll Charge", qty: 1, price: 35.00, total: 35.00 }
    ],
    confidence: 97.9,
    notes: "Executive transfer to investor demo",
    color: "#34c759",
    rawReceiptType: "transit"
  },
  {
    id: "REC-2026-006",
    merchant: "National Book Store - Quad Alpha",
    tin: "000-349-223-000",
    date: "2026-08-04",
    time: "03:50 PM",
    category: "Office",
    paymentMethod: "Cash",
    status: "Pending",
    currency: "PHP",
    subtotal: 980.00,
    vat: 117.60,
    total: 1097.60,
    items: [
      { name: "A4 Copy Paper Ream 80gsm (500 sheets)", qty: 2, price: 290.00, total: 580.00 },
      { name: "Gel Ink Rollerball Pens Box (12 pcs)", qty: 1, price: 240.00, total: 240.00 },
      { name: "Heavy Duty Document Archival Folders", qty: 4, price: 40.00, total: 160.00 }
    ],
    confidence: 96.5,
    notes: "Tax documentation binders and printing supplies",
    color: "#af52de",
    rawReceiptType: "stationery"
  }
];

export const sampleReceiptTemplates = {
  restaurant: {
    merchant: "Jollibee Food Corp - Store #882",
    tin: "000-421-893-000",
    category: "Food",
    paymentMethod: "GCash QR",
    subtotal: 450.00,
    vat: 54.00,
    total: 504.00,
    items: [
      { name: "1-pc Chickenjoy w/ Palabok", qty: 1, price: 215.00, total: 215.00 },
      { name: "Yumburger with Cheese Value Meal", qty: 1, price: 135.00, total: 135.00 },
      { name: "Chocolate Sundae Cup", qty: 2, price: 50.00, total: 100.00 }
    ],
    confidence: 99.1,
    notes: "Scanned via Resiboss Holographic Lens"
  },
  retail: {
    merchant: "SM Hypermarket - North EDSA",
    tin: "000-112-984-002",
    category: "Groceries",
    paymentMethod: "Maya Wallet",
    subtotal: 1890.00,
    vat: 226.80,
    total: 2116.80,
    items: [
      { name: "Purefoods Tender Juicy Hotdog 1kg", qty: 1, price: 275.00, total: 275.00 },
      { name: "Magnolia Cheezee Spread 480g", qty: 1, price: 165.00, total: 165.00 },
      { name: "Premium Jasmine Fragrant Rice 5kg", qty: 1, price: 380.00, total: 380.00 },
      { name: "Fresh Australian Beef Sirloin 800g", qty: 1, price: 820.00, total: 820.00 },
      { name: "Sparkling Mineral Water 1.5L", qty: 2, price: 125.00, total: 250.00 }
    ],
    confidence: 98.4,
    notes: "Official receipt with BIR tax stamp"
  },
  utility: {
    merchant: "Manila Water Company Inc",
    tin: "004-981-672-000",
    category: "Utilities",
    paymentMethod: "Auto-Debit",
    subtotal: 1420.00,
    vat: 170.40,
    total: 1590.40,
    items: [
      { name: "Basic Water Charge (32 cu.m)", qty: 1, price: 1120.00, total: 1120.00 },
      { name: "Environmental & Sewerage Charge", qty: 1, price: 240.00, total: 240.00 },
      { name: "Maintenance Service Fee", qty: 1, price: 60.00, total: 60.00 }
    ],
    confidence: 99.6,
    notes: "Utility invoice verified against meter record"
  },
  tech: {
    merchant: "DataBlitz Gaming & Electronics",
    tin: "005-771-490-000",
    category: "Technology",
    paymentMethod: "Credit Card (BDO)",
    subtotal: 4280.00,
    vat: 513.60,
    total: 4793.60,
    items: [
      { name: "Logitech MX Master 3S Wireless Mouse", qty: 1, price: 3990.00, total: 3990.00 },
      { name: "Ergonomic Memory Foam Wrist Rest", qty: 1, price: 290.00, total: 290.00 }
    ],
    confidence: 98.9,
    notes: "Peripherals receipt with 1-year warranty QR"
  },
  coffee: {
    merchant: "Starbucks Coffee - BGC Central",
    tin: "000-882-140-001",
    category: "Food",
    paymentMethod: "Starbucks Card",
    subtotal: 480.00,
    vat: 57.60,
    total: 537.60,
    items: [
      { name: "Venti Iced Caramel Macchiato", qty: 1, price: 235.00, total: 235.00 },
      { name: "Grande Nitro Cold Brew", qty: 1, price: 200.00, total: 200.00 },
      { name: "Warm Cinnamon Danish", qty: 1, price: 102.60, total: 102.60 }
    ],
    confidence: 99.4,
    notes: "Client coffee session receipt"
  },
  pharmacy: {
    merchant: "Mercury Drug Store - Makati Ave",
    tin: "000-249-812-000",
    category: "Groceries",
    paymentMethod: "Cash",
    subtotal: 820.00,
    vat: 98.40,
    total: 918.40,
    items: [
      { name: "Biogesic 500mg Paracetamol 20s", qty: 1, price: 175.00, total: 175.00 },
      { name: "Potencee Vitamin C 500mg 30s", qty: 1, price: 380.00, total: 380.00 },
      { name: "Medical Surgical Face Masks (50s)", qty: 2, price: 181.70, total: 363.40 }
    ],
    confidence: 98.7,
    notes: "First aid and wellness emergency purchase"
  },
  fuel: {
    merchant: "Shell Mobility Station - C5 North",
    tin: "000-612-491-000",
    category: "Travel",
    paymentMethod: "Shell Fleet Card",
    subtotal: 2450.00,
    vat: 294.00,
    total: 2744.00,
    items: [
      { name: "Shell V-Power Gasoline (38.2L)", qty: 1, price: 2450.00, total: 2450.00 }
    ],
    confidence: 99.3,
    notes: "Fuel fill-up for company service van"
  }
};
