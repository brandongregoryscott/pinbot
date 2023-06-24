import type { PinType } from "../../enums/pin-type";
import type { File } from "./file";
import type { Message } from "./message";

interface Pin {
    channel?: string;
    created: number;
    createdBy: string;
    file?: File;
    message?: Message;
    type: PinType;
}

export type { Pin };
