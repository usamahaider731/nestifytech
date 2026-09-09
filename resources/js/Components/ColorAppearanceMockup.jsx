export function normalizeAppearanceColors(colors = {}) {
    return {
        primary: colors.primary || '#7367f0',
        secondary: colors.secondary || '#7983a7',
        accent: colors.accent || '#2f3349',
        res: colors.res || colors.text || '#b6bee3',
        text: colors.text || colors.res || '#7c7c7c',
        bg: colors.bg || '#25293c',
        dynamic: colors.dynamic || '#3a3d53',
        heading: colors.heading || '#d0d4f1',
        permanent: colors.permanent || '#434968',
    };
}

export default function ColorAppearanceMockup({ colors = {}, compact = false, className = '' }) {
    const theme = normalizeAppearanceColors(colors);

    if (compact) {
        return (
            <div
                className={`w-16 h-11 rounded-lg overflow-hidden border border-black/5 shadow-sm shrink-0 ${className}`}
                style={{ backgroundColor: theme.bg }}
            >
                <div className="h-2.5 px-1 flex items-center" style={{ backgroundColor: theme.primary }}>
                    <span className="size-1 rounded-full bg-white/50" />
                </div>
                <div className="p-1 flex gap-1 h-[calc(100%-10px)]">
                    <div className="w-1/3 rounded-sm" style={{ backgroundColor: theme.accent }} />
                    <div className="flex-1 flex flex-col gap-0.5 justify-center">
                        <div className="h-1 w-full rounded-sm opacity-80" style={{ backgroundColor: theme.heading }} />
                        <div className="h-1 w-2/3 rounded-sm opacity-60" style={{ backgroundColor: theme.res }} />
                        <div className="h-1.5 w-1/2 rounded-sm mt-0.5" style={{ backgroundColor: theme.primary }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl overflow-hidden border border-white/10 shadow-md w-full ${className}`}
            style={{ backgroundColor: theme.bg }}
        >
            <div className="h-8 px-3 flex items-center justify-between" style={{ backgroundColor: theme.primary }}>
                <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-white/30" />
                    <span className="size-2 rounded-full bg-white/30" />
                    <span className="size-2 rounded-full bg-white/30" />
                </div>
                <div className="h-2 w-12 rounded-full bg-white/25" />
            </div>
            <div className="p-3 flex gap-3 min-h-[88px]">
                <div className="w-[28%] rounded-lg p-2 space-y-1.5 shrink-0" style={{ backgroundColor: theme.accent }}>
                    <div className="h-1.5 w-full rounded" style={{ backgroundColor: theme.permanent }} />
                    <div className="h-1.5 w-4/5 rounded opacity-70" style={{ backgroundColor: theme.dynamic }} />
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="h-2 w-3/4 rounded" style={{ backgroundColor: theme.heading }} />
                    <div className="h-1.5 w-full rounded opacity-70" style={{ backgroundColor: theme.res }} />
                    <div className="h-5 w-1/2 rounded-md mt-auto" style={{ backgroundColor: theme.primary }} />
                </div>
            </div>
        </div>
    );
}
