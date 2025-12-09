import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function generateTicketPDF(ticketData) {
  const {
    ticket_code,
    customer_name,
    event_title,
    event_date,
    event_time,
    event_location,
    num_tickets
  } = ticketData;

  return new Promise(async (resolve, reject) => {
    try {
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(ticket_code, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with gradient effect (simulated with rectangles)
      doc.rect(0, 0, 612, 150).fill('#667eea');
      doc.rect(0, 0, 612, 150).fillOpacity(0.8).fill('#764ba2');

      // Title
      doc.fillColor('#FFFFFF')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('🎉 Jordan eTickets', 50, 40, { align: 'center' });

      doc.fontSize(18)
         .font('Helvetica')
         .text('مرحبا تسعينات', 50, 80, { align: 'center' });

      // Ticket info box
      doc.fillColor('#000000')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('تذكرة دخول', 50, 180);

      // Event details
      const startY = 230;
      const lineHeight = 35;

      doc.fontSize(14).font('Helvetica-Bold');
      
      // Event title
      doc.fillColor('#667eea').text('الحدث:', 50, startY);
      doc.fillColor('#000000').font('Helvetica').text(event_title, 150, startY, { width: 350 });

      // Customer name
      doc.font('Helvetica-Bold').fillColor('#667eea').text('الاسم:', 50, startY + lineHeight);
      doc.fillColor('#000000').font('Helvetica').text(customer_name, 150, startY + lineHeight);

      // Date
      const formattedDate = new Date(event_date).toLocaleDateString('ar-JO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.font('Helvetica-Bold').fillColor('#667eea').text('التاريخ:', 50, startY + lineHeight * 2);
      doc.fillColor('#000000').font('Helvetica').text(formattedDate, 150, startY + lineHeight * 2);

      // Time
      doc.font('Helvetica-Bold').fillColor('#667eea').text('الوقت:', 50, startY + lineHeight * 3);
      doc.fillColor('#000000').font('Helvetica').text(event_time, 150, startY + lineHeight * 3);

      // Location
      doc.font('Helvetica-Bold').fillColor('#667eea').text('المكان:', 50, startY + lineHeight * 4);
      doc.fillColor('#000000').font('Helvetica').text(event_location, 150, startY + lineHeight * 4);

      // Number of tickets
      doc.font('Helvetica-Bold').fillColor('#667eea').text('عدد التذاكر:', 50, startY + lineHeight * 5);
      doc.fillColor('#000000').font('Helvetica').text(num_tickets.toString(), 150, startY + lineHeight * 5);

      // QR Code
      const qrY = startY + lineHeight * 6 + 20;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#667eea')
         .text('رمز QR للدخول:', 50, qrY);

      // Convert QR code data URL to buffer and add to PDF
      const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
      doc.image(qrBuffer, 50, qrY + 25, { width: 150, height: 150 });

      // Ticket code
      doc.fontSize(10)
         .font('Courier-Bold')
         .fillColor('#000000')
         .text(ticket_code, 50, qrY + 185, { width: 150, align: 'center' });

      // Instructions box
      const instructionsY = qrY + 220;
      doc.rect(50, instructionsY, 512, 100)
         .fillOpacity(0.1)
         .fill('#667eea')
         .fillOpacity(1);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#667eea')
         .text('تعليمات مهمة:', 60, instructionsY + 10);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text('• يرجى إحضار هذه التذكرة معك إلى الحدث', 60, instructionsY + 35)
         .text('• سيتم مسح رمز QR عند الدخول', 60, instructionsY + 50)
         .text('• التذكرة صالحة لشخص واحد فقط', 60, instructionsY + 65)
         .text('• يرجى الوصول قبل 15 دقيقة من بداية الحدث', 60, instructionsY + 80);

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Jordan eTickets © 2025 | info@jordan-etickets.jo', 50, 750, {
           align: 'center',
           width: 512
         });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

export default { generateTicketPDF };
