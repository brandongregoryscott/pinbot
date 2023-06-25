import type { File } from "./file";

interface Attachment {
    author_icon: string;
    author_id: string;
    author_link: string;
    author_name: string;
    author_subname: string;
    channel_id: string;
    channel_name: string;
    color: string;
    fallback: string;
    files: File[];
    footer: string;
    from_url: string;
    is_msg_unfurl: true;
    is_share: boolean;
    mrkdwn_in: string[];
    ts: string;
}

export type { Attachment };
