import { Logo } from "@/app/_components/ui/Logo";
import { WhatsAppIcon } from "@/app/_components/ui/WhatsAppIcon";
import { siteConfig, whatsappLink } from "@/app/_lib/siteConfig";

export function Outro({ yearRef }) {
  return (
    <section id="start" className="relative z-10 bg-canvas px-4 pt-[clamp(6rem,16vh,11rem)] sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="eyebrow">Chapter 08 · Yours</p>
        <h2 className="mt-5 max-w-[14ch] font-display text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-[-0.02em] text-ink">
          Have an idea? <em className="text-ember-soft">Let&apos;s give it a body.</em>
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-end">
          <p className="max-w-[46ch] text-lg leading-relaxed text-ink-dim">
            Tell us who it is for and what it should change for them. We will come back on WhatsApp with questions, a plan and a first estimate.
          </p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center gap-2.5 rounded-full bg-ember px-6 font-mono text-sm tracking-[0.08em] text-canvas uppercase transition-colors hover:bg-ember-soft"
            >
              <WhatsAppIcon className="size-5" />
              Start a project
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex min-h-12 items-center rounded-full border border-line px-6 font-mono text-sm tracking-[0.08em] text-ink uppercase transition-colors hover:border-ink-dim"
            >
              Email us
            </a>
          </div>
        </div>

        <div id="services" className="mt-[clamp(5rem,12vh,8rem)] border-t border-line pt-8">
          <p className="font-mono text-xs tracking-[0.16em] text-ink-faint uppercase">What we build</p>
          <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3 font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-ink">
            {siteConfig.services.map((s, i) => (
              <li key={s} className="flex items-center gap-8">
                {s}
                {i < siteConfig.services.length - 1 && <span className="size-1.5 rounded-full bg-ember" aria-hidden="true" />}
              </li>
            ))}
          </ul>
        </div>

        <footer className="mt-[clamp(5rem,12vh,8rem)] grid gap-10 border-t border-line py-10 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2.5 text-ink">
              <Logo className="size-7" />
              <span className="font-mono text-sm tracking-[0.3em]">KODEXA</span>
            </div>
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-ink-dim">
              A software studio founded by {siteConfig.founder}. {siteConfig.location}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol title="Studio" links={[["Process", "#process"], ["What we build", "#services"], ["Start a project", "#start"]]} />
            <FooterCol title="Contact" links={[["WhatsApp", whatsappLink(), true], ["Email", `mailto:${siteConfig.email}`]]} />
            <FooterCol title="Elsewhere" links={[["GitHub", siteConfig.github, true]]} />
          </div>
          <p className="font-mono text-[0.7rem] tracking-[0.08em] text-ink-faint md:col-span-2">
            © <span ref={yearRef}>2026</span> Kodexa. Every frame on this page was generated in code.
          </p>
        </footer>
      </div>
    </section>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="font-mono text-[0.68rem] tracking-[0.16em] text-ember-soft uppercase">{title}</p>
      <ul className="mt-3">
        {links.map(([label, href, external]) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex min-h-11 items-center text-sm text-ink-dim transition-colors hover:text-ink"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
