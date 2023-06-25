import type { PinsListResponse } from "../interfaces/slack/pins-list-response";
import type { Botkit } from "botkit";
import type { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import type { Pin } from "../interfaces/slack/pin";
import { throttle } from "../utilities/core-utils";
import { hears, on } from "../utilities/botkit-utils";

const UNPIN_ALL_KEY = "unpin_all";

const handleBlockActions: SlackBotkitHandler = async (bot, message) => {
    const { actions } = message?.incoming_message?.channelData;
    if (actions == null || actions.length <= 0) {
        return;
    }

    const confirmed = actions[0].value === "true";

    if (confirmed) {
        const pinResponse = (await bot.api.pins.list({
            channel: message.channel,
        })) as PinsListResponse;

        const pins = pinResponse.items.filter(
            (pin: Pin) => pin.channel != null
        );

        const removePinPromises = pins.map(
            throttle(async (pin: Pin) =>
                bot.api.pins.remove({
                    channel: pin.channel ?? "",
                    timestamp:
                        pin.message?.ts ?? pin.file?.timestamp.toString(),
                })
            )
        );

        try {
            await Promise.all(removePinPromises);
            await bot.replyInteractive(
                message,
                "Finished unpinning everything. Goodbye!"
            );
        } catch (error) {
            await bot.replyInteractive(
                message,
                `Woops - something went wrong.\n \`\`\`${JSON.stringify(
                    error,
                    undefined,
                    4
                )}\`\`\``
            );
        }

        return;
    }

    await bot.replyInteractive(
        message,
        "Ok, I won't bother unpinning anything."
    );
    return;
};

const handleUnpinAll = (controller: Botkit) => {
    on("block_actions", handleBlockActions)(controller);
    hears("unpin all", "direct_mention", async (bot, message) => {
        await bot.reply(message, {
            blocks: [
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text:
                                "*Are you sure you want to unpin all items in this channel?*",
                        },
                    ],
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Yes, unpin all",
                            },
                            action_id: `${UNPIN_ALL_KEY}:confirm`,
                            style: "primary",
                            value: "true",
                        },
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "No, cancel",
                            },
                            action_id: `${UNPIN_ALL_KEY}:cancel`,
                            style: "danger",
                            value: "false",
                        },
                    ],
                },
            ],
        });
    })(controller);
};

export default handleUnpinAll;
