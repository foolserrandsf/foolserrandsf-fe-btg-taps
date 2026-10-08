# Fool's Errand · BTG & Taps

Phone app for the weekly by-the-glass and draft menus. Hosted on GitHub Pages; add it to an iPhone home screen from Safari (Share > Add to Home Screen).

- Data lives in the **BTG & Beer Menu Master** Google Sheet.
- The app talks to the sheet through the Apps Script web app in that sheet (Extensions > Apps Script > `WebApp`).
- The address of that connection is in `config.js`. The staff PIN is entered once per phone and is not stored in this repo.
