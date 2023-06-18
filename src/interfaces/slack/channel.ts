interface Channel {
    id: string;
    name: string;
    is_channel: boolean;
    is_group: boolean;
    is_im: boolean;
    created: number;
    is_archived: boolean;
    is_general: boolean;
    unlinked: number;
    name_normalized: string;
    is_shared: boolean;
    parent_conversation: string | null;
    creator: string;
    is_ext_shared: boolean;
    is_org_shared: boolean;
    shared_team_ids: string[];
    pending_shared: any[];
    pending_connected_team_ids: any[];
    is_pending_ext_shared: boolean;
    is_member: boolean;
    is_private: boolean;
    is_mpim: boolean;
    last_read: string;
    topic: { value: string; creator: string; last_set: number };
    purpose: { value: string; creator: string; last_set: number };
    previous_names: string[];
}

export { Channel };
