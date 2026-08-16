import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LeadModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    organization: '',
    country: '',
    contact_no: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', message: '' })

    const { error } = await supabase.from('leads').insert([formData])

    setLoading(false)

    if (error) {
      console.error('Supabase Error:', error)
      setStatus({ type: 'error', message: 'Failed to submit lead. Please try again.' })
    } else {
      setStatus({ type: 'success', message: 'Demo request received! We will be in touch shortly.' })
      setTimeout(() => {
        onClose()
        setStatus({ type: '', message: '' })
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          job_title: '',
          organization: '',
          country: '',
          contact_no: ''
        })
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl bg-slate-900 p-6 border border-slate-800 text-white shadow-2xl">
        <button
          onClick={onClose}
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
              placeholder="First Name *"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <input
            type="email"
            name="email"
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
              placeholder="Job Title"
              value={formData.job_title}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="organization"
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
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="contact_no"
              placeholder="Contact No."
              value={formData.contact_no}
              onChange={handleChange}
              className="w-full rounded bg-slate-800 p-2.5 text-sm border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}