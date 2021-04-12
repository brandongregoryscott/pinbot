import { Middleware, TurnContext, Activity } from "botbuilder-core";
import { BotkitMessage } from "botkit";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

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

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const divider = () => console.log("-".repeat(80));

const logActivity = (activity: Activity) => {
    const { from, type } = activity;

    divider();
    console.log(`Type: ${type}`);
    console.log(`From: ${from.id}`);
    console.log(JSON.stringify(activity, undefined, 4));
    divider();
};

const logReply = async (
    src: Partial<BotkitMessage>,
    resp: Partial<BotkitMessage> | string
): Promise<any> => {
    console.log(`Replying in ${src.channel}`);
    console.log(
        typeof resp === "string" ? resp : JSON.stringify(resp, undefined, 4)
    );
    divider();
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { LoggerMiddleware };

// #endregion Exports
