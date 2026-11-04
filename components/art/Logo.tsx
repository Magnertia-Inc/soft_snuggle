interface Props {
  className?: string;
}

/** The Veviba wordmark (transparent background). */
export function Logo({ className = "h-9" }: Props) {
  return (
    <img
      src="/logo.webp"
      alt="Veviba"
      width={1111}
      height={543}
      className={`w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
