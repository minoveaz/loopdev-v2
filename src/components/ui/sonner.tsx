import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={16}
      gap={10}
      visibleToasts={4}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-border bg-popover p-4 pe-9 text-popover-foreground shadow-[0_12px_32px_-12px_hsl(var(--foreground)/0.18)] backdrop-blur-sm before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-foreground/15 data-[type=success]:before:bg-success data-[type=error]:before:bg-destructive data-[type=warning]:before:bg-warning data-[type=info]:before:bg-info",
          title: "text-sm font-semibold leading-snug tracking-tight",
          description: "mt-0.5 text-xs leading-relaxed text-muted-foreground",
          icon:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4 group-data-[type=success]:bg-success/10 group-data-[type=success]:text-success group-data-[type=error]:bg-destructive/10 group-data-[type=error]:text-destructive group-data-[type=warning]:bg-warning/10 group-data-[type=warning]:text-warning group-data-[type=info]:bg-info/10 group-data-[type=info]:text-info",
          actionButton:
            "group-[.toast]:rounded-md group-[.toast]:bg-primary group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:text-primary-foreground group-[.toast]:transition-fast hover:group-[.toast]:opacity-90",
          cancelButton:
            "group-[.toast]:rounded-md group-[.toast]:bg-muted group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-muted-foreground hover:group-[.toast]:bg-muted/80",
          closeButton:
            "!top-2 !end-2 !start-auto !translate-x-0 !translate-y-0 !h-6 !w-6 !rounded-md !border-0 !bg-transparent !text-muted-foreground hover:!bg-muted hover:!text-foreground transition-fast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
