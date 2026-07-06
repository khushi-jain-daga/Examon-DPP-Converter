Examon DPP Converter SAFE Option-Only Fix v4

What changed:
- Parser fixed Hindi उत्तर / उत्तरी / उत्तर से confusion.
- Q2/Q4 options will now be captured correctly.
- server.js and template.js are restored to original working logic to avoid blank page issue.
- Format/logo/layout are same as original converter.

Run:
npm install
npm run desktop

If you want to patch an existing folder, replace these only:
- server.js
- src/parser.js
- src/template.js

Do not use v2/v3 folders.
