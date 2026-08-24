import { useState, useCallback } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactColumn {
  brokerContact: string
  buyersAgent: string
  sellersAgent: string
  escrow: string
}

interface FormData {
  loanNumber: string
  borrowerLastName: string
  loanAmount: string
  dateNeeded: string
  lockedRate: string
  loanProduct: string
  transactionType: string
  occupancyType: string

  brokerName: ContactColumn
  stateLic: ContactColumn
  nmlsId: ContactColumn
  address: ContactColumn
  cityStZip: ContactColumn
  contact: ContactColumn
  contactLic: ContactColumn
  email: ContactColumn
  phone: ContactColumn

  titleHolders: string
  vestingMethod: string
  closingDocEmail: string

  originationFee: string
  uwFee: string
  discountFee: string
  processingFeeBroker: string
  creditReportFee: string
  brokerYspCredit: string
  miscFee2: string
  appraisalFeeDue: string
  appraisalFeePoc: string
  processingFee3rdParty: string
  brokerCredit: string
  expectedTotal: string
  authorizedBy: string

  notes: string
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

// ── Helpers ────────────────────────────────────────────────────────────────

function emptyContact(): ContactColumn {
  return { brokerContact: '', buyersAgent: '', sellersAgent: '', escrow: '' }
}

const initialForm = (): FormData => ({
  loanNumber: '',
  borrowerLastName: '',
  loanAmount: '',
  dateNeeded: '',
  lockedRate: '',
  loanProduct: '30yr Fixed',
  transactionType: 'Refinance - Rate & Term',
  occupancyType: 'Primary',

  brokerName: emptyContact(),
  stateLic: emptyContact(),
  nmlsId: emptyContact(),
  address: emptyContact(),
  cityStZip: emptyContact(),
  contact: emptyContact(),
  contactLic: emptyContact(),
  email: emptyContact(),
  phone: emptyContact(),

  titleHolders: '',
  vestingMethod: '',
  closingDocEmail: '',

  originationFee: '',
  uwFee: '$1,795',
  discountFee: '0',
  processingFeeBroker: '',
  creditReportFee: '',
  brokerYspCredit: '',
  miscFee2: '',
  appraisalFeeDue: '',
  appraisalFeePoc: '',
  processingFee3rdParty: '',
  brokerCredit: '',
  expectedTotal: '',
  authorizedBy: '',

  notes: '',
})

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-9 rounded-[3px] border border-gray-300 bg-white px-3 text-sm text-gray-900
          placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2
          focus:ring-primary/20 transition-all"
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 rounded-[3px] border border-gray-300 bg-white px-3 text-sm text-gray-900
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

// Contact grid row — shows broker + escrow always; buyer/seller only when isPurchase
function ContactRow({
  label,
  value,
  onChange,
  isPurchase,
}: {
  label: string
  value: ContactColumn
  onChange: (v: ContactColumn) => void
  isPurchase: boolean
}) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2 pr-3 text-xs font-medium text-gray-600 whitespace-nowrap w-36">{label}</td>
      {/* Broker Contact */}
      <td className="py-1.5 px-1">
        <input
          type="text"
          value={value.brokerContact}
          onChange={e => onChange({ ...value, brokerContact: e.target.value })}
          className="w-full h-8 rounded-[3px] border border-gray-300 bg-white px-2 text-sm
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </td>
      {/* Escrow / Settlement — always visible, right after Broker */}
      <td className="py-1.5 px-1">
        <input
          type="text"
          value={value.escrow}
          onChange={e => onChange({ ...value, escrow: e.target.value })}
          className="w-full h-8 rounded-[3px] border border-gray-300 bg-white px-2 text-sm
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </td>
      {/* Buyer's Agent — Purchase only */}
      {isPurchase && (
        <td className="py-1.5 px-1">
          <input
            type="text"
            value={value.buyersAgent}
            onChange={e => onChange({ ...value, buyersAgent: e.target.value })}
            className="w-full h-8 rounded-[3px] border border-gray-300 bg-white px-2 text-sm
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </td>
      )}
      {/* Seller's Agent — Purchase only */}
      {isPurchase && (
        <td className="py-1.5 px-1">
          <input
            type="text"
            value={value.sellersAgent}
            onChange={e => onChange({ ...value, sellersAgent: e.target.value })}
            className="w-full h-8 rounded-[3px] border border-gray-300 bg-white px-2 text-sm
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </td>
      )}
    </tr>
  )
}

function FeeRow({
  label,
  value,
  onChange,
  readOnly = false,
  highlight = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  readOnly?: boolean
  highlight?: boolean
}) {
  return (
    <tr className="border-b border-gray-200">
      <td className={`py-2 pr-3 text-xs font-medium whitespace-nowrap ${highlight ? 'text-primary font-semibold' : 'text-gray-600'}`}>
        {label}
      </td>
      <td className="py-1.5">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readOnly}
          className={`w-full h-8 rounded-[3px] border px-2 text-sm transition-all
            ${readOnly
              ? 'border-gray-200 bg-gray-50 text-gray-700 cursor-default'
              : 'border-gray-300 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
            ${highlight ? 'font-semibold text-primary border-primary/30 bg-primary-light' : ''}
          `}
        />
      </td>
    </tr>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isPurchase = form.transactionType === 'Purchase'

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const setContact = useCallback(<K extends keyof FormData>(key: K, value: ContactColumn) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = () => {
    setForm(initialForm())
    setStatus('idle')
    setErrorMsg('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      setStatus('success')
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-[3px] shadow-lg p-10 max-w-md w-full text-center border border-gray-200">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Received
          </h2>
          <p className="text-gray-600 mb-2">
            Closing Doc Order for{' '}
            <span className="font-semibold text-primary defy-break" data-allow-copy>
              {form.loanNumber || 'N/A'}
            </span>{' '}
            is with the doc drawing team.
          </p>
          <p className="text-sm text-gray-500 mb-8 defy-break">
            Delivered to <strong>setup@defywholesale.com</strong>
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-[5px]
              font-medium text-sm hover:bg-primary-hover transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Order Another →
          </button>
        </div>
      </div>
    )
  }

  const contactRows: Array<{ label: string; key: keyof FormData }> = [
    { label: 'Broker Name',            key: 'brokerName' },
    { label: 'State Lic #',            key: 'stateLic' },
    { label: 'NMLS ID',               key: 'nmlsId' },
    { label: 'Address',               key: 'address' },
    { label: 'City/St/Zip',           key: 'cityStZip' },
    { label: 'Contact',               key: 'contact' },
    { label: 'Contact Lic # (If App)', key: 'contactLic' },
    { label: 'Email @',               key: 'email' },
    { label: 'Phone #',               key: 'phone' },
  ]

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header — title only, no logo */}
        <div className="text-right mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            CLOSING DOC ORDER
          </h1>
          <p className="text-xs text-gray-500">Complete every field. No blanks.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Header Fields ── */}
          <div className="bg-white rounded-[3px] border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FieldInput
                label="Defy Loan Number"
                value={form.loanNumber}
                onChange={v => set('loanNumber', v)}
                required
              />
              <FieldInput
                label="Borrower(s) Last Name"
                value={form.borrowerLastName}
                onChange={v => set('borrowerLastName', v)}
                required
              />
              <FieldInput
                label="Loan Amount $"
                value={form.loanAmount}
                onChange={v => set('loanAmount', v)}
                placeholder="$0.00"
                required
              />
              <FieldInput
                label="Date Needed on Closing Docs"
                value={form.dateNeeded}
                onChange={v => set('dateNeeded', v)}
                type="date"
                required
              />
              <FieldInput
                label="Locked Rate %"
                value={form.lockedRate}
                onChange={v => set('lockedRate', v)}
                placeholder="0.000%"
              />
              <SelectInput
                label="Loan Product"
                value={form.loanProduct}
                onChange={v => set('loanProduct', v)}
                options={['30yr Fixed', '15yr Fixed', '40yr Fixed', '5/6 ARM', '7/6 ARM', '10/6 ARM', 'I/O Fixed', 'I/O ARM']}
              />
              <SelectInput
                label="Loan Purpose"
                value={form.transactionType}
                onChange={v => set('transactionType', v)}
                options={['Purchase', 'Refinance - Rate & Term', 'Refinance - Cash Out']}
              />
              <SelectInput
                label="Occupancy Type"
                value={form.occupancyType}
                onChange={v => set('occupancyType', v)}
                options={['Primary', 'Second Home', 'Investment']}
              />
            </div>
          </div>

          {/* ── Section 2: Contact Information ── */}
          <div className="bg-white rounded-[3px] border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-4">
              Contact Information
            </h2>
            <div className="defy-scroll-x">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-36" />
                    <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] text-center">
                      Broker Contact Info
                    </th>
                    <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] text-center">
                      Escrow / Settlement
                    </th>
                    {isPurchase && (
                      <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] text-center">
                        Purchase — Buyers Agent
                      </th>
                    )}
                    {isPurchase && (
                      <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] text-center">
                        Purchase — Sellers Agent
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {contactRows.map(({ label, key }) => (
                    <ContactRow
                      key={key}
                      label={label}
                      value={form[key] as ContactColumn}
                      onChange={v => setContact(key, v)}
                      isPurchase={isPurchase}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3">
              <FieldInput
                label="List all names that will hold Title"
                value={form.titleHolders}
                onChange={v => set('titleHolders', v)}
                className="w-full"
                required
              />
              <FieldInput
                label="Preferred Vesting Method for this Loan"
                value={form.vestingMethod}
                onChange={v => set('vestingMethod', v)}
                className="w-full"
              />
              <FieldInput
                label="Email for Closing Doc Delivery"
                value={form.closingDocEmail}
                onChange={v => set('closingDocEmail', v)}
                type="email"
                required
                className="w-full"
              />
            </div>
          </div>

          {/* ── Section 3: Broker Fee Details ── */}
          <div className="bg-white rounded-[3px] border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-4">
              Confirm Broker Fee Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="defy-scroll-x"><table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3">
                      Fee Description
                    </th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3 w-36">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <FeeRow label="Origination Fee (%/$)" value={form.originationFee} onChange={v => set('originationFee', v)} />
                  <FeeRow label="Underwriting Fee" value={form.uwFee} onChange={v => set('uwFee', v)} readOnly />
                  <FeeRow label="Paid to Defy Discount Fee (%/$)" value={form.discountFee} onChange={v => set('discountFee', v)} readOnly />
                  <FeeRow label="Processing Fee — Broker Charged" value={form.processingFeeBroker} onChange={v => set('processingFeeBroker', v)} />
                  <FeeRow label="Credit Report Fee" value={form.creditReportFee} onChange={v => set('creditReportFee', v)} />
                  <FeeRow label="Broker YSP Credit (DSCR Only)" value={form.brokerYspCredit} onChange={v => set('brokerYspCredit', v)} />
                </tbody>
              </table></div>

              <div className="defy-scroll-x"><table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3">
                      Other Fees
                    </th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3 w-36">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <FeeRow label="Misc Fee #2*" value={form.miscFee2} onChange={v => set('miscFee2', v)} />
                  <FeeRow label="Appraisal Fee — DUE" value={form.appraisalFeeDue} onChange={v => set('appraisalFeeDue', v)} />
                  <FeeRow label="Appraisal Fee — POC" value={form.appraisalFeePoc} onChange={v => set('appraisalFeePoc', v)} />
                  <FeeRow label="Processing Fee — Paid to 3rd Party" value={form.processingFee3rdParty} onChange={v => set('processingFee3rdParty', v)} />
                  <FeeRow label="Broker Credit to Borrower (%)" value={form.brokerCredit} onChange={v => set('brokerCredit', v)} />
                </tbody>
              </table></div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Expected Total $"
                value={form.expectedTotal}
                onChange={v => set('expectedTotal', v)}
                placeholder="$0.00"
              />
              <FieldInput
                label="This Form is Authorized By (Full Name)"
                value={form.authorizedBy}
                onChange={v => set('authorizedBy', v)}
                required
              />
            </div>
          </div>

          {/* ── Section 4: Additional Information ── */}
          <div className="bg-white rounded-[3px] border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-4">
              Additional Information
            </h2>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                *Notes to the Doc Drawing Team
              </label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={5}
                placeholder="Include any special instructions, conditions, or notes for the doc drawing team..."
                className="rounded-[3px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
                  placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2
                  focus:ring-primary/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* ── Required Attachments Reminder ── */}
          <div className="bg-primary-light rounded-[3px] border border-primary/20 p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Please Include These Items with This Form
            </h4>
            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>Invoices: Any/All 3rd Party Invoices to be collected at closing (i.e. Credit / Survey / Processing if 3rd Party)</li>
              <li>Updated Escrow/Title Fee Sheet showing correct loan amount and all fees (ideal)</li>
            </ul>
          </div>

          {/* ── Error Banner ── */}
          {status === 'error' && (
            <div className="flex items-center gap-3 bg-error-surface border border-error/30 text-error rounded-[3px] px-4 py-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg || 'Submission failed. Please try again.'}</span>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="flex items-center justify-between gap-4 pb-8">
            <p className="text-xs text-gray-500">
              Delivered to: <span className="font-medium defy-break">setup@defywholesale.com</span>
            </p>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-[5px]
                font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-60
                disabled:cursor-not-allowed shadow-md"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Closing Doc Order →
                </>
              )}
            </button>
          </div>

        </form>

        <p className="text-center text-xs text-gray-500 pb-6">
          Defy Mortgage, LLC · NMLS #2383214
        </p>
      </div>
    </div>
  )
}
