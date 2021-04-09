import { SlackBotWorker } from "botbuilder-adapter-slack";
import { PinsListResponse } from "../interfaces/slack/pins-list-response";
import { Botkit, BotkitHandler, BotkitMessage, BotWorker } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { CoreUtils } from "../utilities/core-utils";
import { Pin } from "../interfaces/slack/pin";

const UNPIN_ALL_KEY = "unpin_all";

const handleBlockActions: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    const { actions } = message?.incoming_message?.channelData;
    if (actions == null || actions.length <= 0) {
        return;
    }

    const confirmed = actions[0].value === "true";

    if (confirmed) {
        const pinResponse = (await bot.api.pins.list({
            channel: message.channel,
        })) as PinsListResponse;

        console.log("---------------pinResponse-----------------");
        console.log(pinResponse);

        const pins = pinResponse.items.filter(
            (pin: Pin) => pin.channel != null
        );

        try {
            pins.forEach(async (pin: Pin) => {
                await CoreUtils.sleep(1500);

                if (pin.message != null) {
                    console.log(
                        "------------------pin.message------------------------"
                    );
                    console.log(JSON.stringify(pin.message, undefined, 4));
                }

                if (pin.file != null) {
                    console.log(
                        "------------------pin.file------------------------"
                    );
                    console.log(JSON.stringify(pin.file, undefined, 4));
                }
                await bot.api.pins.remove({
                    channel: pin.channel!,
                    timestamp: pin.message?.ts ?? pin.file?.ts,
                });
            });
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

module.exports = function (controller: Botkit) {
    controller.on("block_actions", handleBlockActions as BotkitHandler);

    controller.hears("unpin all", "direct_mention", async (bot, message) => {
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
    });
};
