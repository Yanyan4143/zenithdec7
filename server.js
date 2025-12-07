// server.js - Simple local print server for POS
// Run this on the Windows PC that has the receipt printer and cash drawer attached.
// Requirements:
//   npm install express

const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Basic CORS so the POS UI (file:// or http://) can call this server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Endpoint to receive a sale and (later) print a receipt + open cash drawer
app.post('/print-receipt', async (req, res) => {
  const sale = req.body && req.body.sale;

  if (!sale) {
    return res.status(400).json({ ok: false, error: 'Missing sale payload' });
  }

  // TODO: Integrate with your actual receipt printer and cash drawer here.
  // Examples (you will adapt based on your hardware/driver):
  //   - Use node-escpos or vendor SDK to send ESC/POS commands
  //   - Send the kick-out command to open the cash drawer
  // For now we just log the data so you can verify it is received.

  console.log('--- PRINT REQUEST ---');
  console.log('Date:', sale.date);
  console.log('Total:', sale.total);
  if (Array.isArray(sale.items)) {
    console.log('Items:');
    sale.items.forEach((item, idx) => {
      console.log(
        `  ${idx + 1}. ${item.qty} x ${item.name} @ ${item.price} (${item.category || 'no category'})`
      );
    });
  }
  console.log('---------------------');

  // Simulate success
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Print server running on http://localhost:${PORT}`);
});
