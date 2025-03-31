require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST']
  }));
// Email transporter with explicit settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth:{
    user:'ciphersingh@gmail.com',
    pass:'qazuzzottwodbwrd'
}
});

// Verify connection on startup
transporter.verify()
  .then(() => console.log('SMTP Connected'))
  .catch(err => console.error('SMTP Failed:', err));

// QR Code Endpoint
app.post('/api/send-qr', express.json(), async (req, res) => {
  try {
    const { email, qrCodeUrl } = req.body;
    
    const info = await transporter.sendMail({
      from: `amansdeeply@gmail.com`,
      to: email,
      subject: 'Your Verification QR Code',
      html: `<img src="${qrCodeUrl}" width="300"/>`,
      attachments: [{
        filename: 'qr.png',
        path: qrCodeUrl
      }]
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      error: 'Email failed',
      details: error.response 
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
  console.log(`Test email endpoint: GET http://localhost:${PORT}/test-email`);
});