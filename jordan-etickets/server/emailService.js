import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send ticket email
export async function sendTicketEmail(orderDetails, ticketPDF) {
  const { customer_email, customer_name, event_title, event_date, event_time, event_location, num_tickets, ticket_code } = orderDetails;

  const mailOptions = {
    from: `"مرحبا تسعينات - Jordan eTickets" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: `تذكرتك لحدث: ${event_title}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .ticket-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .ticket-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
          .ticket-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #495057; }
          .value { color: #212529; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 تذكرتك جاهزة!</h1>
            <p>شكراً لك ${customer_name}</p>
          </div>
          
          <div class="content">
            <p>مرحباً ${customer_name}،</p>
            <p>تم تأكيد طلبك بنجاح! تجد في المرفقات تذكرتك الإلكترونية.</p>
            
            <div class="ticket-info">
              <h2 style="margin-top: 0; color: #667eea;">تفاصيل الحدث</h2>
              
              <div class="ticket-row">
                <span class="label">الحدث:</span>
                <span class="value">${event_title}</span>
              </div>
              
              <div class="ticket-row">
                <span class="label">التاريخ:</span>
                <span class="value">${new Date(event_date).toLocaleDateString('ar-JO')}</span>
              </div>
              
              <div class="ticket-row">
                <span class="label">الوقت:</span>
                <span class="value">${event_time}</span>
              </div>
              
              <div class="ticket-row">
                <span class="label">المكان:</span>
                <span class="value">${event_location}</span>
              </div>
              
              <div class="ticket-row">
                <span class="label">عدد التذاكر:</span>
                <span class="value">${num_tickets}</span>
              </div>
              
              <div class="ticket-row">
                <span class="label">رمز التذكرة:</span>
                <span class="value" style="font-family: monospace; font-weight: bold;">${ticket_code}</span>
              </div>
            </div>
            
            <p><strong>ملاحظة مهمة:</strong></p>
            <ul style="color: #6c757d;">
              <li>يرجى إحضار التذكرة المرفقة معك إلى الحدث</li>
              <li>سيتم مسح رمز QR عند الدخول</li>
              <li>التذكرة صالحة لشخص واحد فقط</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>مرحبا تسعينات - Jordan eTickets</p>
            <p>للاستفسارات: info@jordan-etickets.jo</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `ticket-${ticket_code}.pdf`,
        content: ticketPDF,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send order confirmation email (when order is created)
export async function sendOrderConfirmationEmail(orderDetails) {
  const { customer_email, customer_name, event_title, num_tickets, total_price } = orderDetails;

  const mailOptions = {
    from: `"مرحبا تسعينات - Jordan eTickets" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: `تأكيد طلبك - ${event_title}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { color: #667eea; text-align: center; margin-bottom: 30px; }
          .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ تم استلام طلبك</h1>
          </div>
          
          <p>عزيزي ${customer_name}،</p>
          <p>شكراً لك! تم استلام طلبك بنجاح وهو الآن قيد المراجعة.</p>
          
          <div class="info">
            <p><strong>الحدث:</strong> ${event_title}</p>
            <p><strong>عدد التذاكر:</strong> ${num_tickets}</p>
            <p><strong>المبلغ الإجمالي:</strong> ${total_price} دينار أردني</p>
          </div>
          
          <p>سنقوم بمراجعة طلبك وإثبات الدفع. ستصلك تذكرتك الإلكترونية عبر البريد الإلكتروني فور الموافقة على الطلب.</p>
          
          <p style="color: #6c757d; margin-top: 30px;">مرحبا تسعينات - Jordan eTickets</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error - order should still be created even if email fails
    return { success: false, error: error.message };
  }
}

export default { sendTicketEmail, sendOrderConfirmationEmail };
