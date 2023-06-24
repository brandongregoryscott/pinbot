import type { Middleware, TurnContext, Activity } from "botbuilder-core";
import { DEBUG } from "../utilities/config";

class LoggerMiddleware implements Middleware {
    async onTurn(
        context: TurnContext,
        next: () => Promise<void>
    ): Promise<void> {
        if (DEBUG) {
            logActivity(context.activity);
        }

        await next();
    }
}

const divider = () => console.log("-".repeat(80));

const logActivity = (activity: Activity) => {
    const { from, type } = activity;

    divider();
    console.log(`Type: ${type}`);
    console.log(`From: ${from.id}`);
    console.log(JSON.stringify(activity, undefined, 4));
};

export { LoggerMiddleware };
