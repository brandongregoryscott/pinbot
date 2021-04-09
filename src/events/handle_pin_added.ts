import { Botkit, BotkitHandler } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { CoreUtils } from "../utilities/core-utils";

const handlePinAdded: SlackBotkitHandler = async (bot, message) => {
    const { item } = message;
    const pin = item.message;
    console.log("handlePinAdded", pin);
    const userResponse = (await bot.api.users.info({ user: pin.user })) as any;
    const profile = userResponse.user.profile;

    const conversationResponse = await bot.api.conversations.info({
        channel: item.channel,
    });
    const { channel } = conversationResponse;

    // BSCOTT - If pin.files has values, attach them outside of the first 'blocks' attachment and append footer

    await bot.reply(message, {
        attachments: [
            {
                color: "#d4d4d4",
                blocks: [
                    headerBlock(profile),
                    ...innerContent(pin),
                    footerBlock(channel, pin),
                ],
            },
        ],
    });
};

module.exports = function (controller: Botkit) {
    controller.on("pin_added", handlePinAdded as BotkitHandler);
};

const footerBlock = (channel, pin) => ({
    type: "context",
    elements: [
        {
            type: "mrkdwn",
            text: `Posted in *#${channel.name}*`,
        },
        {
            type: "mrkdwn",
            text: "*|*",
        },
        {
            type: "mrkdwn",
            text: `_${CoreUtils.toDate(pin.ts)}_`,
        },
    ],
});

const headerBlock = (profile) => ({
    type: "context",
    elements: [
        {
            type: "image",
            image_url: profile.image_32,
            alt_text: "user avatar",
        },
        {
            type: "mrkdwn",
            text: `*${profile.display_name ?? profile.real_name}*`,
        },
    ],
});

const innerContent = (pin) => {
    if (pin.blocks != null) {
        return pin.blocks;
    }

    if (pin.files != null) {
        const output = pin.files
            .filter((file: any) => file.mimetype.includes("image"))
            .map((file: any) => ({
                type: "image",
                image_url: file.permalink_public,
                alt_text: file.title,
            }));

        console.log("output:", output);
        return output;
    }

    return [
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: pin.text,
                },
            ],
        },
    ];
};
