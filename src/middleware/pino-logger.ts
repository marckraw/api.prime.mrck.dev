import { logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import {config} from "../config.env";

export function pinoLogger() {
    return logger({
        pino: pino({
            level: config.LOG_LEVEL || "info",
        }, config.NODE_ENV === "production" ? undefined : pretty()),
        http: {
            reqId: () => crypto.randomUUID(),
        },
    });
}