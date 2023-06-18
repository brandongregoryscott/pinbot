import { Attachment } from "../interfaces/slack/attachment";
import { Channel } from "../interfaces/slack/channel";
import { File } from "../interfaces/slack/file";
import { Message } from "../interfaces/slack/message";
import { Profile } from "../interfaces/slack/profile";
import {
    Message as MessageBuilder,
    Blocks,
    Bits,
    Md,
    SlackMessageDto,
} from "slack-block-builder";
import { formatTimestamp } from "./core-utils";

const ATTACHMENT_COLOR = "#d4d4d4";

const buildPinReply = (message: Message, channel: Channel, profile: Profile) =>
    MessageBuilder().attachments(
        Bits.Attachment({ color: ATTACHMENT_COLOR }).blocks(
            Blocks.Context().elements(
                Blocks.Image({
                    imageUrl: profile.image_32,
                    altText: "User avatar",
                }),
                Md.bold(profile.display_name ?? profile.real_name)
            ),
            Blocks.Context().elements(message.text),
            Blocks.Context().elements(
                Md.channel(channel.id),
                Md.bold("|"),
                Md.italic(formatTimestamp(message.ts))
            )
        )
    );

const toPinReply = (
    message: Message,
    channel: Channel,
    profile: Profile
): Readonly<SlackMessageDto> => {
    const imageFiles = flattenImageFiles(message);

    if (imageFiles.length > 0) {
        return MessageBuilder()
            .text(Md.codeBlock(JSON.stringify(imageFiles, undefined, 4)))
            .buildToObject();
    }

    const builder = buildPinReply(message, channel, profile);
    builder.printPreviewUrl();

    return builder.buildToObject();
};

const flattenImageFiles = (message?: Message): File[] => {
    const attachmentFiles =
        message?.attachments?.flatMap(
            (attachment: Attachment) => attachment.files
        ) ?? [];

    return [...(message?.files ?? []), ...attachmentFiles].filter(
        (file: File) => file != null && file.mimetype?.includes("image")
    );
};

export { toPinReply, flattenImageFiles };
