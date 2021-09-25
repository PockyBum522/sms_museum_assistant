const express = require('express')
const axios = require('axios')
var telnyx = require('telnyx')('KEY017C1DE7B63E8ABC4ECB54DF31105EEC_49fQTrNX8GBmAIk2GgFBCN');
const app = express()
const port = 3000

const testPhoneNumber = '+14076322207';

const telnyxApiBaseUrl = "https://api.telnyx.com/v2"

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/startListener:phoneNumber', (req, res) => {

  telnyx.messages.create(
      {
        'from': '+12182203711', // Your Telnyx number
        'to': testPhoneNumber,
        'text': 'Hello, World!'
      },
      function(err, response) {
        // asynchronously called
        res.send(respo);
      }
  );

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})