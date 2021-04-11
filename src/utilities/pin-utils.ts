import { Attachment } from "../interfaces/slack/attachment";
import { Channel } from "../interfaces/slack/channel";
import { File } from "../interfaces/slack/file";
import { Message } from "../interfaces/slack/message";
import { Pin } from "../interfaces/slack/pin";
import { Profile } from "../interfaces/slack/profile";
import { CoreUtils } from "./core-utils";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const ATTACHMENT_COLOR = "#d4d4d4";

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const PinUtils = {
    toMessage(pin: Message, channel: Channel, profile: Profile) {
        return {
            attachments: [
                {
                    // color: ATTACHMENT_COLOR,
                    blocks: [_toHeaderBlock(profile)],
                },
                ..._toMessageAttachments(pin),
                {
                    // color: ATTACHMENT_COLOR,
                    blocks: [_toFooterBlock(channel, pin)],
                },
            ],
        };
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const flattenImageFiles = (pin: Message): File[] => {
    const attachmentFiles =
        pin?.attachments?.flatMap(
            (attachment: Attachment) => attachment.files
        ) ?? [];
    // if (pin.attachments != null && pin.attachments.length > 0) {
    //     const files = pin.attachments
    //         .filter(
    //             (attachment) =>
    //                 attachment.files != null && attachment.files.length > 0
    //         )
    //         .map((attachment) => attachment.files)
    //         .flat();
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

const _toMessageAttachments = (pin: Message) => {
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
                // color: ATTACHMENT_COLOR,
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

    // if (pin.blocks != null && pin.blocks.length > 0) {
    //     return pin.blocks;
    // return [
    //     {
    //         type: "context",
    //         elements: pin.blocks,
    //     },
    // ];
    // }

    return [
        {
            // color: ATTACHMENT_COLOR,
            blocks: [
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: pin.text,
                        },
                    ],
                },
            ],
        },
    ];
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { PinUtils };

// #endregion Exports
