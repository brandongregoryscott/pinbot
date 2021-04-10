import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { Channel } from "../interfaces/slack/channel";
import { File } from "../interfaces/slack/file";
import { Message } from "../interfaces/slack/message";
import { Pin } from "../interfaces/slack/pin";
import { Profile } from "../interfaces/slack/profile";
import { ControllerUtils } from "../utilities/controller-utils";
import { CoreUtils } from "../utilities/core-utils";

const handlePinAdded: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    const item = message.item as Pin;
    const pin: Message = item.message!;
    const userResponse = (await bot.api.users.info({ user: pin.user })) as any;
    const profile = userResponse.user.profile as Profile;
    console.log("profile:", profile);
    const conversationResponse = await bot.api.conversations.info({
        channel: item.channel!,
    });
    const channel = conversationResponse.channel as Channel;

    console.log("channel:", channel);
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

    await bot.reply(message, {
        attachments,
    });
};

const footerBlock = (channel: Channel, pin: Message) => ({
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

const headerBlock = (profile: Profile) => ({
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

const innerContent = (pin: Message) => {
    if (pin.attachments != null && pin.attachments.length > 0) {
        const files = pin.attachments
            .filter(
                (attachment) =>
                    attachment.files != null && attachment.files.length > 0
            )
            .map((attachment) => attachment.files)
            .flat();

        const images = files
            .filter((file: File) => file.mimetype.includes("image"))
            .map((file: File) => ({
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
        return images;
    }

    if (pin.blocks != null && pin.blocks.length > 0) {
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

export default (controller: Botkit) =>
    ControllerUtils.on(controller, "pin_added", handlePinAdded);
