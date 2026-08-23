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
    <div className={cn("relative overflow-hidden bg-[#17141b]", className)}>
      <iframe
        className={cn(
          "block origin-top-left border-0",
          scale === "card" && "h-[250%] w-[250%] scale-[0.4]",
          scale === "feature" && "h-[200%] w-[200%] scale-50",
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
