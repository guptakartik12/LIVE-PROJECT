const QRCode = require('qrcode');

const generateQRCodeDataURL = async (dataPayload) => {
  try {
    const text = typeof dataPayload === 'string' ? dataPayload : JSON.stringify(dataPayload);
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#142B4A',
        light: '#FFFFFF'
      },
      width: 320
    });
    return dataUrl;
  } catch (err) {
    console.error('QR code generation failed:', err.message);
    return '';
  }
};

module.exports = {
  generateQRCodeDataURL
};
