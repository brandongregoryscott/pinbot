// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const CoreUtils = {
    formatTimestamp(timestamp: string): string {
        const date = new Date(Number(timestamp) * 1000); // JavaScript expects timestamps in milliseconds
        return date.toDateString();
    },
    async sleep(milliseconds: number): Promise<void> {
        return new Promise<void>((resolve) =>
            setTimeout(resolve, milliseconds)
        );
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { CoreUtils };

// #endregion Exports
