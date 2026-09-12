import { cn } from "@/lib/cn";

export function TemplateFrame({
  id,
  name,
  className,
  scale = "card",
  eager,
}: {
  id: string;
  name: string;
  className?: string;
  scale?: "card" | "feature" | "full";
  eager?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#141020]", className)}>
      {/* The multiplier decides the viewport width the template is laid out at,
          which is the whole game: at 200% a 1200px slot renders the page as if
          the browser were 2400px wide, and every template's max-width layout
          strands its content in the middle of an empty canvas. 120% keeps the
          feature frame near a real 1440px desktop. */}
      <iframe
        className={cn(
          "block origin-top-left border-0",
          scale === "card" && "h-[250%] w-[250%] scale-[0.4]",
          scale === "feature" && "h-[120%] w-[120%] scale-[0.8333]",
          scale === "full" && "h-full w-full",
          scale !== "full" && "pointer-events-none",
        )}
        src={`/templates/${id}/preview`}
        title={`${name} live preview`}
        loading={eager ? "eager" : "lazy"}
        tabIndex={scale === "full" ? undefined : -1}
        aria-hidden={scale === "full" ? undefined : "true"}
      />
    </div>
  );
}
