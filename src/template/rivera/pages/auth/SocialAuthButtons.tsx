import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.92h5.46c-.24 1.4-1.66 4.12-5.46 4.12-3.28 0-5.96-2.72-5.96-6.06S8.72 6.12 12 6.12c1.86 0 3.12.8 3.84 1.48l2.62-2.52C16.84 3.6 14.66 2.6 12 2.6 6.78 2.6 2.6 6.78 2.6 12s4.18 9.4 9.4 9.4c5.42 0 9.02-3.8 9.02-9.16 0-.62-.06-1.08-.16-1.54H12z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#1877F2" d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
      <path fill="#fff" d="M16.671 15.47L17.203 12h-3.328V9.749c0-.949.465-1.874 1.956-1.874h1.514V4.922s-1.374-.234-2.686-.234c-2.741 0-4.533 1.661-4.533 4.668V12H7.078v3.47h3.047v8.385a12.07 12.07 0 003.75 0V15.47h2.796z" />
    </svg>
  );
}

interface SocialAuthButtonsProps {
  label?: string;
}

export function SocialAuthButtons({ label = "Or continue with" }: SocialAuthButtonsProps) {
  const handle = (provider: string) => {
    toast.info(`${provider} sign-in is not configured in this demo.`);
  };
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-[0.18em]">
          <span className="bg-background px-3 text-muted-foreground">{label}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => handle("Google")}
          aria-label="Continue with Google"
          className="h-11 px-0"
        >
          <GoogleIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => handle("X")}
          aria-label="Continue with X"
          className="h-11 px-0"
        >
          <XIcon className="h-4 w-4" />
          <span className="hidden sm:inline">X</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => handle("Facebook")}
          aria-label="Continue with Facebook"
          className="h-11 px-0"
        >
          <FacebookIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Facebook</span>
        </Button>
      </div>
    </div>
  );
}