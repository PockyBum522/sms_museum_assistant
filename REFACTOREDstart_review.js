require('dotenv').config();

const telnyxApiKey = process.env.TELNYX_API_KEY
const symblAccessToken = process.env.SYMBL_API_KEY

const express = require('express')
const axios = require('axios')
const telnyx = require('telnyx')(telnyxApiKey);
const bodyParser = require('body-parser')

// CONFIGURATION
const expressApp = express()
const port = 80

const responses = {
    400: 'Bad Request! Please refer docs for correct input fields.',
    401: 'Unauthorized. Please generate a new access token.',
    404: 'The conversation and/or it\'s metadata you asked could not be found, please check the input provided',
    429: 'Maximum number of concurrent jobs reached. Please wait for some requests to complete.',
    500: 'Something went wrong! Please contact support@symbl.ai'
}  

const incomingTelnyxWebhookEndpoint = 'onIncoming/session136';

const reviewPromptText = "We hope you had a great time at the museum! Please respond with a detailed review of your visit.";
let formattedPhoneNumber = `+14074632925`;

let lastTenReceivedMessageIDsArray = [];

var bodyParserOptions = {
    inflate: true,
    limit: '100kb',
    type: 'application/json'
};

expressApp.use(bodyParser.json(bodyParserOptions));

// MAIN CALL
startUserReviewProcess();

// Validation logic
function isIncomingMessage(reqBody) {
    return reqBody.data.event_type === "message.received";
}

function messagePreviouslyReceived(reqBody) {

    if(lastTenReceivedMessageIDsArray.includes(reqBody.data.id)) {
        return true;
    }

    lastTenReceivedMessageIDsArray.push(reqBody.data.id);

    return false;
}

// Main function, the endpoint below is called by Telnyx on message response
function startUserReviewProcess(){

    console.log();
    console.log();
    console.log();

    telnyx.messages
        .create(
        {
            'from': '+12182203711', // Your Telnyx number
            'to': formattedPhoneNumber,
            'text': reviewPromptText
        })
        .then(() => {

            console.log(`Review message sent for: ${ formattedPhoneNumber }`)
            console.log(`Now listening for response on: /${incomingTelnyxWebhookEndpoint}`)

        })
        .catch(
            (err) => {
                console.error(err)
        });
};

function createSymblJobFromSmsBody(smsResponseBody){

    return new Promise(
        (resolve, reject) => {
            
            // Symbl workers
            const symblRequestHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${symblAccessToken}`
            };

            const symblSmsSubmitRequestJson = {
                "messages": [
                    {
                        "payload": {
                            "content": smsResponseBody.data.payload.text,
                            "contentType": "text/plain"
                        }
                    }
                ]
            };
            
            console.log(`About to submit job to Symbl.ai from SMS: ${smsResponseBody.data.payload.text}`);

            axios.post('https://api.symbl.ai/v1/process/text', symblSmsSubmitRequestJson, {
                headers: symblRequestHeaders
            })
            .then((res) => {

                let symblConversationId = res.data.conversationId;
                let symblJobId = res.data.jobId;

                console.log(`Returning: ${symblConversationId} ` + symblJobId)
            
                resolve([symblConversationId, symblJobId]);

            }).catch((err) => {
                
                console.error(err);
                reject(err);

            })
    })
}

function getSymblSentiment(symblConversationId) {
    
    return new Promise((resolve, reject) => {

        console.log('Requesting sentiment GET now');

        axios.get(`https://api.symbl.ai/v1/conversations/${symblConversationId}/messages?sentiment=true`, { headers: symblRequestHeaders})
        .then((res) => {
            
            console.log("got further, in then beyond sentiment get")

            resolve(res);

        }).catch((err) => {
            console.error(err);
            reject(err);
        })       
    })
}
    
// Webhook endpoint that takes in all Telnyx responses
expressApp.post(`/${incomingTelnyxWebhookEndpoint}`, (req, res) => {
    
    if(!isIncomingMessage(req.body) || messagePreviouslyReceived(req.body)) {
        
        return;
    }

    console.log(`Creating job from SMS: ${req.body.data.payload.text}`)

    // Otherwise:
    createSymblJobFromSmsBody(req.body)
    .then((response) => {
            
        let symblConversationId = response.values[0];
        let symblJobId = response.values[1];

        console.log(`Job created from SMS body, conversation ID: ${ symblConversationId } and jobId: ${ symblJobId }`);           

    }).catch((err) => console.error(err));    

    // Send response

})

// Webhook endpoint that takes in all Symbl job updates
expressApp.post(`/symblJobUpdatesWebhook44`, (req, res) => {
    
    console.log(req.body);

    if (req.body.status === 'completed'){
        console.log ("Run job sentiment get here")
    }

})

expressApp.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})