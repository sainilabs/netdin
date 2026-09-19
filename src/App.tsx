import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Asterisk, Check, ChevronDown, Circle, Code2, GitBranch, Globe2, Layers3, Menu, MousePointer2, PanelsTopLeft, Plus, ShoppingBag, X, Zap } from 'lucide-react'
import { ContactDialog } from './components/ContactDialog'
import { Dialog } from './components/Dialog'
import { faqs, projects, services } from './content'
import './site.css'

function ProjectVisual({ type, artwork = false }: { type: string; artwork?: boolean }) {
  if (artwork) return (
    <div className={`project-visual project-artwork ${type}-artwork`}>
      <div className="artwork-frame"><img src={`/images/${type}-study.png`} width="1440" height="1100" loading="lazy" decoding="async" alt={type === 'supply' ? 'Supply concept: coordinated brand identity, colour system and digital-goods storefront design' : 'Orbit concept: a focused workspace dashboard with project activity and illustrative revenue data'} /></div>
      <span className="visual-label"><span>{type === 'supply' ? 'A BRAND BUILT TO BUILD ON.' : 'A CLEARER VIEW OF WHAT MATTERS.'}</span></span>
    </div>
  )
  if (type === 'supply') return (
    <div className="project-visual commerce-visual" aria-label="Supply digital-commerce website concept with illustrative products">
      <div className="commerce-site">
        <div className="commerce-nav"><b>supply</b><span>DIGITAL GOODS</span><ShoppingBag size={16} /></div>
        <div className="commerce-title">Your next idea.<br />A better starting point.</div>
        <div className="commerce-product">
          <div className="kit-preview" aria-hidden="true">
            <div className="kit-toolbar"><PanelsTopLeft size={14} /><span>Workspace kit</span><span>01</span></div>
            <div className="kit-layout"><div className="kit-rail"><Layers3 size={14} /><Circle size={12} /><Zap size={13} /></div><div className="kit-canvas"><div className="kit-swatches"><i /><i /><i /></div><div className="kit-chart"><i /><i /><i /><i /><i /></div><div className="kit-lines"><i /><i /></div></div></div>
          </div>
          <div className="commerce-product-info"><span>DESIGN SYSTEM / 01</span><h3>Workspace UI kit</h3><p>Components for your next digital product.</p><span className="commerce-price">$48 <span>View kit <ArrowUpRight size={13} /></span></span></div>
        </div>
        <div className="commerce-caption"><span>UI kits. Templates. Digital essentials.</span><ArrowRight size={15} /></div>
      </div>
      <span className="visual-label">SUPPLY / DIGITAL COMMERCE CONCEPT</span>
    </div>
  )
  return (
    <div className="project-visual orbit-visual" aria-label="Orbit operations dashboard concept with illustrative data">
      <div className="orbit-window">
        <div className="orbit-sidebar"><b><Circle size={18} strokeWidth={4} /> orbit</b><span className="sidebar-active"><Layers3 size={12} /> Overview</span><span><Zap size={12} /> Activity</span><span><Circle size={12} /> Projects</span><span><Globe2 size={12} /> Customers</span><i>O<span>Orbit workspace</span></i></div>
        <div className="orbit-content"><div className="orbit-top"><span>Workspace / Overview</span><span className="avatar">JD</span></div><div className="orbit-heading"><div><small>YOUR BUSINESS, IN FOCUS.</small><h3>A little clarity goes a long way.</h3></div><span>↗</span></div><div className="metric-row"><div><small>Total revenue</small><strong>$48,250<span>+18.6%</span></strong></div><div><small>Active projects</small><strong>24<span>+4 this month</span></strong></div></div><div className="chart-heading"><b>Revenue overview</b><span>Last 6 months <ChevronDown size={10} /></span></div><div className="chart"><div className="chart-grid"><span>$50k</span><span>$25k</span><span>$0</span></div><div className="bars">{[38, 53, 46, 72, 65, 92].map((height, index) => <div key={height}><i style={{ height: `${height}%` }} /><span>{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index]}</span></div>)}</div></div><div className="orbit-task"><span><Check size={12} /> Website redesign</span><span>In progress</span><span>Sep 24</span></div></div>
      </div>
      <span className="visual-label">LESS NOISE. MORE MOMENTUM.</span>
    </div>
  )
}

function StudioWorkflow() {
  return (
    <figure className="studio-workflow" aria-label="Illustrative Netdin workflow from interface design to code and handoff">
      <figcaption><span>NETDIN / DESIGN + ENGINEERING</span><span>WORKFLOW ILLUSTRATION</span></figcaption>
      <div className="workflow-design">
        <div className="workflow-stage"><MousePointer2 size={19} /><span>01 / Interface design</span></div>
        <div className="workflow-canvas" aria-hidden="true"><div className="workflow-sidebar"><Layers3 size={20} /><i /><i /><i /></div><div className="workflow-interface"><div className="workflow-interface-heading">Project overview <Plus size={16} /></div><div className="workflow-metrics"><span>Projects<strong>12</strong></span><span>In review<strong>03</strong></span></div><div className="workflow-row"><span>Website design</span><span>In review</span></div><div className="workflow-row"><span>Component library</span><Check size={16} /></div></div></div>
      </div>
      <div className="workflow-code"><div className="workflow-stage"><Code2 size={20} /><span>02 / Component development</span></div><pre><code><span className="code-keyword">{'export function '}</span>{'ProjectCard() {\n  return (\n    '}<span className="code-tag">{'<Card>'}</span>{'\n      '}<span className="code-tag">{'<ProjectOverview />'}</span>{'\n    '}<span className="code-tag">{'</Card>'}</span>{'\n  )\n}'}</code></pre></div>
      <div className="workflow-handoff"><GitBranch size={20} /><div><strong>03 / Review & handoff</strong><span>Responsive UI. Documented components.</span></div><ArrowUpRight size={22} /></div>
    </figure>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [contact, setContact] = useState<string | null>(null)
  const [project, setProject] = useState<number | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [activeService, setActiveService] = useState(0)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  function startProject(service = '') { setMenuOpen(false); setContact(service) }

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="header">
        <div className="header-inner wrap">
          <a href="#home" className="wordmark" aria-label="Netdin home">netdin</a>
          <nav className={`navigation ${menuOpen ? 'is-open' : ''}`} id="main-navigation" aria-label="Main navigation">
            <a href="#work" onClick={() => setMenuOpen(false)}>Selected work</a><a href="#services" onClick={() => setMenuOpen(false)}>What we do</a><a href="#studio" onClick={() => setMenuOpen(false)}>The studio</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQs</a>
          </nav>
          <button className="button button-dark header-cta" onClick={() => startProject()}>Let's talk <ArrowUpRight size={17} /></button>
          <button className="icon-button menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>
      <main id="main">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <picture><source media="(max-width: 1100px)" srcSet="/images/product-hero-mobile.png" /><img className="hero-image" src="/images/product-hero.png" alt="Orbit software dashboard, a self-initiated Netdin product design concept with illustrative data" fetchPriority="high" width="2000" height="1100" /></picture>
          <div className="hero-wash" />
          <div className="wrap hero-content">
            <div className="eyebrow hero-eyebrow"><span className="status-dot" /> INDEPENDENT DIGITAL STUDIO</div>
            <h1 id="hero-title">Digital products.<br />Distinctive brands.<span className="hero-byline">Made by Netdin.</span></h1>
            <p>We turn your next big move into a digital advantage.<br className="desktop-break" /> Strategy, design, and technology. Better together.</p>
            <div className="hero-actions"><button className="button button-dark" onClick={() => startProject()}>Build something great <ArrowUpRight size={18} /></button><a className="text-link" href="#work">Explore our thinking <ArrowDown size={17} /></a></div>
            <div className="hero-bottom"><span>ORBIT / SELF-INITIATED SOFTWARE CONCEPT</span><a href="#intro" aria-label="Explore Netdin"><ArrowDown size={19} /></a><span>BASED IN INDIA. BUILT FOR THE WORLD.</span></div>
          </div>
        </section>
        <section className="intro wrap" id="intro"><div className="section-kicker"><Asterisk size={22} /><span>THE RIGHT IDEAS.<br />THE RIGHT PARTNER.</span></div><div><h2>Good design gets noticed.<br /><span>Great execution moves you forward.</span></h2><p>We're an independent digital studio bringing brand, web, software, and automation under one roof. A clear point of view. A hands-on approach. And the ambition to make your business impossible to overlook.</p></div></section>
        <section className="work-section wrap section-space" id="work" aria-labelledby="work-heading">
          <div className="section-top"><div><span className="eyebrow">A LOOK AT OUR THINKING</span><h2 id="work-heading">Intentional by design.</h2></div><p>A glimpse of what we can imagine together.<br />Independent concepts. Real attention to detail.</p></div>
          <div className="project-grid">{projects.map((item, index) => <button className="project-card" key={item.name} onClick={() => setProject(index)} aria-label={`Explore ${item.name} concept`}><ProjectVisual type={item.type} artwork /><div className="project-info"><div><h3>{item.name}<span>CONCEPT EXPLORATION</span></h3><p>{item.category}</p></div><span className="round-arrow"><ArrowUpRight size={23} /></span></div><p className="project-summary">{item.headline}</p></button>)}</div>
        </section>
        <section className="services-section section-space" id="services" aria-labelledby="services-heading"><div className="wrap services-layout"><div className="services-intro"><span className="eyebrow">WHAT WE BRING TO THE TABLE</span><h2 id="services-heading">One partner.<br />Every possibility.</h2><p>From the first conversation to the next chapter. The expertise you need, connected from day one.</p><button className="text-link" onClick={() => startProject()}>Find your starting point <ArrowUpRight size={19} /></button><div className="services-symbol" aria-hidden="true"><Asterisk strokeWidth={.65} /></div></div><div className="service-list">{services.map((service, index) => <article className={`service ${activeService === index ? 'active' : ''}`} key={service.short}><button className="service-toggle" aria-expanded={activeService === index} aria-controls={`service-panel-${index}`} onClick={() => setActiveService(activeService === index ? -1 : index)}><h3>{service.short}</h3><Plus size={23} /></button><div id={`service-panel-${index}`} hidden={activeService !== index} className="service-panel"><p>{service.description}</p><ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul><button className="text-link" onClick={() => startProject(service.short)}>Let's talk {service.cta} <ArrowUpRight size={16} /></button></div></article>)}</div></div></section>
        <section className="studio-section wrap section-space" id="studio"><StudioWorkflow /><div className="studio-copy"><span className="eyebrow">NOT JUST ANOTHER AGENCY</span><h2>Small by choice.<br />Big on possibility.</h2><p>Great work doesn't need layers of process or a room full of people. It needs the right questions, honest conversations, and people who care about getting the details right.</p><p>That's Netdin. We work as an extension of your team, connecting the dots between how your brand looks, how your product works, and how your business grows.</p><div className="studio-principles"><div><ArrowUpRight /><h3>Direct collaboration</h3><p>Close to the work. Closer to your goals.</p></div><div><Layers3 /><h3>Connected expertise</h3><p>Design and engineering, on the same page.</p></div></div><a className="text-link" href="#process">A little about our process <ArrowDown size={17} /></a></div></section>
        <section className="process-section section-space" id="process"><div className="wrap"><div className="section-top"><div><span className="eyebrow">FROM WHAT IF TO WHAT'S NEXT</span><h2>Clarity at every step.</h2></div><p>No black boxes. No disappearing acts.<br />Just a clear path from idea to impact.</p></div><div className="process-grid">{[{ title: 'Find the right problem.', text: 'We listen, ask better questions, and get clear on your goals, audience, and what success should look like.' }, { title: 'Make it make sense.', text: 'Strategy becomes structure. We shape the experience, explore the design, and agree on a direction together.' }, { title: 'Build with intention.', text: 'Design meets dependable engineering. You see the work take shape, with regular reviews along the way.' }, { title: 'Launch. Learn. Evolve.', text: 'We test, refine, and hand over with care. Then help you plan what comes next, beyond launch day.' }].map((step, index) => <div className="process-step" key={step.title}><div className="step-number">0{index + 1}<ArrowRight size={20} /></div><h3>{step.title}</h3><p>{step.text}</p></div>)}</div></div></section>
        <section className="faq-section wrap section-space" id="faq"><div><span className="eyebrow">A FEW THINGS YOU MIGHT ASK</span><h2>Good questions.<br />Straight answers.</h2><p>Something else on your mind?</p><button className="text-link" onClick={() => startProject()}>Let's have a conversation <ArrowUpRight size={18} /></button></div><div className="faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<Plus size={20} /></summary><p>{faq.answer}</p></details>)}</div></section>
        <section className="contact-band" id="contact"><div className="wrap"><span className="eyebrow"><span className="status-dot" /> YOUR NEXT CHAPTER STARTS HERE</span><div className="contact-band-heading"><h2>Let's make<br />something matter.</h2><button aria-label="Start a project" className="contact-circle" onClick={() => startProject()}><ArrowUpRight strokeWidth={1} /></button></div><div className="contact-band-bottom"><p>Have a clear brief or just a good feeling?<br />Either is a great place to start.</p><a href="mailto:hello@netdin.com">hello@netdin.com <ArrowUpRight size={23} /></a></div></div></section>
      </main>
      <footer className="footer"><div className="wrap"><div className="footer-top"><a href="#home" className="wordmark">netdin</a><p>Independent minds.<br />Extraordinary possibilities.</p><a href="#home" className="text-link">Back to top <ArrowUpRight size={17} /></a></div><nav className="footer-navigation" aria-label="Footer navigation"><a href="#work">Projects <ArrowUpRight size={15} /></a><a href="#services">Services <ArrowUpRight size={15} /></a><a href="#studio">Studio <ArrowUpRight size={15} /></a><a href="mailto:hello@netdin.com">Get in touch <ArrowUpRight size={15} /></a></nav><div className="footer-bottom"><span>© {new Date().getFullYear()} Netdin. All rights reserved.</span><span>INDIA ↔ EVERYWHERE</span><button onClick={() => setPrivacyOpen(true)}>Privacy notice</button></div></div></footer>
      {contact !== null && <ContactDialog initialService={contact} onClose={() => setContact(null)} />}
      {project !== null && <Dialog title={`${projects[project].name} concept exploration`} onClose={() => setProject(null)} className="project-dialog"><div className="project-detail"><span className="eyebrow">SELF-INITIATED / CONCEPT EXPLORATION</span><h2>{projects[project].name}</h2><ProjectVisual type={projects[project].type} /><h3>{projects[project].headline}</h3><p>{projects[project].description}</p><ul>{projects[project].deliverables.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul><button className="button button-dark" onClick={() => { setProject(null); startProject() }}>Imagine your project here <ArrowUpRight size={18} /></button></div></Dialog>}
      {privacyOpen && <Dialog title="Privacy notice" onClose={() => setPrivacyOpen(false)}><article className="privacy-document"><span className="eyebrow">LAST UPDATED: SEPTEMBER 12, 2026</span><h2>Your information.<br />Handled with care.</h2><h3>What we collect</h3><p>When you send a project enquiry, Netdin collects your name, email, company (if provided), selected services, budget, timeline, message, and consent. Please do not submit passwords or sensitive personal information.</p><h3>How we use it</h3><p>We use this information to assess your project and respond to you. We do not sell enquiry information or add you to a marketing list without separate permission.</p><h3>Storage and service providers</h3><p>Enquiries are stored using Appwrite when the enquiry service is configured. Hosting and infrastructure providers may process technical logs for security and service operation. This site does not use advertising trackers or optional analytics cookies.</p><h3>Your choices</h3><p>You can request access, correction, or deletion of your enquiry by emailing <a href="mailto:hello@netdin.com">hello@netdin.com</a>. We keep enquiry information only as long as needed for the conversation, associated services, and applicable legal obligations.</p></article></Dialog>}
    </>
  )
}

export default App
