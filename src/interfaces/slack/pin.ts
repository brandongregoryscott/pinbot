import { PinType } from "../../enums/pin-type";
import { File } from "./file";
import { Message } from "./message";

interface Pin {
    channel?: string;
    created: number;
    createdBy: string;
    file?: File;
    message?: Message;
    type: PinType;
}

export { Pin };
