export default function AnimatedTagline({ text }: { text: string }) {
  return (
    <p className="mt-4 font-inter text-xs font-semibold uppercase tracking-[0.25em] text-ink/55">
      {text}
    </p>
  );
}
