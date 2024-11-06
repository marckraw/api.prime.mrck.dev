import {Hono} from "hono";
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {aiDevsExampleSchema} from "./validators/aiDevs";
import { POLIGON_API_KEY, POLIGON_API_URL } from "./constants";
import { POLIGON_API_VERIFY_URL } from "./constants";

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
            }
            ),
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



export default aiDevs