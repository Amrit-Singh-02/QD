/**
 * Generates a professional, styled HTML email template.
 * Proper HTML email structure with doctype, tables, and inline styles
 * is critical for deliverability — bare-bones HTML gets flagged as spam.
 */

export const verificationEmailTemplate = (verificationUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#40513B;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;letter-spacing:0.5px;">Quick<span style="color:#f5c518;">DROP</span></h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">Verify Your Email Address</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                Thanks for signing up! Please click the button below to verify your email address and activate your account.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:8px;background-color:#40513B;">
                    <a href="${verificationUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#40513B;word-break:break-all;">
                ${verificationUrl}
              </p>
              <p style="margin:0;font-size:13px;color:#888888;">This link expires in 15 minutes.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">&copy; ${new Date().getFullYear()} QuickDROP. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const resetPasswordEmailTemplate = (resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#40513B;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;letter-spacing:0.5px;">Quick<span style="color:#f5c518;">DROP</span></h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">Reset Your Password</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new password.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:8px;background-color:#40513B;">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#40513B;word-break:break-all;">
                ${resetUrl}
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#888888;">This link expires in 5 minutes.</p>
              <p style="margin:0;font-size:13px;color:#888888;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">&copy; ${new Date().getFullYear()} QuickDROP. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const otpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your OTP Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#40513B;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;letter-spacing:0.5px;">Quick<span style="color:#f5c518;">DROP</span></h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;text-align:center;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">Email Change Verification</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                Use the following OTP to verify your new email address:
              </p>
              <div style="display:inline-block;padding:16px 40px;background-color:#f4f4f5;border-radius:8px;margin-bottom:24px;">
                <span style="font-size:32px;font-weight:bold;color:#1a1a1a;letter-spacing:6px;">${otp}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#888888;">This code expires in 10 minutes.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">&copy; ${new Date().getFullYear()} QuickDROP. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
