const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT == 465, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a notification email to an employee about their request status.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.employeeName - Name of the employee
 * @param {string} options.type - 'Leave' or 'Timesheet'
 * @param {string} options.status - 'approved' or 'rejected'
 * @param {string} options.managerComment - Comment from the manager
 * @param {string} options.details - Specific details (e.g., Dates or Hours)
 */
exports.sendStatusNotification = async ({ to, employeeName, type, status, managerComment, details }) => {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#10b981' : '#ef4444';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #4f46e5; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 14px; text-transform: uppercase; background-color: ${statusColor}20; color: ${statusColor}; margin-bottom: 24px; }
        h2 { color: #1e293b; margin-top: 0; font-size: 24px; font-weight: 700; }
        p { margin-bottom: 16px; font-size: 16px; }
        .details-box { background: #f1f5f9; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #4f46e5; }
        .detail-item { margin-bottom: 8px; font-size: 14px; }
        .detail-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 12px; margin-right: 8px; }
        .comment { font-style: italic; color: #475569; border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 24px; }
        .footer { padding: 32px; text-align: center; font-size: 14px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>StaffSync</h1>
        </div>
        <div class="content">
          <div class="status-badge">${statusLabel}</div>
          <h2>Request Update</h2>
          <p>Hi <strong>${employeeName}</strong>,</p>
          <p>Your <strong>${type}</strong> request has been reviewed and the status has been updated to <strong>${statusLabel}</strong>.</p>
          
          <div class="details-box">
            <div class="detail-item"><span class="detail-label">Type:</span> ${type} Request</div>
            <div class="detail-item"><span class="detail-label">Details:</span> ${details}</div>
          </div>

          ${managerComment ? `
            <div class="comment">
              <strong>Manager's Comment:</strong><br>
              "${managerComment}"
            </div>
          ` : ''}

          <p style="margin-top: 32px;">You can view the full details in your StaffSync dashboard.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} StaffSync Enterprise. All rights reserved.<br>
          This is an automated notification, please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"StaffSync" <${process.env.EMAIL_USER || 'no-reply@staffsync.com'}>`,
      to,
      subject: `[StaffSync] Your ${type} Request: ${statusLabel}`,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
