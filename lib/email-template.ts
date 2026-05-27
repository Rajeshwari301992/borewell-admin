export function buildOtpEmail(otp: string): { subject: string; html: string } {
  const subject = 'Your S K Borewells Verification OTP'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:16px;margin-bottom:16px;font-size:28px;">
                ⛏️
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;">S K Borewells</h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Professional Drilling Services</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#374151;font-size:15px;font-weight:600;">Hello Customer,</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
                You requested an OTP to verify your email address for S K Borewells.
                Use the code below to complete your verification.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border:2px solid #fbbf24;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#92400e;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your Verification OTP</p>
                <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#0f172a;font-family:monospace;margin:8px 0;">
                  ${otp}
                </div>
                <p style="margin:8px 0 0;color:#d97706;font-size:12px;font-weight:600;">⏱ Valid for 5 minutes only</p>
              </div>

              <!-- Warning -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0;color:#dc2626;font-size:13px;font-weight:600;">
                  🔒 Security Notice
                </p>
                <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;line-height:1.5;">
                  Do <strong>not</strong> share this OTP with anyone.
                  S K Borewells will never ask for your OTP over phone or chat.
                </p>
              </div>

              <!-- Steps -->
              <p style="margin:0 0 8px;color:#374151;font-size:13px;font-weight:600;">What to do next:</p>
              <ol style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:13px;line-height:2;">
                <li>Return to the S K Borewells login page</li>
                <li>Enter the 6-digit OTP above</li>
                <li>Click <strong>Verify &amp; Login</strong></li>
              </ol>

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                If you did not request this OTP, please ignore this email.
                Your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#0f172a;font-size:13px;font-weight:700;">S K Borewells Services</p>
              <p style="margin:0 0 4px;color:#64748b;font-size:12px;">📞 +91 83100 08194 &nbsp;|&nbsp; Karnataka, India</p>
              <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">
                © 2025 S K Borewells. All rights reserved.<br/>
                This is an automated email — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
