const express = require('express')
const axios = require('axios')
const telnyx = require('telnyx')('KEY017C1DE7B63E8ABC4ECB54DF31105EEC_49fQTrNX8GBmAIk2GgFBCN');
const bodyParser = require('body-parser')

// CONFIGURATION
const expressApp = express()
const port = 80

const symblAccessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjQ2ODk5NzY4NDAxNTkyMzIiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiWVlrakVPVEZZQzZUQmVhY2VJQ3hoMm1oZ0c4SFJ5ZmlAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjMyNjEwOTI5LCJleHAiOjE2MzI2OTczMjksImF6cCI6IllZa2pFT1RGWUM2VEJlYWNlSUN4aDJtaGdHOEhSeWZpIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.FfT6BBELmimxQcV3Dh2ajYAV3tZTcW8y3ggV6DuCDe10taHABr0apNO4hkeHrw2PFcUeApdd1VjQbafo2HaxQod_1r5d_7UOJvDUFqhmkyaGUWr3pf1zE-Sx0b7d8sh32gMLfz3jnyapIx8WEd2kTowKD23Lm3iKgk28JjygNSUCLFzysrZVYERmPJGeRUSROXW7lYlmNaAgRQ1uQurawTmD1TwhMSctKl8nvLluS_nWwdvX0Op-hPudY1xRW7gNpn3-5_DeFbgut1NpdqQq3nxvkzbMS_9GVon5ojap3ym_CA5Jf3FwADpwPMLoG4vuAECi3MybMs51wteF5rZNBQ';

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
            }
        );
};

// Symbl workers
const symblRequestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${symblAccessToken}`
};

let symblConversationId = null;
let symblJobId = null;

function createSymblJobFromSmsBody(smsReqBody){

    return new Promise(
        (resolve, reject) => {
           
            const symblSmsSubmitRequestJson = {
                "messages": [
                    {
                        "payload": {
                            "content": smsReqBody.data.payload.text,
                            "contentType": "text/plain"
                        }
                    }
                ],
                "webhookUrl" : "http://pockybum522.com/symblJobUpdatesWebhook"
            };
            
            console.log('First');

            axios.post('https://api.symbl.ai/v1/process/text', symblSmsSubmitRequestJson, {
                headers: symblRequestHeaders
            })
            .then((res) => {

                symblConversationId = res.data.conversationId;
                symblJobId = res.data.jobId;
            
                resolve();

            }).catch((err) => {
                
                console.error(err);
                reject(err);

            })        
    })
}

function getSymblSentiment() {
    
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
    
    console.log(`Some incoming nonsense from Telnyx`);           

    if(!isIncomingMessage(req.body) || messagePreviouslyReceived(req.body)) {
        return;
    }

    console.log("...was incoming message, creating job")

    // Otherwise:
    createSymblJobFromSmsBody(req.body)
    .then(
        () => {
            
            console.log(`Job created from SMS body, conversation ID: ${ symblConversationId } and jobId: ${ symblJobId }`);           

        }).catch((err) => console.error(err));    

    // Send response

})

// Webhook endpoint that takes in all Symbl job updates
expressApp.post(`/symblJobUpdatesWebhook`, (req, res) => {
    
    console.log("=======================================================================");
    console.log(req.body);

    if (req.body.status === 'completed'){
        console.log ("Run job sentiment get here")
    }

})

expressApp.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})