const sgMail = require('@sendgrid/mail')

const apiKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(apiKey);

const sendWelcomeMsg = (name, email) => {
    const msg = {
        to: email,
        from: 'g.arvind7@gmail.com',
        subject: 'Welcome to the App!',
        text: `Hi, ${name} Enjoy using the app`,
    }
    sgMail.send(msg);
}

const sendCancellationMsg = (name, email) => {
    const msg = {
        to: email,
        from: 'g.arvind7@gmail.com',
        subject: 'Thanks for using the app',
        text: `Hi, ${name} Your details are removed`,
    }
    sgMail.send(msg);
}

module.exports = {
    sendWelcomeMsg,
    sendCancellationMsg
}



