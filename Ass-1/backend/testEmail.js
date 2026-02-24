const nodemailer = require('nodemailer');

const smtpPass = 'nhuv txyx jwrt sodf'.replace(/\s/g, '');

console.log('Pass (stripped):', smtpPass, '| Length:', smtpPass.length);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'anagha231269@gmail.com',
        pass: smtpPass
    }
});

async function main() {
    console.log('Verifying SMTP...');
    try {
        await transporter.verify();
        console.log('SMTP OK');
    } catch (err) {
        console.error('SMTP FAILED:', err.message);
        return;
    }

    console.log('Sending email...');
    try {
        const info = await transporter.sendMail({
            from: '"Felicity" <anagha231269@gmail.com>',
            to: 'sreevijay.sunil@students.iiit.ac.in',
            subject: 'Felicity Email Test',
            html: '<h1>Test from Felicity</h1><p>Email is working!</p>'
        });
        console.log('SENT! ID:', info.messageId);
    } catch (err) {
        console.error('SEND FAILED:', err.message);
    }
}

main();
