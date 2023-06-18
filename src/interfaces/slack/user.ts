import { Profile } from "./profile";

interface User {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color: string;
    profile: Profile;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    is_app_user: boolean;
    updated: number;
    is_email_confirmed: boolean;
    who_can_share_contact_card: string;
}

export { User };
