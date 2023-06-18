import { Attachment } from "../interfaces/slack/attachment";
import { Channel } from "../interfaces/slack/channel";
import { File } from "../interfaces/slack/file";
import { Message } from "../interfaces/slack/message";
import { Profile } from "../interfaces/slack/profile";
import { CoreUtils } from "./core-utils";

const ATTACHMENT_COLOR = "#d4d4d4";

const MessageUtils = {
    flattenImageFiles(message?: Message): File[] {
        const attachmentFiles =
            message?.attachments?.flatMap(
                (attachment: Attachment) => attachment.files
            ) ?? [];

        return [...(message?.files ?? []), ...attachmentFiles].filter(
            (file: File) => file != null && file.mimetype?.includes("image")
        );
    },
    toPinReply(message: Message, channel: Channel, profile: Profile): any {
        return {
            attachments: [
                {
                    color: ATTACHMENT_COLOR,
                    blocks: [
                        _toHeaderBlock(profile),
                        ..._toMessageAttachments(message),
                        _toFooterBlock(channel, message),
                    ],
                },
            ],
        };
    },
};

const _toFooterBlock = (channel: Channel, pin: Message) => ({
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
            text: CoreUtils.formatTimestamp(pin.ts),
        },
    ],
});

const _toHeaderBlock = (profile: Profile) => ({
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

const _toMessageAttachments = (pin: Message): any[] => {
    const imageFiles = MessageUtils.flattenImageFiles(pin);
    if (imageFiles.length > 0) {
        const images = imageFiles.map((file: File) => {
            return {
                title: {
                    type: "plain_text",
                    text: file.title,
                    emoji: true,
                },
                type: "image",
                image_url: "https://via.placeholder.com/150",
                alt_text: file.title,
            };
        });
        return images;
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

export { MessageUtils };
