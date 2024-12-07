import {Hono} from "hono";
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {aiDevsExampleSchema} from "./validators/aiDevs";
import { AI_DEVS_API_KEY, AI_DEVS_XYZ_COMPANY_VERIFY_URL, POLIGON_API_KEY, POLIGON_API_URL } from "./constants";
import { POLIGON_API_VERIFY_URL } from "./constants";
import { checkCalculationsErrors } from "./helper";
import { findAndAnswerQuestions } from "./helper";

const aiDevs = new Hono()

aiDevs.post('/example',
    zValidator('json', aiDevsExampleSchema),
    async (c) => {
        const requestData = c.req.valid('json');

        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: process.env.ANTHROPIC_API_KEY as string,
            type: "anthropic",
        });

        const response = await anton.chat({
            messages: requestData.messages,
        });

        return c.json({response});
    }
)

aiDevs.get('/0-1',
    async (c) => {
        const response = await fetch(POLIGON_API_URL + '/dane.txt');
        const data = await response.text();

        const answer = data.split('\n').map(item => item.trim()).filter(item => item !== '');

        const responseFromPoligonApi = await fetch(POLIGON_API_VERIFY_URL, {
            method: 'POST',
            body: JSON.stringify({
                task: "POLIGON",
                apikey: POLIGON_API_KEY,
                answer
            }),
        });

        const responseFromPoligonApiJson = await responseFromPoligonApi.json();

        return c.json({response: responseFromPoligonApiJson});
    }
)

aiDevs.get('/1-1',
    async (c) => {
        const response = await fetch(process.env.AI_DEVS_SYSTEM_ROBOTOW_URL as string);
        const html = await response.text();
        
        // Using regex to parse HTML since we're in an edge environment
        // where DOM parsing libraries may not be available
        const idPattern = /<[^>]*id="([^"]*)"[^>]*>(.*?)<\/[^>]*>/g;
        const matches = [...html.matchAll(idPattern)];
        
        const contentById: Record<string, string[]> = {};
        matches.forEach(match => {
            const id = match[1];
            const fullContent = match[2].trim();
            if (!contentById[id]) {
                contentById[id] = [];
            }
            if (fullContent) {
                contentById[id].push(fullContent);
            }
        });

        const question = contentById['human-question'];
        
        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: process.env.ANTHROPIC_API_KEY as string,
            type: "anthropic",
        });

        const answerResponse: any = await anton.chat({
            messages: [
                {
                    role: "assistant",
                    content: "You are a helpful assistant that can answer questions and help with tasks. Your answers are conscise and to the point, without any additional information.",
                },
                {
                    role: "user",
                    content: question[0]
                }
            ],
        });

        const answer = answerResponse[0].content;

        console.log(process.env.AI_DEVS_SYSTEM_ROBOTOW_URL)

        console.log("To send: ")
        console.log({
            login: process.env.AI_DEVS_SYSTEM_ROBOTOW_URL_LOGIN as string,
            password: process.env.AI_DEVS_SYSTEM_ROBOTOW_URL_PASSWORD as string,
            answer
        })

        const formData = new URLSearchParams();
        formData.append('username', process.env.AI_DEVS_SYSTEM_ROBOTOW_URL_LOGIN as string);
        formData.append('password', process.env.AI_DEVS_SYSTEM_ROBOTOW_URL_PASSWORD as string);
        formData.append('answer', answer);

        const loginToSite = await fetch(process.env.AI_DEVS_SYSTEM_ROBOTOW_URL as string, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const finalAnswer = await loginToSite.text();
        console.log(finalAnswer);

        // Parse HTML string to find href attributes using regex
        const hrefPattern = /href=["']([^"']+)["']/g;
        const hrefMatches = [...finalAnswer.matchAll(hrefPattern)];
        const finalHref = hrefMatches.map(match => match[1]).find(match => match.includes("files"));

        return c.json({response: {question, answer, finalUrl: `${process.env.AI_DEVS_SYSTEM_ROBOTOW_URL as string + finalHref}`}});
    }
)

aiDevs.get('/1-2',
    async (c) => {
        const startMsgID = 0;
        const body = {
            "msgID": startMsgID,
            "text": "READY"
        }

        const robotInstructions = await fetch("https://xyz.ag3nts.org/files/0_13_4b.txt");
        const robotInstructionsText = await robotInstructions.text();

        let verificationResponse = await fetch(AI_DEVS_XYZ_COMPANY_VERIFY_URL, {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const verificationResponseJson = await verificationResponse.json();

        const conversationId = verificationResponseJson.msgID;

        console.log("This is the response and question: ", verificationResponseJson)


        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: process.env.ANTHROPIC_API_KEY as string,
            type: "anthropic",
        });

        if(!anton) {
            return c.json({response: {error: "Something went wrong while creating Anton SDK instance"}}, 500);
        }

        anton.setSystemMessage?.(robotInstructionsText)


        const incorrectPieces = await anton.chat({
            messages: [
                {
                    role: "user",
                    content: "Given your system message find intentionally incorrect pieces of information and return them in a list."
                }
            ]
        })
        

        anton.setSystemMessage?.(`
            Here is the list of intentionally incorrect pieces of information:
            ${incorrectPieces[0].content}
            You will be using them to answer some questions.
            Remember to always speak in english, never in any other language.
            Return always just an answer and nothing more.
            Be concise and straight forward.
            `)

        const antonResponse = await anton.chat({
            messages: [
                {
                    role: "user",
                    content: `
                    Answer the question:
                    <question>
                    ${verificationResponseJson.text}
                    </question>
                    `
                }
            ]
        })

        if(!antonResponse) {
            return c.json({response: {error: "Something went wrong while creating Anton SDK instance"}}, 500);
        }

        console.log("ANSWER: ")
        console.log(antonResponse)


        const response = await fetch(AI_DEVS_XYZ_COMPANY_VERIFY_URL, {
            method: 'POST',
            body: JSON.stringify({
                msgID: conversationId,
                text: antonResponse[0].content
            }),
        })

        const finalResponse = await response.json();

        console.log("This is the final response: ", finalResponse)



        return c.json({response: finalResponse});
    }
)

aiDevs.get('/1-3',
    async (c) => {
        const response = await fetch(`https://centrala.ag3nts.org/data/${process.env.AI_DEVS_API_KEY}/json.txt`)
        const responseJson = await response.json();

        let data = await findAndAnswerQuestions(responseJson)
        data = checkCalculationsErrors(data)
        data = {
            ...data,
            apikey: AI_DEVS_API_KEY
        }

        const finalResponse = await fetch(`https://centrala.ag3nts.org/report`, {
            method: 'POST',
            body: JSON.stringify({
                task: "JSON",
                apikey: AI_DEVS_API_KEY,
                answer: data
            }),
        })

        const finalResponseJson = await finalResponse.json();

        return c.json({response: finalResponseJson});
    }
)

aiDevs.get('/1-4',
    async (c) => {
        const myFinalPromptForRobot = `
        - You are the robot that can move UP, DOWN, RIGHT, LEFT
        - Your job is to return a JSON with list of steps in steps key, comma separated to reach the finish place.
        - map is represented as 2 dimensional array
        - example of 1 step:
        moving UP from the initial position is changing your position ([3,0]) to position: ([2, 0])
        <MAP>
        [
        [ROAD,WALL,ROAD,ROAD,ROAD,ROAD],
        [ROAD,ROAD,ROAD,WALL,ROAD,ROAD],
        [ROAD,WALL,ROAD,WALL,ROAD,ROAD],
        [YOU,WALL,ROAD,ROAD,ROAD,FINISH]
        ]
        </MAP>

        <LEGEND>
        ROAD - Space where you can step in
        WALL - wall, avoid stepping on it at all cost!
        FINISH - Finish position
        YOU - You
        </LEGEND>

        <thinking>your's thinking</thinking>
        <RESULT>
        {
        steps: "UP, RIGHT, etc..."
        }
        </RESULT>
        `
        return c.json({response: myFinalPromptForRobot});
    }
)






export default aiDevs