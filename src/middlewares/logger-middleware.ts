import { Middleware, TurnContext, Activity } from "botbuilder-core";

class LoggerMiddleware implements Middleware {
    constructor() {}

    async onTurn(
        context: TurnContext,
        next: () => Promise<void>
    ): Promise<void> {
        const debug = process.env.DEBUG === "true";
        if (debug) {
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
    divider();
};

export { LoggerMiddleware };
