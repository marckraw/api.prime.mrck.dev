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



export default aiDevs