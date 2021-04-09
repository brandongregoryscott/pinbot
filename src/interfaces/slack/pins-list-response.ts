import { WebAPICallResult } from "@slack/web-api";
import { Pin } from "./pin";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface PinsListResponse extends WebAPICallResult {
    items: Pin[];
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { PinsListResponse };

// #endregion Exports
