import {Hono} from "hono";
import {streamText, stream} from 'hono/streaming'
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {agiRequestSchema, agiStreamRequestSchema} from "./validators/agi";
import { mainSystemMessage } from "../../../anton-config/config";
import { config } from "../../../config.env";

const agiRouter = new Hono()

agiRouter.post('/',
    zValidator('json', agiRequestSchema),
    async (c) => {
        const requestData = c.req.valid('json');

        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: config.ANTHROPIC_API_KEY,
            type: "anthropic",
        });

        if (anton) {
            if (requestData.systemMessage) {
                anton.setSystemMessage?.(requestData.systemMessage)
            } else {
                anton.setSystemMessage?.(mainSystemMessage)
            }
        }

        const response = await anton.chat({
            messages: requestData.messages,
        });

        return c.json({response});
    }
)

export default agiRouter
