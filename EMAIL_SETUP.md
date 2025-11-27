# Email Configuration Guide

## Option 1: Gmail (Easiest for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "WhatsApp AI Bot"
   - Copy the 16-character password

3. **Update .env file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # The app password from step 2
SMTP_FROM=WhatsApp AI <your-email@gmail.com>
```

## Option 2: SendGrid (Production Ready)

1. **Create SendGrid Account**: https://signup.sendgrid.com/
2. **Get API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the API key

3. **Update .env file**:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey  # Literal text "apikey"
SMTP_PASS=SG.your-api-key-here
SMTP_FROM=WhatsApp AI <noreply@yourdomain.com>
```

## Option 3: Outlook/Hotmail

1. **Enable SMTP**:
   - Go to Outlook settings
   - Enable SMTP access

2. **Update .env file**:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=WhatsApp AI <your-email@outlook.com>
```

## Option 4: Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=WhatsApp AI <noreply@yourdomain.com>
```

## Development Mode

If email is not configured, the system will:
- Log email content to console
- Still show reset URL in backend logs
- Continue working without actual email sending

## Testing Email

After configuration, test by:
1. Register a new user → Should receive welcome email
2. Use forgot password → Should receive reset email
3. Check console logs if emails don't arrive

## Production Notes

- Use environment-specific .env files
- Never commit .env with real credentials
- Use a dedicated email service (SendGrid, AWS SES, Mailgun)
- Set up SPF and DKIM records for better deliverability
- Monitor email sending limits and quotas
