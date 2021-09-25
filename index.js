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

function validateMessage(reqBody) {
    return reqBody.data.event_type === "message.received";
}

app.post(`/${incomingWebhookEndpoint}`, (req, res) => {

    // Categorize message
    console.log("Incoming webhook call")
    console.log(req.body)
    console.log(validateMessage(req.body));
    console.log()
    // Build response

    // Send response

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})

/*
{
  data: {
    event_type: 'message.received',
    id: '9d9dfe67-7060-4254-af7e-3fcc61a8d686',
    occurred_at: '2021-09-25T22:12:55.637+00:00',
    payload: {
      cc: [],
      completed_at: null,
      cost: null,
      direction: 'inbound',
      encoding: 'GSM-7',
      errors: [],
      from: [Object],
      id: '3d6bf57e-b2e4-42fb-9dd2-9e024dac6abe',
      media: [],
      messaging_profile_id: '40017c1d-e7c0-4b79-badd-f237ba70c4b6',
      organization_id: '8bc85271-e344-48c3-875b-c22ee9805053',
      parts: 1,
      received_at: '2021-09-25T22:12:55.522+00:00',
      record_type: 'message',
      sent_at: null,
      subject: '',
      tags: [],
      text: 'THE MESSAGE',
      to: [Array],
      type: 'SMS',
      valid_until: null,
      webhook_failover_url: null,
      webhook_url: 'http://pockybum522.com/onIncoming/session136'
    },
    record_type: 'event'
  },
  meta: {
    attempt: 1,
    delivered_to: 'http://pockybum522.com/onIncoming/session136'
  }
}

*/