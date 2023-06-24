import type { PinType } from "../../enums/pin-type";
import type { Attachment } from "./attachment";
import type { File } from "./file";

interface Message {
    attachments?: Attachment[];
    blocks?: unknown[];
    files?: File[];
    permalink: string;
    pinned_to?: string[];
    team: string;
    text: string;
    ts: string;
    type: PinType;
    upload?: boolean;
    user: string;
}

export type { Message };
