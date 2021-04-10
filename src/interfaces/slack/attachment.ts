import { File } from "./file";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface Attachment {
    fallback: string;
    ts: string;
    author_id: string;
    author_subname: string;
    channel_id: string;
    channel_name: string;
    is_msg_unfurl: true;
    author_name: string;
    author_link: string;
    author_icon: string;
    mrkdwn_in: string[];
    files: File[];
    color: string;
    from_url: string;
    is_share: boolean;
    footer: string;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Attachment };

// #endregion Exports
