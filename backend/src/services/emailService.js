const nodemailer = require('nodemailer');

let transporter = null;

const initEmailTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Graceful fallback mock transporter that logs emails
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('--- [ParkEase Email Simulator] ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Preview: ${mailOptions.text || mailOptions.html.replace(/<[^>]*>?/gm, '').slice(0, 150)}...`);
        console.log('-----------------------------------');
        return { messageId: 'simulated-email-' + Date.now() };
      }
    };
  }
};

const sendBookingConfirmationEmail = async ({ to, userName, bookingId, slotId, floorName, startTime, endTime, totalAmount }) => {
  try {
    if (!transporter) initEmailTransporter();
    const mailOptions = {
      from: '"ParkEase Smart Parking" <no-reply@parkease.com>',
      to,
      subject: `Booking Confirmed: Spot ${slotId} (${bookingId}) - ParkEase`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #142B4A; margin-top: 0;">Reservation Confirmed!</h2>
          <p>Hello <b>${userName}</b>,</p>
          <p>Your parking reservation at ParkEase has been successfully confirmed. Present your digital QR pass at the boom barrier gate scanner on arrival.</p>
          
          <div style="background: #F5F8FC; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>Pass ID:</strong> ${bookingId}</p>
            <p style="margin: 6px 0;"><strong>Slot:</strong> ${slotId} (${floorName})</p>
            <p style="margin: 6px 0;"><strong>Scheduled Entry:</strong> ${new Date(startTime).toLocaleString('en-IN')}</p>
            <p style="margin: 6px 0;"><strong>Scheduled Exit:</strong> ${new Date(endTime).toLocaleString('en-IN')}</p>
            <p style="margin: 6px 0;"><strong>Total Paid:</strong> ₹${totalAmount}</p>
          </div>

          <p style="color: #64748B; font-size: 13px;">Need help? You can view your pass, trigger boom barriers, or get turn-by-turn indoor walking directions via the ParkEase App.</p>
          <p style="color: #142B4A; font-weight: bold; margin-bottom: 0;">ParkEase Team</p>
        </div>
      `
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error.message);
  }
};

module.exports = {
  sendBookingConfirmationEmail
};
