const emailTemplate = (username, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
        }
        .content {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .otp {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            text-align: center;
            display: block;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #777;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Hi ${username || "User"},</p>
            <p>Thank you for signing up. Please use the OTP below to verify your email address:</p>
            <span class="otp">${otp}</span>
            <p>This OTP is valid for the next 10 minutes. If you did not request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The LearnHub Team</p>
            <p>If you have any questions, feel free to <a href="mailto:chanchalsen500@gmail.com">contact us</a>.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = { emailTemplate };
