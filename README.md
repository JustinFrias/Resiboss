# Resiboss

Resiboss is a receipt and expense tracking app that helps you capture, organize, and monitor your spending in one place.

## Features

- 🧾 Capture and store digital receipts
- 💰 Track expenses by category, date, and amount
- 📊 View spending summaries and reports
- 🔍 Search and filter past transactions
- ☁️ Sync data across devices via cloud backend

## Tech Stack

- **Frontend:** React (JavaScript)
- **Backend:** Node.js
- **Database/Cloud:** Firebase
- **Styling:** CSS / [add your CSS framework, e.g. Tailwind, if used]

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm or yarn
- A Firebase project (for backend/database services)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/JustinFrias/Resiboss.git
   cd Resiboss
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables

   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server
   ```bash
   npm start
   ```

   The app should now be running at `http://localhost:3000`.

## Project Structure

```
Resiboss/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/        # Page-level components/views
│   ├── services/      # Firebase/API service logic
│   ├── App.js
│   └── index.js
├── .env               # Environment variables (not committed)
├── package.json
└── README.md
```

*(Update this section to match your actual folder layout.)*

## Available Scripts

- `npm start` — Runs the app in development mode
- `npm run build` — Builds the app for production
- `npm test` — Runs tests

## Roadmap

- [ ] OCR-based receipt scanning
- [ ] Budget goal setting and alerts
- [ ] Export reports to CSV/PDF
- [ ] Multi-currency support

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

**Justin Frias**
[GitHub](https://github.com/JustinFrias)
