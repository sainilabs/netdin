import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, CheckCircle2, LoaderCircle, Mail } from 'lucide-react'
import { Dialog } from './Dialog'
import { serviceOptions, submitBrief, type ProjectBrief } from '../lib/enquiries'

export function ContactDialog({ onClose, initialService = '' }: { onClose: () => void; initialService?: string }) {
  const [services, setServices] = useState<string[]>(initialService ? [initialService] : [])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle')
  const [error, setError] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [showPrivacy, setShowPrivacy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    setError('')
    const values = new FormData(event.currentTarget)
    if (values.get('website')) {
      setError('We could not verify this request. Please contact us by email.')
      return
    }
    if (!services.length) {
      setError('Please select at least one service so we can point your brief in the right direction.')
      return
    }
    const brief: ProjectBrief = {
      name: String(values.get('name')).trim(),
      email: String(values.get('email')).trim(),
      company: String(values.get('company')).trim(),
      services,
      budget: String(values.get('budget')),
      timeline: String(values.get('timeline')),
      message: String(values.get('message')).trim(),
      consent: values.get('consent') === 'on',
    }
    if (brief.name.length < 2 || brief.message.length < 20 || !brief.consent) {
      setError('Please include your name, at least 20 characters about your project, and your consent to be contacted.')
      return
    }
    setEmailBody(`Name: ${brief.name}\nEmail: ${brief.email}\nCompany: ${brief.company}\nServices: ${services.join(', ')}\nBudget: ${brief.budget}\nTimeline: ${brief.timeline}\n\n${brief.message}`)
    setStatus('sending')
    try {
      await submitBrief(brief)
      setStatus('success')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <Dialog title="Start a project with Netdin" onClose={onClose} className="contact-dialog">
      <aside className="contact-aside">
        <a className="wordmark" href="#" onClick={onClose}>netdin</a>
        <div>
          <span className="eyebrow">THE START OF SOMETHING GOOD</span>
          <h2>Big idea?<br />Let's build it.</h2>
          <p>Tell us where you are and where you want to go. We'll work out the next step together.</p>
        </div>
        <a className="contact-email" href="mailto:hello@netdin.com"><Mail size={18} /> hello@netdin.com <ArrowUpRight size={18} /></a>
      </aside>
      <div className="contact-main">
        {status === 'success' ? (
          <div className="success-state" role="status">
            <CheckCircle2 size={48} strokeWidth={1.3} />
            <span className="eyebrow">BRIEF RECEIVED</span>
            <h2>Consider the<br />conversation started.</h2>
            <p>Thank you for thinking of Netdin. We'll review your brief and get back to you at the email address you shared.</p>
            <button className="button button-dark" onClick={onClose}>Back to exploring <ArrowUpRight size={18} /></button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <span className="eyebrow">A LITTLE ABOUT YOUR PROJECT</span>
            <h2>Let's make an introduction.</h2>
            <fieldset disabled={status === 'sending'} className="brief-fields">
              <div className="form-grid">
                <label>Your name <span>*</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Alex Taylor" /></label>
                <label>Email address <span>*</span><input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="alex@company.com" /></label>
              </div>
              <label>Company <span className="optional">optional</span><input name="company" autoComplete="organization" maxLength={150} placeholder="Your company or next big thing" /></label>
              <fieldset className="service-picker">
                <legend>What can we help with? <span>*</span></legend>
                <div className="service-options">
                  {serviceOptions.map((service) => (
                    <label key={service} className={`service-option ${services.includes(service) ? 'selected' : ''}`}>
                      <input type="checkbox" name="services" value={service} checked={services.includes(service)} onChange={() => setServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service])} />
                      <span className="option-check">{services.includes(service) && <Check size={12} />}</span>{service}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-grid">
                <label>Where are you with budget? <span>*</span><select name="budget" defaultValue="" required><option value="" disabled>Select an option</option><option>Let's discuss and scope it properly</option><option>I have a budget approved</option><option>I need a ballpark first</option><option>Just exploring for now</option></select></label>
                <label>Ideal timeline <span>*</span><select name="timeline" defaultValue="" required><option value="" disabled>Select a timeline</option><option>As soon as possible</option><option>1 - 3 months</option><option>3 - 6 months</option><option>Just exploring</option></select></label>
              </div>
              <label>A little about your project <span>*</span><textarea name="message" required minLength={20} maxLength={5000} rows={3} placeholder="What are you building, improving, or imagining?" /></label>
              <div className="honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <label className="consent"><input type="checkbox" name="consent" required /><span>I agree to Netdin using these details to respond to my enquiry. <button type="button" className="inline-link" onClick={() => setShowPrivacy(!showPrivacy)} aria-expanded={showPrivacy}>Privacy notice</button></span></label>
              {showPrivacy && <p className="privacy-inline">We use your contact details and project brief only to assess and respond to your enquiry. Submitted briefs are stored with Appwrite. We do not sell your information. To request access or deletion, contact hello@netdin.com. Please do not include passwords or confidential credentials.</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark submit-button" type="submit">{status === 'sending' ? <>Sending your brief <LoaderCircle size={18} className="spin" /></> : <>Send project brief <ArrowUpRight size={19} /></>}</button>
              <a className="email-alternative" href={`mailto:hello@netdin.com?subject=New%20project%20enquiry&body=${encodeURIComponent(emailBody)}`}>Prefer email? Let's talk directly <ArrowUpRight size={14} /></a>
            </fieldset>
          </form>
        )}
      </div>
    </Dialog>
  )
}