interface Profile {
    avatar_hash: string;
    display_name: string;
    display_name_normalized: string;
    fields: unknown | null;
    first_name: string;
    image_1024: string;
    image_192: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_512: string;
    image_72: string;
    image_original: string;
    is_custom_image: boolean;
    last_name: string;
    phone: string;
    real_name: string;
    real_name_normalized: string;
    skype: string;
    status_emoji: string;
    status_expiration: number;
    status_text: string;
    status_text_canonical: string;
    team: string;
    title: string;
}

export type { Profile };
