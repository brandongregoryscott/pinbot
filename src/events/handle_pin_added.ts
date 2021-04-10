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

    const headerAttachment = {
        color: "#d4d4d4",
        blocks: [headerBlock(profile)],
    };
    const footerAttachment = {
        color: "#d4d4d4",
        blocks: [footerBlock(channel, pin)],
    };
    const messageAttachments = innerContent(pin);
    const attachments = [
        headerAttachment,
        ...messageAttachments,
        footerAttachment,
    ];

    console.log("attachments:");
    console.log(JSON.stringify(attachments, undefined, 4));
    await bot.reply(message, {
        attachments,
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
    if (pin.attachments != null && pin.attachments.length > 0) {
        const files = pin.attachments
            .filter(
                (attachment) =>
                    attachment.files != null && attachment.files.length > 0
            )
            .map((attachment) => attachment.files)
            .flat();

        console.log("Files");
        console.log(JSON.stringify(files, undefined, 4));
        const images = files
            .filter((file: any) => file.mimetype.includes("image"))
            .map((file: any) => ({
                color: "#d4d4d4",
                title: {
                    type: "plain_text",
                    text: file.title,
                    emoji: true,
                },
                type: "image",
                image_url: file.permalink,
                alt_text: file.title,
            }));
        console.log("Images");
        console.log(JSON.stringify(images, undefined, 4));
        return images;
    }

    if (pin.blocks != null && pin.blocks.length > 0) {
        console.log("Found blocks");
        console.log(JSON.stringify(pin.blocks, undefined, 4));
        return [
            {
                type: "context",
                elements: pin.blocks,
            },
        ];
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
