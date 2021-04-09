import { PinType } from "../../enums/pin-type";
import { Message } from "./message";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface Pin {
    channel?: string;
    created: number;
    createdBy: string;
    file?: any;
    message?: Message;
    type: PinType;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Pin };

// #endregion Exports
