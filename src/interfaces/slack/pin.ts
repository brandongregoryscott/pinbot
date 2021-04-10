import { PinType } from "../../enums/pin-type";
import { File } from "./file";
import { Message } from "./message";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface Pin {
    channel?: string;
    created: number;
    createdBy: string;
    file?: File;
    message?: Message;
    type: PinType;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Pin };

// #endregion Exports
