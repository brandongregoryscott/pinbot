interface Channel {
    created: number;
    creator: string;
    id: string;
    is_archived: boolean;
    is_channel: boolean;
    is_ext_shared: boolean;
    is_general: boolean;
    is_group: boolean;
    is_im: boolean;
    is_member: boolean;
    is_mpim: boolean;
    is_org_shared: boolean;
    is_pending_ext_shared: boolean;
    is_private: boolean;
    is_shared: boolean;
    last_read: string;
    name: string;
    name_normalized: string;
    parent_conversation: string | null;
    pending_connected_team_ids: unknown[];
    pending_shared: unknown[];
    previous_names: string[];
    purpose: { creator: string; last_set: number; value: string };
    shared_team_ids: string[];
    topic: { creator: string; last_set: number; value: string };
    unlinked: number;
}

export type { Channel };
