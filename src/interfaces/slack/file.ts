// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface File {
    id: string;
    created: number;
    timestamp: number;
    name: string;
    title: string;
    mimetype: string;
    filetype: string;
    pretty_type: string;
    user: string;
    editable: boolean;
    size: number;
    mode: string;
    is_external: boolean;
    external_type: string;
    is_public: boolean;
    public_url_shared: boolean;
    display_as_bot: boolean;
    username: string;
    url_private: string;
    url_private_download: string;
    thumb_64: string;
    thumb_80: string;
    thumb_360: string;
    thumb_360_w: number;
    thumb_360_h: number;
    thumb_480: string;
    thumb_480_w: number;
    thumb_480_h: number;
    original_w: number;
    original_h: number;
    thumb_160: string;
    thumb_tiny: string;
    permalink: string;
    permalink_public: string;
    is_starred: boolean;
    has_rich_preview: boolean;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { File };

// #endregion Exports
