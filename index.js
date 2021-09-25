const express = require('express')
const axios = require('axios')
var telnyx = require('telnyx')('KEY017C1DE7B63E8ABC4ECB54DF31105EEC_49fQTrNX8GBmAIk2GgFBCN');
const app = express()
const port = 3000

const telnyxApiBaseUrl = "https://api.telnyx.com/v2"

const incomingWebhookUrlBase = 'http://pockybum522.com:3000`';
const incomingWebhookEndpoint = 'onIncoming/session123';

const assistantIntroText = "Welcome to The Orlando Museum of Art! I can be your assistant during your visit.\n\nAsk me anything from information about an artwork to assistance navigating in the museum.\n\nFor example, you can ask: 'Tell me more about Van Gogh's Starry Night' or 'Where is the nearest water fountain?'\n\nAfter your visit, ask me about the best way to leave a review or feedback!";

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/startListener/:phoneNumber', (req, res) => {

    let formattedPhoneNumber = `+1${ req.params.phoneNumber }`;

    Promise.resolve(
        telnyx.messages.create(
                {
                    'from': '+12182203711', // Your Telnyx number
                    'to': formattedPhoneNumber,
                    'text': assistantIntroText,
                    'webhook_url': `${ incomingWebhookUrlBase }/${ incomingWebhookEndpoint }"`
                })
        )
        .then(() =>
            app.on('event:incoming_message', onIncomingMessage)
        )
        .then(() =>
            res.send(`Listener started and introduction message sent for: ${ formattedPhoneNumber }`))

});

app.get(`/${incomingWebhookEndpoint}`, (req, res) => {

    // Categorize message

    // Build response

    // Send response

})

function onIncomingMessage(){

}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})