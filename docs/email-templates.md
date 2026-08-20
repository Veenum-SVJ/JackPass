# JackPass Email Templates

Copy the HTML below into Supabase → Authentication → Email Templates.
Replace the default templates for: **Confirm signup**, **Reset Password**, **Magic Link**, **Change Email Address**.

---

## 1. Confirm Signup

```html
<table width="480" cellpadding="0" cellspacing="0" style="margin:0 auto; background-color:#1A1730; border-radius:16px; overflow:hidden; border:1px solid rgba(91,75,224,0.2); font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <!-- Header -->
  <tr>
    <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid rgba(91,75,224,0.15);">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="36" height="36" style="display:block;">
              <rect x="2" y="2" width="44" height="44" rx="13" fill="#5B4BE0"/>
              <path d="M30 9V23c0 6.5-4.5 9.5-10 8-3.5-1-5-3.5-4.5-6.5" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
              <path d="M24 30l4 4 9-10.5" fill="none" stroke="#F59E0B" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </td>
          <td style="padding-left:8px; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px; vertical-align:middle;">ackPass</td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:36px 40px;">
      <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#FFFFFF;">Welcome to JackPass! 🎓</h1>
      <p style="margin:0 0 8px; font-size:15px; color:#A0A0B8; line-height:1.6;">
        You're one step away from accessing thousands of past questions from Nigerian universities.
      </p>
      <p style="margin:0 0 28px; font-size:15px; color:#A0A0B8; line-height:1.6;">
        Click the button below to verify your email and get started.
      </p>
      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#5B4BE0,#7C6BF0); border-radius:10px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 36px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; letter-spacing:0.3px;">Verify My Email</a>
          </td>
        </tr>
      </table>
      <p style="margin:28px 0 0; font-size:13px; color:#6B6B80; text-align:center; line-height:1.5;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:20px 40px; border-top:1px solid rgba(91,75,224,0.15); text-align:center;">
      <p style="margin:0; font-size:12px; color:#4A4A60;">
        JackPass — Past questions, simplified.<br>
        Built for Nigerian students 🇳🇬
      </p>
    </td>
  </tr>
</table>
```

---

## 2. Reset Password

```html
<table width="480" cellpadding="0" cellspacing="0" style="margin:0 auto; background-color:#1A1730; border-radius:16px; overflow:hidden; border:1px solid rgba(91,75,224,0.2); font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <!-- Header -->
  <tr>
    <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid rgba(91,75,224,0.15);">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="36" height="36" style="display:block;">
              <rect x="2" y="2" width="44" height="44" rx="13" fill="#5B4BE0"/>
              <path d="M30 9V23c0 6.5-4.5 9.5-10 8-3.5-1-5-3.5-4.5-6.5" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
              <path d="M24 30l4 4 9-10.5" fill="none" stroke="#F59E0B" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </td>
          <td style="padding-left:8px; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px; vertical-align:middle;">ackPass</td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:36px 40px;">
      <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#FFFFFF;">Reset Your Password 🔒</h1>
      <p style="margin:0 0 8px; font-size:15px; color:#A0A0B8; line-height:1.6;">
        We received a request to reset the password for your JackPass account.
      </p>
      <p style="margin:0 0 28px; font-size:15px; color:#A0A0B8; line-height:1.6;">
        Click the button below to set a new password. This link expires in 24 hours.
      </p>
      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#5B4BE0,#7C6BF0); border-radius:10px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 36px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; letter-spacing:0.3px;">Reset Password</a>
          </td>
        </tr>
      </table>
      <p style="margin:28px 0 0; font-size:13px; color:#6B6B80; text-align:center; line-height:1.5;">
        If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:20px 40px; border-top:1px solid rgba(91,75,224,0.15); text-align:center;">
      <p style="margin:0; font-size:12px; color:#4A4A60;">
        JackPass — Past questions, simplified.<br>
        Built for Nigerian students 🇳🇬
      </p>
    </td>
  </tr>
</table>
```

---

## 3. Magic Link (Passwordless Login)

```html
<table width="480" cellpadding="0" cellspacing="0" style="margin:0 auto; background-color:#1A1730; border-radius:16px; overflow:hidden; border:1px solid rgba(91,75,224,0.2); font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <!-- Header -->
  <tr>
    <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid rgba(91,75,224,0.15);">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="36" height="36" style="display:block;">
              <rect x="2" y="2" width="44" height="44" rx="13" fill="#5B4BE0"/>
              <path d="M30 9V23c0 6.5-4.5 9.5-10 8-3.5-1-5-3.5-4.5-6.5" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
              <path d="M24 30l4 4 9-10.5" fill="none" stroke="#F59E0B" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </td>
          <td style="padding-left:8px; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px; vertical-align:middle;">ackPass</td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:36px 40px;">
      <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#FFFFFF;">Your Magic Link ✨</h1>
      <p style="margin:0 0 28px; font-size:15px; color:#A0A0B8; line-height:1.6;">
        Click the button below to sign in to JackPass. No password needed!
      </p>
      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#5B4BE0,#7C6BF0); border-radius:10px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 36px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; letter-spacing:0.3px;">Sign In to JackPass</a>
          </td>
        </tr>
      </table>
      <p style="margin:28px 0 0; font-size:13px; color:#6B6B80; text-align:center; line-height:1.5;">
        This link expires shortly. If you didn't request this, you can safely ignore this email.
      </p>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:20px 40px; border-top:1px solid rgba(91,75,224,0.15); text-align:center;">
      <p style="margin:0; font-size:12px; color:#4A4A60;">
        JackPass — Past questions, simplified.<br>
        Built for Nigerian students 🇳🇬
      </p>
    </td>
  </tr>
</table>
```

---

## 4. Change Email Address

```html
<table width="480" cellpadding="0" cellspacing="0" style="margin:0 auto; background-color:#1A1730; border-radius:16px; overflow:hidden; border:1px solid rgba(91,75,224,0.2); font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <!-- Header -->
  <tr>
    <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid rgba(91,75,224,0.15);">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="36" height="36" style="display:block;">
              <rect x="2" y="2" width="44" height="44" rx="13" fill="#5B4BE0"/>
              <path d="M30 9V23c0 6.5-4.5 9.5-10 8-3.5-1-5-3.5-4.5-6.5" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
              <path d="M24 30l4 4 9-10.5" fill="none" stroke="#F59E0B" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </td>
          <td style="padding-left:8px; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px; vertical-align:middle;">ackPass</td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:36px 40px;">
      <h1 style="margin:0 0 12px; font-size:24px; font-weight:700; color:#FFFFFF;">Confirm New Email 📧</h1>
      <p style="margin:0 0 28px; font-size:15px; color:#A0A0B8; line-height:1.6;">
        Click the button below to confirm your new email address for JackPass.
      </p>
      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#5B4BE0,#7C6BF0); border-radius:10px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 36px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; letter-spacing:0.3px;">Confirm Email Change</a>
          </td>
        </tr>
      </table>
      <p style="margin:28px 0 0; font-size:13px; color:#6B6B80; text-align:center; line-height:1.5;">
        If you didn't request this change, you can safely ignore this email.
      </p>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:20px 40px; border-top:1px solid rgba(91,75,224,0.15); text-align:center;">
      <p style="margin:0; font-size:12px; color:#4A4A60;">
        JackPass — Past questions, simplified.<br>
        Built for Nigerian students 🇳🇬
      </p>
    </td>
  </tr>
</table>
```
