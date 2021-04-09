// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const CoreUtils = {
    toDate(timestamp: string): Date {
        const date = new Date();
        date.setTime(Number(timestamp));

        return date;
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
