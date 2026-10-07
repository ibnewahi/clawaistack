import { useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LeadModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    organization: '',
    country: '',
    contact_no: '',
    website: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const inFlightRef = useRef(false)
  const requestPendingRef = useRef(false)
  const successTimerRef = useRef(null)
  const sessionRef = useRef(0)
  const activeSessionRef = useRef(false)

  const clearSuccessTimer = () => {
    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  useLayoutEffect(() => {
    sessionRef.current += 1
    activeSessionRef.current = isOpen
    clearSuccessTimer()
    setStatus({ type: '', message: '' })
    setLoading(false)
    if (!requestPendingRef.current) inFlightRef.current = false
    return () => {
      activeSessionRef.current = false
      sessionRef.current += 1
      clearSuccessTimer()
      if (!requestPendingRef.current) inFlightRef.current = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleClose = () => {
    if (requestPendingRef.current) return
    clearSuccessTimer()
    activeSessionRef.current = false
    sessionRef.current += 1
    inFlightRef.current = false
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (inFlightRef.current || !activeSessionRef.current) return
    inFlightRef.current = true
    requestPendingRef.current = true
    const session = sessionRef.current
    const isCurrentSession = () => activeSessionRef.current && sessionRef.current === session
    setLoading(true)
    setStatus({ type: '', message: '' })

    let succeeded = false
    try {
      const { data, error } = await supabase.functions.invoke('lead-intake', { body: formData })
      if (error || data?.success !== true) throw new Error('Submission not confirmed')
      if (!isCurrentSession()) return
      succeeded = true
      setStatus({ type: 'success', message: 'Demo request received! We will be in touch shortly.' })
      clearSuccessTimer()
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null
        if (!isCurrentSession()) return
        setStatus({ type: '', message: '' })
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          job_title: '',
          organization: '',
          country: '',
          contact_no: '',
          website: ''
        })
        inFlightRef.current = false
        activeSessionRef.current = false
        sessionRef.current += 1
        onClose()
      }, 2000)
    } catch {
      if (isCurrentSession()) {
        setStatus({ type: 'error', message: 'Unable to confirm your request. Please try again later.' })
      }
    } finally {
      requestPendingRef.current = false
      if (isCurrentSession()) setLoading(false)
      if (!succeeded || !isCurrentSession()) inFlightRef.current = false
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl bg-slate-900 p-6 border border-slate-800 text-white shadow-2xl">
        <button
          onClick={handleClose}
          disabled={loading}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-1 text-white">Book a Demo</h2>
        <p className="text-sm text-slate-400 mb-6">Fill out your details to schedule a personalized walkthrough.</p>

        {status.message && (
          <div className={`p-3 rounded mb-4 text-sm ${status.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="first_name"
              maxLength={100}
              placeholder="First Name *"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="last_name"
              maxLength={100}
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <input
            type="email"
            name="email"
            maxLength={254}
            placeholder="Work Email *"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="job_title"
              maxLength={150}
              placeholder="Job Title"
              value={formData.job_title}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="organization"
              maxLength={200}
              placeholder="Organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="country"
              maxLength={100}
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="contact_no"
              maxLength={40}
              placeholder="Contact No."
              value={formData.contact_no}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="hidden" aria-hidden="true">
            <label htmlFor="lead-website">Website</label>
            <input id="lead-website" type="text" name="website" maxLength={200}
              tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} />
          </div>

          <button
            type="submit"
            disabled={loading || status.type === 'success'}
            className="w-full mt-4 rounded bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
