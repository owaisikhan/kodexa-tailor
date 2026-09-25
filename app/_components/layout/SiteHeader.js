import { Logo } from "@/app/_components/ui/Logo";
import { WhatsAppIcon } from "@/app/_components/ui/WhatsAppIcon";
import { whatsappLink } from "@/app/_lib/siteConfig";

export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-linear-to-b from-canvas/90 via-canvas/40 to-transparent">
      <div className="pointer-events-auto mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <a href="#top" className="flex min-h-11 items-center gap-2.5 text-ink" aria-label="Kodexa, back to top">
          <Logo className="size-7" />
          <span className="font-mono text-sm tracking-[0.3em]">KODEXA</span>
        </a>
        <nav className="flex items-center gap-1 sm:gap-6" aria-label="Main">
          <a href="#process" className="hidden min-h-11 items-center font-mono text-xs tracking-[0.14em] text-ink-dim uppercase transition-colors hover:text-ink sm:flex">
            Process
          </a>
          <a href="#services" className="hidden min-h-11 items-center font-mono text-xs tracking-[0.14em] text-ink-dim uppercase transition-colors hover:text-ink sm:flex">
            What we build
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-full border border-ember/60 px-4 font-mono text-xs tracking-[0.12em] text-ink uppercase transition-colors hover:border-ember hover:bg-ember hover:text-canvas"
          >
            <WhatsAppIcon className="size-4" />
            Start a project
          </a>
        </nav>
      </div>
    </header>
  );
}
