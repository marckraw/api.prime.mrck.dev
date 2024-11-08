import {Hono} from "hono";
import {zValidator} from "@hono/zod-validator";
import { googleSchema } from "./validators/google";

const googleRouter = new Hono()

googleRouter.post('/',
    zValidator('json', googleSchema),
    async (c) => {
        const requestData = c.req.valid('json');

        console.log(requestData);

        return c.json({response: requestData.name});
    }
)



export default googleRouter
