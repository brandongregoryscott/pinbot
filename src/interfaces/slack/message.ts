import { PinType } from "../../enums/pin-type";
import { Attachment } from "./attachment";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface Message {
    attachments?: Attachment[];
    user: string;
    team: string;
    text: string;
    ts: string;
    permalink: string;
    pinned_to?: string[];
    type: PinType;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Message };

// #endregion Exports
