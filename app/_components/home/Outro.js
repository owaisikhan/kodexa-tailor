import { FOOTER_COLUMNS } from "@/app/_lib/scene-data";

export function Outro({ yearRef }) {
  return (
    <section className="outro" id="book">
      <div className="outro__mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/img/octaboot.png" alt="Octaboot" />
      </div>
      <p className="eyebrow eyebrow--center">The House of Fashion</p>
      <h2 className="outro__title">
        Tailoring
        <br />
        for the few.
      </h2>
      <p className="outro__body">
        Every Octaboot suit is cut to one man and one man only. Begin with a conversation, a
        measure, and a single bolt of cloth chosen for you alone.
      </p>
      <a className="btn" href="#book">
        Book a Private Fitting
      </a>

      <footer className="site-footer">
        <div className="foot-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/octaboot.png" alt="" />
          <span>OCTABOOT</span>
        </div>
        <div className="foot-cols">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4>{col.heading}</h4>
              {col.links.map((label) => (
                <a key={label} href="#">
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <p className="foot-legal">
          © <span id="year" ref={yearRef} /> Octaboot Bespoke — Made by hand, for a lifetime.
        </p>
      </footer>
    </section>
  );
}
