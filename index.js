const express = require('express')
const axios = require('axios')
const telnyx = require('telnyx')('KEY017C1DE7B63E8ABC4ECB54DF31105EEC_49fQTrNX8GBmAIk2GgFBCN');
const bodyParser = require('body-parser')

const app = express()
const port = 80

const incomingWebhookUrlBase = 'http://pockybum522.com';
const incomingWebhookEndpoint = 'onIncoming/session136';

const assistantIntroText = "Welcome to The Orlando Museum of Art! I can be your assistant during your visit.\n\nAsk me anything from information about an artwork to assistance navigating in the museum.\n\nFor example, you can ask: 'Tell me more about Van Gogh's Starry Night' or 'Where is the nearest water fountain?'\n\nAfter your visit, ask me about the best way to leave a review or feedback!";

var options = {
    inflate: true,
    limit: '100kb',
    type: 'application/json'
};

app.use(bodyParser.json(options));


app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/startListener/:phoneNumber', (req, res) => {

    let formattedPhoneNumber = `+1${ req.params.phoneNumber }`;

    telnyx.messages
        .create(
        {
            'from': '+12182203711', // Your Telnyx number
            'to': formattedPhoneNumber,
            'text': assistantIntroText
        })
        .then(() => {
            res.send(`Listener started and introduction message sent for: ${ formattedPhoneNumber }`)
            console.log(`Listener started and introduction message sent for: ${ formattedPhoneNumber }`)
            console.log(`Now listening for response on: /${incomingWebhookEndpoint}`)
        })
        .catch(
            (err) => {
                console.log(`BUILT CALLBACK URL: ${incomingWebhookUrlBase}/${incomingWebhookEndpoint}`)
                console.error(err)
            }
        )

});

app.post(`/${incomingWebhookEndpoint}`, (req, res) => {

    // Categorize message
    console.log("Incoming webhook call")
    console.log(req.body)
    console.log()
    // Build response

    // Send response

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})