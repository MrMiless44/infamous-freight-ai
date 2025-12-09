/**
 * Email Service
 * Handles transactional and marketing emails
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.configured = false;
    this.transporter = null;
  }

  initialize() {
    // Use SendGrid if available, otherwise fallback to SMTP
    if (process.env.SENDGRID_API_KEY) {
      this.initializeSendGrid();
    } else if (process.env.SMTP_HOST) {
      this.initializeSMTP();
    } else {
      console.warn('⚠️  Email service not configured (SENDGRID_API_KEY or SMTP_* env vars)');
      return;
    }

    this.configured = true;
  }

  initializeSendGrid() {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.transporter = sgMail;
    console.log('✅ SendGrid email service initialized');
  }

  initializeSMTP() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✅ SMTP email service initialized');
  }

  async sendOrderConfirmation(email, order) {
    if (!this.configured) return false;

    try {
      const subject = `Order Confirmation #${order.id}`;
      const html = this.getOrderConfirmationHTML(order);

      await this.send(email, subject, html);
      console.log(`📧 Order confirmation sent to ${email}`);
      return true;
    } catch (err) {
      console.error('Order confirmation error:', err.message);
      return false;
    }
  }

  async sendShipmentUpdate(email, shipment) {
    if (!this.configured) return false;

    try {
      const subject = `Shipment Update: ${shipment.id}`;
      const html = this.getShipmentUpdateHTML(shipment);

      await this.send(email, subject, html);
      console.log(`📧 Shipment update sent to ${email}`);
      return true;
    } catch (err) {
      console.error('Shipment update error:', err.message);
      return false;
    }
  }

  async sendPaymentReceipt(email, payment) {
    if (!this.configured) return false;

    try {
      const subject = `Payment Receipt - $${(payment.amount / 100).toFixed(2)}`;
      const html = this.getPaymentReceiptHTML(payment);

      await this.send(email, subject, html);
      console.log(`📧 Payment receipt sent to ${email}`);
      return true;
    } catch (err) {
      console.error('Payment receipt error:', err.message);
      return false;
    }
  }

  async sendWelcomeEmail(email, userName) {
    if (!this.configured) return false;

    try {
      const subject = 'Welcome to Infamous Freight!';
      const html = this.getWelcomeEmailHTML(userName);

      await this.send(email, subject, html);
      console.log(`📧 Welcome email sent to ${email}`);
      return true;
    } catch (err) {
      console.error('Welcome email error:', err.message);
      return false;
    }
  }

  async send(to, subject, html) {
    if (!this.configured) return false;

    const from = process.env.EMAIL_FROM || 'noreply@infamous-freight.com';

    if (this.transporter.send) {
      // SendGrid
      return this.transporter.send({ to, from, subject, html });
    } else {
      // SMTP
      return this.transporter.sendMail({ to, from, subject, html });
    }
  }

  getWelcomeEmailHTML(name) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome to Infamous Freight, ${name}!</h2>
          <p>We're excited to have you on board. Here's what you can do:</p>
          <ul>
            <li>📦 Create and track shipments</li>
            <li>💰 Manage payments and billing</li>
            <li>📊 View detailed analytics</li>
            <li>🚀 Optimize your logistics</li>
          </ul>
          <p><a href="${process.env.WEB_URL}/dashboard" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Get Started
          </a></p>
          <p>Need help? <a href="${process.env.WEB_URL}/help">View our documentation</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            © 2025 Infamous Freight. All rights reserved.
          </p>
        </body>
      </html>
    `;
  }

  getOrderConfirmationHTML(order) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Order Confirmation #${order.id}</h2>
          <p>Thank you for your order!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Item</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Qty</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Price</th>
            </tr>
            ${order.items?.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${item.name}</td>
                <td style="padding: 10px;">${item.quantity}</td>
                <td style="padding: 10px;">$${(item.price / 100).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: right;" colspan="2">Total:</th>
              <th style="padding: 10px;">$${(order.total / 100).toFixed(2)}</th>
            </tr>
          </table>
          <p><a href="${process.env.WEB_URL}/orders/${order.id}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Order
          </a></p>
        </body>
      </html>
    `;
  }

  getShipmentUpdateHTML(shipment) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Shipment Update: ${shipment.id}</h2>
          <p>Your shipment status has been updated:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Status:</strong> ${shipment.status}</p>
            <p><strong>Location:</strong> ${shipment.location}</p>
            <p><strong>Estimated Delivery:</strong> ${shipment.estimatedDelivery}</p>
          </div>
          <p><a href="${process.env.WEB_URL}/shipments/${shipment.id}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Track Shipment
          </a></p>
        </body>
      </html>
    `;
  }

  getPaymentReceiptHTML(payment) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Payment Receipt</h2>
          <p>Thank you for your payment!</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Amount:</strong> $${(payment.amount / 100).toFixed(2)}</p>
            <p><strong>Transaction ID:</strong> ${payment.id}</p>
            <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>
          <p><a href="${process.env.WEB_URL}/payments/${payment.id}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Receipt
          </a></p>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
