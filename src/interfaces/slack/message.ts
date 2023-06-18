import { PinType } from "../../enums/pin-type";
import { Attachment } from "./attachment";
import { File } from "./file";

interface Message {
    attachments?: Attachment[];
    blocks?: any[];
    files?: File[];
    user: string;
    team: string;
    text: string;
    ts: string;
    permalink: string;
    pinned_to?: string[];
    upload?: boolean;
    type: PinType;
}

export { Message };
