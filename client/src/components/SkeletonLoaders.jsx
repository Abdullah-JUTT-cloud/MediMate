import { Skeleton } from "@mui/material";

/**
 * Common styles for our skeletons to match the app's theme.
 * We use custom background colors to match the theme's card and border colors.
 */
const skeletonSx = {
  bgcolor: "color-mix(in srgb, var(--color-text-primary) 8%, transparent)",
  borderRadius: "0.75rem",
  "&::after": {
    background:
      "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-text-primary) 4%, transparent), transparent)",
  },
};

export const CardSkeleton = () => (
  <div
    className="rounded-2xl p-4 sm:p-5 transition-all w-full"
    style={{
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
    }}
  >
    <div className="mb-3">
      <Skeleton
        variant="rectangular"
        width={40}
        height={40}
        sx={{ ...skeletonSx, borderRadius: "0.75rem" }}
      />
    </div>
    <Skeleton
      variant="text"
      width="60%"
      height={32}
      sx={{ ...skeletonSx, marginBottom: "4px" }}
    />
    <Skeleton variant="text" width="40%" height={20} sx={skeletonSx} />
    <Skeleton
      variant="text"
      width="30%"
      height={16}
      sx={{ ...skeletonSx, marginTop: "4px" }}
    />
  </div>
);

export const RowSkeleton = ({ hasAvatar = true }) => (
  <div
    className="rounded-xl p-3 sm:p-4 transition-all flex items-center gap-4 w-full"
    style={{
      background: "color-mix(in srgb, var(--color-bg) 65%, var(--color-card))",
      border: "1px solid var(--color-border)",
    }}
  >
    {hasAvatar && (
      <Skeleton
        variant="circular"
        width={36}
        height={36}
        sx={skeletonSx}
        className="shrink-0"
      />
    )}
    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
      <div className="space-y-1">
        <Skeleton variant="text" width="80%" height={20} sx={skeletonSx} />
        <Skeleton
          variant="text"
          width="50%"
          height={14}
          sx={skeletonSx}
          className="sm:hidden"
        />
      </div>
      <Skeleton
        variant="text"
        width="70%"
        height={20}
        sx={skeletonSx}
        className="hidden sm:block"
      />
      <Skeleton
        variant="text"
        width="60%"
        height={20}
        sx={skeletonSx}
        className="hidden sm:block"
      />
      <div className="flex justify-end sm:justify-start">
        <Skeleton
          variant="rectangular"
          width={60}
          height={24}
          sx={{ ...skeletonSx, borderRadius: "9999px" }}
        />
      </div>
    </div>
  </div>
);

export const AppointmentRowSkeleton = () => (
  <div
    className="flex items-center gap-3 p-3 rounded-xl transition-all"
    style={{
      background: "color-mix(in srgb, var(--color-bg) 65%, var(--color-card))",
      border: "1px solid var(--color-border)",
    }}
  >
    <Skeleton
      variant="rectangular"
      width={32}
      height={32}
      sx={{ ...skeletonSx, borderRadius: "0.5rem" }}
      className="shrink-0"
    />
    <div className="flex-1 min-w-0 space-y-1">
      <Skeleton variant="text" width="60%" height={18} sx={skeletonSx} />
      <Skeleton variant="text" width="40%" height={14} sx={skeletonSx} />
    </div>
    <Skeleton
      variant="rectangular"
      width={45}
      height={20}
      sx={{ ...skeletonSx, borderRadius: "9999px" }}
      className="shrink-0"
    />
  </div>
);

export const ChartSkeleton = () => (
  <div className="w-full h-[200px] flex items-end gap-2 px-2 pt-4">
    {[...Array(12)].map((_, i) => (
      <Skeleton
        key={i}
        variant="rectangular"
        sx={{
          ...skeletonSx,
          flex: 1,
          height: `${28 + ((i * 11) % 48)}%`,
          borderRadius: "4px 4px 0 0",
        }}
      />
    ))}
  </div>
);

export const ProfileHeaderSkeleton = () => (
  <div
    className="rounded-2xl p-5 sm:p-6 mb-5"
    style={{
      background: "var(--color-card)",
      border: "1px solid var(--color-border)",
    }}
  >
    <div className="flex items-start gap-4 mb-5">
      <Skeleton
        variant="rectangular"
        width={56}
        height={56}
        sx={{ ...skeletonSx, borderRadius: "1rem" }}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton variant="text" width="40%" height={28} sx={skeletonSx} />
        <Skeleton variant="text" width="30%" height={20} sx={skeletonSx} />
        <div className="flex gap-2 mt-2">
          <Skeleton
            variant="rectangular"
            width={80}
            height={24}
            sx={{ ...skeletonSx, borderRadius: "9999px" }}
          />
          <Skeleton
            variant="rectangular"
            width={80}
            height={24}
            sx={{ ...skeletonSx, borderRadius: "9999px" }}
          />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Skeleton
          variant="rectangular"
          width={70}
          height={36}
          sx={{ ...skeletonSx, borderRadius: "0.75rem" }}
        />
        <Skeleton
          variant="rectangular"
          width={120}
          height={36}
          sx={{ ...skeletonSx, borderRadius: "0.75rem" }}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-3 rounded-xl"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Skeleton
            variant="text"
            width="40%"
            height={14}
            sx={{ ...skeletonSx, marginBottom: "4px" }}
          />
          <Skeleton variant="text" width="70%" height={20} sx={skeletonSx} />
        </div>
      ))}
    </div>
  </div>
);

export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton variant="text" width="30%" height={16} sx={skeletonSx} />
    <Skeleton
      variant="rectangular"
      width="100%"
      height={44}
      sx={{ ...skeletonSx, borderRadius: "0.75rem" }}
    />
  </div>
);
