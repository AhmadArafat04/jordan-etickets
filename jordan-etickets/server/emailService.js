import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send ticket email using Resend
export async function sendTicketEmail(orderDetails, ticketPDF) {
  const { customer_email, customer_name, event_title, event_date, event_time, event_location, num_tickets, ticket_number, total_price } = orderDetails;

  try {
    const result = await resend.emails.send({
      from: 'Jordan eTickets <onboarding@resend.dev>',
      to: customer_email,
      subject: `تذكرتك لحدث ${event_title} - Your Ticket for ${event_title}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl; }
            .container { max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .info { padding: 20px; background: #f8f9fa; margin: 20px; border-radius: 8px; }
            .info p { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
            .info p:last-child { border-bottom: none; }
            .footer { padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎟️ تذكرتك جاهزة!</h1>
            </div>
            <div style="padding: 30px;">
              <p>عزيزي/عزيزتي ${customer_name}،</p>
              <p>شكراً لشرائك تذكرة لحدث <strong>${event_title}</strong>. تم تأكيد طلبك بنجاح!</p>
              
              <div class="info">
                <p><strong>الحدث:</strong> ${event_title}</p>
                <p><strong>التاريخ:</strong> ${event_date}</p>
                <p><strong>الوقت:</strong> ${event_time}</p>
                <p><strong>المكان:</strong> ${event_location}</p>
                <p><strong>عدد التذاكر:</strong> ${num_tickets}</p>
                <p><strong>المبلغ الإجمالي:</strong> ${total_price} دينار أردني</p>
              </div>

              <p>ستجد تذكرتك الإلكترونية مرفقة مع هذا البريد الإلكتروني. يرجى إبرازها عند الدخول إلى الحدث.</p>
              <p><strong>نراك في الحدث! 🎉</strong></p>
            </div>
            <div class="footer">
              <p>مع تحيات فريق مرحبا تسعينات<br>Jordan eTickets</p>
              <p style="font-size: 12px; color: #999;">هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `ticket-${ticket_number}.pdf`,
          content: ticketPDF.toString('base64')
        }
      ]
    });

    console.log('Ticket email sent successfully:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Error sending ticket email:', error);
    // Don't throw error - order should still be created even if email fails
    return { success: false, error: error.message };
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(orderDetails) {
  const { customer_email, customer_name, event_title, event_date, event_time, num_tickets, total_price } = orderDetails;

  try {
    const result = await resend.emails.send({
      from: 'Jordan eTickets <onboarding@resend.dev>',
      to: customer_email,
      subject: `تأكيد طلبك - Order Confirmation`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl; }
            .container { max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .info { padding: 20px; background: #f8f9fa; margin: 20px; border-radius: 8px; }
            .info p { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
            .info p:last-child { border-bottom: none; }
            .footer { padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 استلام طلبك بنجاح</h1>
            </div>
            <div style="padding: 30px;">
              <p>عزيزي/عزيزتي ${customer_name}،</p>
              <p>شكراً لطلبك تذكرة لحدث <strong>${event_title}</strong>. تم استلام طلبك بنجاح وهو قيد المراجعة.</p>
              
              <div class="info">
                <p><strong>الحدث:</strong> ${event_title}</p>
                <p><strong>التاريخ:</strong> ${event_date}</p>
                <p><strong>الوقت:</strong> ${event_time}</p>
                <p><strong>عدد التذاكر:</strong> ${num_tickets}</p>
                <p><strong>المبلغ الإجمالي:</strong> ${total_price} دينار أردني</p>
              </div>

              <p>سنقوم بمراجعة طلبك وإثبات الدفع. ستصلك تذكرتك الإلكترونية عبر البريد الإلكتروني فور الموافقة على الطلب.</p>
              <p><strong>نراك قريباً! 🎉</strong></p>
            </div>
            <div class="footer">
              <p>مع تحيات فريق مرحبا تسعينات<br>Jordan eTickets</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Confirmation email sent:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error - order should still be created even if email fails
    return { success: false, error: error.message };
  }
}

export default { sendTicketEmail, sendOrderConfirmationEmail };
