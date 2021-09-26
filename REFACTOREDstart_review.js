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

const incomingWebhookEndpoint = 'onIncoming/session136';

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
            console.log(`Now listening for response on: /${incomingWebhookEndpoint}`)

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

function createSymblJobFromSmsBody(smsReqBody){

    return new Promise(function(resolve, reject) {
        
        const symblSmsSubmitRequestJson = {
            "messages": [
                {
                    "payload": {
                        "content": req.body.data.payload.text,
                        "contentType": "text/plain"
                    }
                }
            ]
        };
        
        console.log('First post');

        axios.post('https://api.symbl.ai/v1/process/text', symblSmsSubmitRequestJson, {
            headers: symblRequestHeaders
        })
        .then((res) => {

            let symblConversationId = res.data.conversationId;
            let symblJobId = res.data.jobId;

            console.log(`Returning conversation ID: ${ symblConversationId } and jobId: ${ symblJobId }`);
        
            resolve([symblConversationId, symblJobId])

        }).catch((err) => {
            console.error(err);
        })
    }
}

// async function makeSymblSentimentRequest() {

//     const finished = await checkIfSymblJobIsCompleted();

//     if(finished) {
//         axios.get(`https://api.symbl.ai/v1/conversations/${symblConversationId}/messages?sentiment=true`, { headers: symblRequestHeaders})
//         .then((res) => {
//             console.log("do something with the sentiment");
//             console.log(res);
//         }).catch((err) => {
//             console.error(err);
//         });
//     }
// }

// async function checkIfSymblJobIsCompleted() {

//     console.log('starting into loop');

//     let result = {data: {status: {}}};

//     const loop = async testLoop => {
//         do {

//             // Check job status until status is completed, lazy, but this is demo
//             result = await axios.get(`https://api.symbl.ai/v1/job/${symblJobId}`, { headers: symblRequestHeaders }).catch((err) => {console.error(err)});
//             console.log(`Status: ${result.data.status}`);
//             setTimeout(() => {}, 200);

//         } while(result.data.status !== 'completed')

//         // Job has completed now!
//         console.log("got past while loop");
        
//         return;

//     }
//     loop();

//     return result.data.status;
// }

// Webhook endpoint that takes in all Telnyx responses
expressApp.post(`/${incomingWebhookEndpoint}`, (req, res) => {
    
    if(!isIncomingMessage(req.body) || messagePreviouslyReceived(req.body)) {
        return;
    }

    // Otherwise:
    createSymblJobFromSmsBody(req.body)
    .then(
        (conversationId, jobId) => console.log(`Promise fulfilled, conversationId: ${conversationId} and jobId on the other side is ${jobId}`)
        //makeSymblSentimentRequest(symblConversationId)
    );    

    // Send response

})

expressApp.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})