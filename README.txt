
Sunil Tools Hub - Instructions
------------------------------
Files:
 - index.html
 - assets/style.css
 - assets/app.js

How to use:
1. Unzip the package and upload all files to a static web host (GitHub Pages, Netlify, Vercel, or your own server).
2. Open index.html in browser (works offline except for CDN libraries).
3. 4. The site uses CDN links for html2canvas, jsPDF and PDF-Lib. If you prefer offline, download the libraries and update the script tags in index.html.

Customization:
- If you want your logo, colors, or only a subset of tools, tell me and I'll modify files and provide a fresh ZIP.

Security & Privacy:
- Most tools run in the browser; images do not leave user's device except when using the background removal API (which sends image to the external provider).

Note: Background Remover tool removed by request — all remaining tools run fully client-side without any API keys.

Updates:
- Added logo (assets/logo.svg)
- Added PDF → Images (JPG/PNG) extraction (client-side using PDF.js + JSZip)
- Added Split PDF (creates single-page PDFs and zips them)
- Improved labels and organization for student use.
