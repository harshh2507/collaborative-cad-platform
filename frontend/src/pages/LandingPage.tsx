import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="bg-[#090d0f] text-[#f3f7f6] font-sans">
      {/* NAVBAR */}
      <header className="w-full h-[84px] px-[72px] border-b border-[#2a3539] bg-[#090d0f] flex items-center justify-between main-padding">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="logo-mark"></span>
          <span className="text-[24px] text-[#f3f7f6] font-normal">IYRA</span>
        </Link>

        <nav className="desktop-nav flex gap-8 text-[14px] text-[#dde5e3]">
          <a href="#product" className="nav-link">Product</a>
          <a href="#solutions" className="nav-link">Solutions</a>
          <a href="#resources" className="nav-link">Resources</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </nav>

        <div className="top-actions flex gap-2.5">
          <Link
            to="/login"
            className="btn-secondary h-[52px] flex items-center gap-3 bg-black px-6 rounded border border-[#2a3539]"
          >
            <span className="font-bold text-[14px] text-[#f3f7f6]">Sign in</span>
            <span className="text-[16px] text-[#40e8f4]">↗</span>
          </Link>

          <Link
            to="/login"
            className="btn-primary h-[52px] flex items-center gap-3 bg-[#40e8f4] px-6 rounded border border-[#40e8f4]"
          >
            <span className="font-bold text-[14px] text-[#050708]">Start designing free</span>
            <span className="text-[16px] text-[#050708]">↗</span>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="product" className="hero-section flex gap-12 w-full min-h-[650px] bg-[#090d0f] pl-[72px] pt-[82px] pb-16 main-padding">
        <div className="hero-copy w-[590px] flex flex-col gap-8">
          <span className="font-semibold text-[20px] underline text-[#40e8f4]">Browser-native 3D collaboration</span>
          <h1 className="hero-title text-[70px] leading-[1.05] font-normal text-[#f3f7f6] m-0">
            Engineering moves faster when everyone can see it.
          </h1>
          <p className="text-[20px] leading-[1.55] text-[#91a0a3] m-0">
            Review 3D models together, comment directly on geometry, compare versions, and move from concept to approval—right in the browser.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/login" className="btn-primary h-[52px] flex items-center gap-3 bg-[#40e8f4] px-6 rounded border border-[#40e8f4]">
              <span className="font-bold text-[14px] text-[#050708]">Start designing free</span>
              <span className="text-[16px] text-[#050708]">↗</span>
            </Link>
            <a href="#" className="btn-secondary h-[52px] flex items-center gap-3 bg-black px-6 rounded border border-[#2a3539]">
              <span className="font-bold text-[14px] text-[#f3f7f6]">Book a demo</span>
              <span className="text-[16px] text-[#40e8f4]">↗</span>
            </a>
          </div>
          <span className="text-[11px] text-[#91a0a3]">NO INSTALLATION &nbsp;·&nbsp; FREE FOR VIEWERS &nbsp;·&nbsp; SOC 2 TYPE II</span>
        </div>

        <div className="hero-visual flex flex-col grow h-[650px] bg-[#101619] p-5 rounded-tl-[18px] rounded-bl-[18px] border border-[#2a3539]">
          <div className="hero-model rounded overflow-hidden">
            <img src="/image1.png" alt="Actuator Model" className="w-full h-full object-cover relative z-10" />
          </div>
          <div className="flex flex-col gap-1 bg-[#091013] p-3 rounded border border-[#2a3539] mt-3">
            <span className="text-[11px] text-[#40e8f4]">ACTUATOR_A14.STEP</span>
            <span className="text-[10px] text-[#91a0a3]">REV 06 · REVIEW READY</span>
          </div>
          <div className="flex gap-2.5 bg-[#c6ff4a] p-3 rounded mt-2">
            <span className="text-[12px] text-[#050708]">Clearance confirmed ✓</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="solutions" className="w-full flex flex-col gap-14 bg-[#090d0f] px-[72px] py-28 main-padding">
        <div className="flex justify-between items-end gap-10">
          <div className="w-[700px] flex flex-col gap-[18px]">
            <span className="font-semibold text-[20px] underline text-[#c6ff4a]">One shared engineering room</span>
            <h2 className="section-title text-[50px] leading-[1.08] text-[#f3f7f6] m-0 font-normal">
              From upload to approval, without the handoff drag.
            </h2>
          </div>
          <p className="w-[410px] text-[16px] leading-[1.5] text-[#91a0a3] m-0">
            Iyra keeps the model, discussion, and decision record together—so every stakeholder works from the same geometry.
          </p>
        </div>

        <div className="three-cards flex gap-5">
          <div className="feature-card flex flex-col gap-[22px] grow bg-[#101619] p-7 rounded-[10px] border border-[#2a3539]">
            <div className="flex justify-between"><span className="text-[12px] text-[#40e8f4]">01</span><span className="text-[#40e8f4] text-xl">◇</span></div>
            <div className="h-px bg-[#2a3539]"></div>
            <h3 className="text-[28px] text-[#f3f7f6] font-normal m-0">Share the model</h3>
            <p className="text-[15px] leading-[1.6] text-[#91a0a3] m-0">Open any CAD file in a secure browser workspace.</p>
          </div>
          <div className="feature-card flex flex-col gap-[22px] grow bg-[#151d20] p-7 rounded-[10px] border border-[#40e8f4]">
            <div className="flex justify-between"><span className="text-[12px] text-[#40e8f4]">02</span><span className="text-[#40e8f4] text-xl">⌖</span></div>
            <div className="h-px bg-[#2a3539]"></div>
            <h3 className="text-[28px] text-[#f3f7f6] font-normal m-0">Review in context</h3>
            <p className="text-[15px] leading-[1.6] text-[#91a0a3] m-0">Pin feedback to faces, edges, and assemblies.</p>
          </div>
          <div className="feature-card flex flex-col gap-[22px] grow bg-[#101619] p-7 rounded-[10px] border border-[#2a3539]">
            <div className="flex justify-between"><span className="text-[12px] text-[#40e8f4]">03</span><span className="text-[#40e8f4] text-xl">✓</span></div>
            <div className="h-px bg-[#2a3539]"></div>
            <h3 className="text-[28px] text-[#f3f7f6] font-normal m-0">Resolve together</h3>
            <p className="text-[15px] leading-[1.6] text-[#91a0a3] m-0">Track decisions and approvals without losing context.</p>
          </div>
        </div>
      </section>

      {/* FEEDBACK SECTION */}
      <section className="two-column flex gap-[72px] bg-[#dde5e3] px-[72px] py-28 main-padding">
        <div className="w-[720px] h-[520px] flex flex-col bg-[#090d0f] p-[18px] rounded-[18px] shrink-0">
          <div className="model-preview rounded relative">
            <img src="/image2.png" alt="Model Preview" className="w-full h-full object-cover relative z-10 rounded" />
          </div>
          <div className="w-[238px] flex flex-col gap-[7px] bg-[#f3f7f6] p-3.5 rounded-md mt-[-90px] relative z-20 shadow-xl">
            <span className="text-[10px] text-[#050708]">MAYA · INDUSTRIAL DESIGN</span>
            <span className="text-[12px] leading-[1.3] text-[#050708]">Can we soften this transition before tooling review?</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 grow justify-center">
          <span className="font-semibold text-[20px] underline text-[#40e8f4]">Feedback, attached to the work</span>
          <h2 className="section-title text-[50px] leading-[1.06] text-[#050708] font-normal m-0">
            Stop describing where. Point to the geometry.
          </h2>
          <p className="text-[18px] leading-[1.55] text-[#465256] m-0">
            Place comments on a face, edge, or component. Teammates orbit the model, inspect the exact view, and resolve decisions in context.
          </p>
          <div className="flex flex-col gap-5 mt-2">
            <div className="flex items-center gap-3"><span className="text-[20px] text-[#050708]">⌖</span><span className="text-[15px] text-[#050708]">View-aware pins and markups</span></div>
            <div className="flex items-center gap-3"><span className="text-[20px] text-[#050708]">◇</span><span className="text-[15px] text-[#050708]">Guest review with no CAD license</span></div>
            <div className="flex items-center gap-3"><span className="text-[20px] text-[#050708]">✓</span><span className="text-[15px] text-[#050708]">Threads, mentions, and approvals</span></div>
          </div>
        </div>
      </section>

      {/* REVISION INTELLIGENCE */}
      <section className="w-full flex flex-col gap-[52px] bg-[#101619] px-[72px] py-28 main-padding">
        <div className="flex justify-between gap-10">
          <div className="w-[700px] flex flex-col gap-[18px]">
            <span className="font-semibold text-[20px] underline text-[#c6ff4a]">Revision intelligence</span>
            <h2 className="section-title text-[50px] leading-[1.08] text-[#f3f7f6] font-normal m-0">
              See exactly what changed. Never diff files by filename again.
            </h2>
          </div>
          <div className="w-[410px] flex gap-9">
            <div className="flex flex-col gap-2 grow">
              <span className="font-bold text-[32px] text-[#f3f7f6]">2.4×</span>
              <span className="text-[11px] underline text-[#91a0a3]">faster review cycles</span>
            </div>
            <div className="flex flex-col gap-2 grow">
              <span className="font-bold text-[32px] text-[#f3f7f6]">38%</span>
              <span className="text-[11px] underline text-[#91a0a3]">fewer late changes</span>
            </div>
          </div>
        </div>

        <div className="relative flex gap-0.5 h-[360px] bg-[#090d0f] p-[18px] rounded-[18px] border border-[#2a3539]">
          <img src="/image3.png" alt="Revision Compare" className="w-full h-full object-cover rounded relative z-10" />
          <div className="absolute flex gap-4 bg-[#090d0f] px-3.5 py-2.5 rounded z-20" style={{ left: '18px', top: '18px', margin: '18px' }}>
            <span className="text-[10px] text-[#91a0a3]">REV 05</span>
            <span className="text-[10px] text-[#c6ff4a]">REV 06 · 12 CHANGES</span>
          </div>
        </div>
      </section>

      {/* INSPECTION TOOLS */}
      <section id="resources" className="two-column flex gap-[72px] bg-[#090d0f] px-[72px] py-28 main-padding">
        <div className="w-[480px] flex flex-col gap-6">
          <span className="font-semibold text-[20px] underline text-[#40e8f4]">Inspect without compromise</span>
          <h2 className="section-title text-[50px] leading-[1.08] text-[#f3f7f6] font-normal m-0">
            The tools engineers expect. Accessible to everyone.
          </h2>
          <p className="text-[17px] leading-[1.55] text-[#91a0a3] m-0">
            Measure, isolate, section, and explode complex models at full fidelity—without downloading a desktop viewer.
          </p>
          <div className="flex flex-col">
            <div className="flex flex-col gap-2.5 py-[17px]">
              <div className="h-px bg-[#2a3539]"></div>
              <div className="flex items-center gap-3.5">
                <span className="text-[20px] text-[#40e8f4]">⌖</span>
                <span className="text-[12px] underline text-[#f3f7f6]">Measure</span>
                <span className="text-[13px] text-[#91a0a3]">Distance, angle, radius, and clearance.</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 py-[17px]">
              <div className="h-px bg-[#2a3539]"></div>
              <div className="flex items-center gap-3.5">
                <span className="text-[20px] text-[#40e8f4]">▣</span>
                <span className="text-[12px] underline text-[#f3f7f6]">Section</span>
                <span className="text-[13px] text-[#91a0a3]">Cut through assemblies on any plane.</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 py-[17px]">
              <div className="h-px bg-[#2a3539]"></div>
              <div className="flex items-center gap-3.5">
                <span className="text-[20px] text-[#40e8f4]">◇</span>
                <span className="text-[12px] underline text-[#f3f7f6]">Explode</span>
                <span className="text-[13px] text-[#91a0a3]">Understand every part and relationship.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col grow h-[460px] bg-[#101619] p-4 rounded-[18px] border border-[#2a3539]">
          <div className="inspect-model rounded relative overflow-hidden h-full">
            <img src="/image4.png" alt="Inspect Model" className="w-full h-full object-cover relative z-10" />
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="pricing" className="w-full flex flex-col gap-12 bg-[#dde5e3] px-[72px] py-24 main-padding">
        <div className="flex flex-col gap-4">
          <span className="font-semibold text-[20px] underline text-[#40e8f4]">Open by design. Secure by default.</span>
          <h2 className="section-title text-[50px] text-[#050708] font-normal m-0">Fits your stack. Protects your IP.</h2>
        </div>
        <div className="security-cards flex gap-5">
          <div className="feature-card flex flex-col gap-5 grow bg-[#f7faf9] p-7 rounded-[10px] border border-[#c7d0ce]">
            <span className="text-2xl text-[#050708]">◈</span>
            <h3 className="text-[24px] text-[#050708] font-bold m-0">Enterprise security</h3>
            <p className="text-[14px] leading-[1.6] text-[#586568] m-0">SOC 2 Type II, SSO/SAML, granular permissions, encryption at rest and in transit.</p>
          </div>
          <div className="feature-card flex flex-col gap-5 grow bg-[#f7faf9] p-7 rounded-[10px] border border-[#c7d0ce]">
            <span className="text-2xl text-[#050708]">▥</span>
            <h3 className="text-[24px] text-[#050708] font-bold m-0">40+ CAD formats</h3>
            <p className="text-[14px] leading-[1.6] text-[#586568] m-0">STEP, IGES, Parasolid, SolidWorks, CATIA, Rhino, Fusion 360, STL, OBJ, and more.</p>
          </div>
          <div className="feature-card flex flex-col gap-5 grow bg-[#f7faf9] p-7 rounded-[10px] border border-[#c7d0ce]">
            <span className="text-2xl text-[#050708]">◎</span>
            <h3 className="text-[24px] text-[#050708] font-bold m-0">Built for the browser</h3>
            <p className="text-[14px] leading-[1.6] text-[#586568] m-0">No installs, no specialist hardware, and frictionless access for every reviewer.</p>
          </div>
        </div>
      </section>

      {/* CUSTOMER STORY */}
      <section className="story w-full flex bg-[#151d20]">
        <div className="w-[560px] shrink-0">
          <div className="story-image">
            <img src="/image5.png" alt="Customer Story" className="w-full h-full object-cover relative z-10" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-[30px] grow px-[72px] py-[88px] main-padding overflow-hidden">
          <span className="font-semibold text-[12px] underline text-[#c6ff4a]">Customer story · Aeromotive Labs</span>
          <blockquote className="text-[40px] leading-[1.2] text-[#f3f7f6] font-normal m-0">
            “Iyra replaced screenshots, screen shares, and three separate review trackers. Our suppliers now understand the issue the first time.”
          </blockquote>
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-[15px] text-[#f3f7f6]">Elena Park</span>
            <span className="text-[11px] text-[#91a0a3]">VP PRODUCT ENGINEERING · AEROMOTIVE LABS</span>
          </div>
          <div className="flex gap-12 pt-[18px] flex-wrap">
            <div className="flex flex-col gap-2"><span className="font-bold text-[32px] text-[#f3f7f6]">11 days</span><span className="text-[11px] underline text-[#91a0a3]">saved per program</span></div>
            <div className="flex flex-col gap-2"><span className="font-bold text-[32px] text-[#f3f7f6]">64%</span><span className="text-[11px] underline text-[#91a0a3]">less review admin</span></div>
            <div className="flex flex-col gap-2"><span className="font-bold text-[32px] text-[#f3f7f6]">4 regions</span><span className="text-[11px] underline text-[#91a0a3]">one live workspace</span></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="start" className="cta w-full flex gap-20 bg-[#40e8f4] px-[72px] py-24 main-padding">
        <div className="w-[490px] h-[420px]"><div className="geometry"></div></div>
        <div className="w-[760px] flex flex-col gap-6">
          <span className="font-semibold text-[12px] underline text-[#c6ff4a]">Start with one model</span>
          <h2 className="text-[60px] leading-[1.15] text-[#050708] font-normal m-0">Bring your next design review into focus.</h2>
          <p className="text-[18px] leading-[1.55] text-[#173238] m-0">Start free with unlimited viewers. Upgrade when your team needs advanced controls, integrations, and scale.</p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/login" className="btn-primary h-[52px] flex items-center gap-3 bg-[#050708] px-6 rounded border border-[#2a3539]">
              <span className="font-bold text-[14px] text-[#f3f7f6]">Start designing free</span><span className="text-[16px] text-[#40e8f4]">↗</span>
            </Link>
            <a href="#" className="h-[52px] flex items-center px-6 rounded border border-[#050708]">
              <span className="font-bold text-[14px] text-[#050708]">Book a demo</span>
            </a>
          </div>
          <span className="text-[11px] text-[#255057]">FREE TO START · NO CREDIT CARD · VIEWERS ALWAYS FREE</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full flex flex-col gap-16 bg-[#050708] px-[72px] pt-20 pb-9 main-padding">
        <div className="footer-content flex justify-between">
          <div className="w-[350px] flex flex-col gap-[18px]">
            <Link to="/" className="flex items-center gap-2.5"><span className="logo-mark"></span><span className="text-[26px] text-[#f3f7f6]">Iyra</span></Link>
            <p className="text-[15px] leading-[1.6] text-[#91a0a3] m-0">The browser workspace where product teams see, discuss, and approve 3D together.</p>
          </div>
          <div className="footer-links flex gap-16">
            <div className="w-[150px] flex flex-col gap-[13px]">
              <span className="text-[11px] underline text-[#f3f7f6]">Product</span>
              <a href="#product" className="text-[13px] text-[#91a0a3]">3D viewer</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Comments</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Version compare</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Integrations</a>
            </div>
            <div className="w-[150px] flex flex-col gap-[13px]">
              <span className="text-[11px] underline text-[#f3f7f6]">Solutions</span>
              <a href="#" className="text-[13px] text-[#91a0a3]">Engineering</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Industrial design</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Manufacturing</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Suppliers</a>
            </div>
            <div className="w-[150px] flex flex-col gap-[13px]">
              <span className="text-[11px] underline text-[#f3f7f6]">Company</span>
              <a href="#" className="text-[13px] text-[#91a0a3]">About</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Careers</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Security</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Contact</a>
            </div>
            <div className="w-[150px] flex flex-col gap-[13px]">
              <span className="text-[11px] underline text-[#f3f7f6]">Resources</span>
              <a href="#" className="text-[13px] text-[#91a0a3]">CAD formats</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Help center</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">Customer stories</a>
              <a href="#" className="text-[13px] text-[#91a0a3]">API docs</a>
            </div>
          </div>
        </div>
        <div className="flex justify-between pt-[26px] border-t border-[#2a3539]">
          <span className="text-[10px] text-[#91a0a3]">© 2026 IYRA SYSTEMS, INC.</span>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] text-[#91a0a3]">PRIVACY</a>
            <a href="#" className="text-[10px] text-[#91a0a3]">TERMS</a>
            <span className="text-[10px] text-[#c6ff4a]">● ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;