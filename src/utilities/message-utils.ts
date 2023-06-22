import { Message, SlackMessageDto } from "slack-block-builder";

const buildPinMessage = (
    permalink: string | undefined
): Readonly<SlackMessageDto> => Message({ text: permalink }).buildToObject();

export { buildPinMessage };
