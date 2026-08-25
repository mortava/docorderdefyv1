import { useState, useCallback } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

// One row of contact data, held per party. The Broker/TPO party was removed
// 2026-08-24 — the broker filling this form is already identified by the loan.
interface ContactColumn {
  escrow: string
  buyersAgent: string
  sellersAgent: string
}

type ContactParty = keyof ContactColumn

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
  address: ContactColumn
  contact: ContactColumn
  contactLic: ContactColumn
  email: ContactColumn
  phone: ContactColumn

  titleHolders: string
  vestingMethod: string
  closingDocEmail: string
  closingType: string

  originationFee: string
  processingFeeBroker: string
  creditReportFee: string
  brokerYspCredit: string
  miscFee2: string
  processingFee3rdParty: string
  brokerCredit: string
  authorizedBy: string

  notes: string
}

// Keys on FormData whose value is a ContactColumn.
type ContactFieldKey = {
  [K in keyof FormData]: FormData[K] extends ContactColumn ? K : never
}[keyof FormData]

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

// DEFY ONE — where brokers return after submitting.
const WORKSPACE_URL = 'https://one.defywholesale.com'

// ── Helpers ────────────────────────────────────────────────────────────────

// Local calendar date as YYYY-MM-DD for <input type="date">.
// NOT toISOString() — that is UTC and returns tomorrow after ~7pm Central.
function todayLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function emptyContact(): ContactColumn {
  return { escrow: '', buyersAgent: '', sellersAgent: '' }
}

// ── Money ──────────────────────────────────────────────────────────────────
// Fee inputs are dollars only. Never parse a displayed value with Number() —
// "$1,695.00" is NaN. Strip the formatting first.

function parseMoney(raw: string): number {
  if (!raw) return 0
  const negative = /^\s*[(-]/.test(raw)
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''))
  if (!isFinite(n)) return 0
  return negative ? -n : n
}

function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Which fees roll into which total. Jay, 2026-08-25: Credit Report and
// Misc #2 are broker-side; only the 3rd-party processing fee is a pass-through.
// Broker Credit to Borrower is in neither — it is shown on its own, not summed.
const BROKER_FEE_KEYS = [
  'originationFee',
  'processingFeeBroker',
  'creditReportFee',
  'miscFee2',
  'brokerYspCredit',
] as const

const THIRD_PARTY_FEE_KEYS = [
  'processingFee3rdParty',
] as const

const sumFees = (form: FormData, keys: readonly (keyof FormData)[]) =>
  keys.reduce((sum, k) => sum + parseMoney(form[k] as string), 0)

const brokerTotal = (form: FormData) => sumFees(form, BROKER_FEE_KEYS)
const thirdPartyTotal = (form: FormData) => sumFees(form, THIRD_PARTY_FEE_KEYS)

// Field rows shared by every contact party.
const CONTACT_FIELDS: Array<{ label: string; key: ContactFieldKey }> = [
  { label: 'Company Name',           key: 'brokerName' },
  { label: 'Contact',                key: 'contact' },
  { label: 'Phone #',                key: 'phone' },
  { label: 'Email @',                key: 'email' },
  { label: 'Address',                key: 'address' },
  { label: 'Contact Lic # (If App)', key: 'contactLic' },
]

const VESTING_METHODS = [
  'Entity / LLC',
  'Natural Person(s)',
  'TRUST (Must have Prior Approval*)',
]

const CLOSING_TYPES = ['In Office', 'Mobile', 'Mail Away', 'E-Note', 'Foreign Embassy']

const initialForm = (): FormData => ({
  loanNumber: '',
  borrowerLastName: '',
  loanAmount: '',
  dateNeeded: todayLocal(),
  lockedRate: '',
  loanProduct: '30yr Fixed',
  transactionType: 'Refinance - Rate & Term',
  occupancyType: 'Investment',

  brokerName: emptyContact(),
  address: emptyContact(),
  contact: emptyContact(),
  contactLic: emptyContact(),
  email: emptyContact(),
  phone: emptyContact(),

  titleHolders: '',
  vestingMethod: 'Entity / LLC',
  closingDocEmail: '',
  closingType: 'Mobile',

  originationFee: '',
  processingFeeBroker: '',
  creditReportFee: '',
  brokerYspCredit: '',
  miscFee2: '',
  processingFee3rdParty: '',
  brokerCredit: '',
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
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-10 rounded-[3px] border border-gray-300 bg-white px-3 text-sm text-gray-900
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
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 rounded-[3px] border border-gray-300 bg-white px-3 text-sm text-gray-900
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

// One contact party (Escrow, Buyer's Agent, Seller's Agent) rendered as a
// labelled block. Refinance shows a single block laid out horizontally;
// Purchase stacks three blocks vertically.
function ContactPartyBlock({
  title,
  party,
  form,
  onChange,
  children,
}: {
  title: string
  party: ContactParty
  form: FormData
  onChange: (key: ContactFieldKey, value: ContactColumn) => void
  children?: React.ReactNode
}) {
  return (
    <div>
      <SectionBar>{title}</SectionBar>
      <div className="border border-t-0 border-gray-200 rounded-b-[3px] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CONTACT_FIELDS.map(({ label, key }) => (
          <FieldInput
            key={key}
            label={label}
            value={form[key][party]}
            onChange={v => onChange(key, { ...form[key], [party]: v })}
          />
        ))}
        {children}
      </div>
    </div>
  )
}

// Teal block header shared by the contact, vesting and closing-type sections.
function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] px-3 py-2">
      {children}
    </div>
  )
}


// Calculated total closing a fee table. Read-only by construction.
function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="bg-primary">
      <td className="py-2 pr-3 pl-3 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
        {label}
      </td>
      <td className="py-2 px-3 text-sm font-bold text-white tabular-nums">
        {formatMoney(value)}
      </td>
    </tr>
  )
}

// Dollar-only fee input. Types freely, normalises to $0.00 on blur.
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
          inputMode="decimal"
          value={value}
          placeholder="$0.00"
          onChange={e => onChange(e.target.value)}
          onBlur={e => {
            const raw = e.target.value.trim()
            onChange(raw === '' ? '' : formatMoney(parseMoney(raw)))
          }}
          readOnly={readOnly}
          className={`w-full h-10 rounded-[3px] border px-2 text-sm transition-all
            placeholder:text-gray-400
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
  const broker = brokerTotal(form)
  const thirdParty = thirdPartyTotal(form)

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const setContact = useCallback((key: ContactFieldKey, value: ContactColumn) => {
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
        // Totals are derived, not stored — compute them for the email.
        body: JSON.stringify({
          ...form,
          brokerTotal: formatMoney(brokerTotal(form)),
          thirdPartyTotal: formatMoney(thirdPartyTotal(form)),
        }),
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
          {/* Returning to the workspace is the expected next step, so it takes
              the single accent action. target="_top" breaks out of the parent
              frame if this form is embedded — otherwise it behaves as _self. */}
          <div className="flex flex-col gap-3">
            <a
              href={WORKSPACE_URL}
              target="_top"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3
                rounded-[5px] font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              Return to Workspace →
            </a>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900
                border border-gray-300 px-6 py-3 rounded-[5px] font-medium text-sm
                hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Order Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Title + Header Fields ── */}
          <div className="bg-white rounded-[3px] border border-gray-200 shadow-sm p-6">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-5">
              CLOSING DOC ORDER
            </h1>
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
                options={['30yr Fixed', '40yr Fixed', '30yr I/O', '40yr I/O', '15yr Fixed', '20yr Fixed']}
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
            <div className="space-y-6">
              <ContactPartyBlock
                title="Title / Escrow Contact"
                party="escrow"
                form={form}
                onChange={setContact}
              >
                <FieldInput
                  label="Email for Closing Doc Delivery"
                  value={form.closingDocEmail}
                  onChange={v => set('closingDocEmail', v)}
                  type="email"
                  required
                />
              </ContactPartyBlock>
              {isPurchase && (
                <ContactPartyBlock
                  title="Purchase — Buyer's Agent"
                  party="buyersAgent"
                  form={form}
                  onChange={setContact}
                />
              )}
              {isPurchase && (
                <ContactPartyBlock
                  title="Purchase — Seller's Agent"
                  party="sellersAgent"
                  form={form}
                  onChange={setContact}
                />
              )}
            </div>

            {/* Vesting and Closing Type sit side by side — one closing has one
                type, so these are radios, not checkboxes. */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SectionBar>Vesting</SectionBar>
                <div className="border border-t-0 border-gray-200 rounded-b-[3px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectInput
                    label="Preferred Vesting Method for this Loan"
                    value={form.vestingMethod}
                    onChange={v => set('vestingMethod', v)}
                    options={VESTING_METHODS}
                  />
                  <FieldInput
                    label="List all names that will hold Title"
                    value={form.titleHolders}
                    onChange={v => set('titleHolders', v)}
                    required
                  />
                </div>
              </div>

              <div>
                <SectionBar>Closing Type</SectionBar>
                <div className="border border-t-0 border-gray-200 rounded-b-[3px] p-4 flex flex-col gap-2">
                  {/* py-1.5 keeps each label — the real activation target —
                      above the 24px WCAG 2.2 minimum. */}
                  {CLOSING_TYPES.map(t => (
                    <label key={t} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 cursor-pointer">
                      <input
                        type="radio"
                        name="closingType"
                        value={t}
                        checked={form.closingType === t}
                        onChange={() => set('closingType', t)}
                        className="w-4 h-4 accent-primary"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
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
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3">
                      Broker Fees
                    </th>
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3 w-36">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <FeeRow label="Origination Fee" value={form.originationFee} onChange={v => set('originationFee', v)} />
                  <FeeRow label="Processing Fee — Broker Charged" value={form.processingFeeBroker} onChange={v => set('processingFeeBroker', v)} />
                  <FeeRow label="Credit Report Fee" value={form.creditReportFee} onChange={v => set('creditReportFee', v)} />
                  <FeeRow label="Misc Fee #2" value={form.miscFee2} onChange={v => set('miscFee2', v)} />
                  <FeeRow label="Broker YSP Credit (DSCR Only)" value={form.brokerYspCredit} onChange={v => set('brokerYspCredit', v)} />
                  <TotalRow label="Broker Total" value={broker} />
                </tbody>
              </table></div>

              <div className="defy-scroll-x"><table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3">
                      Third Party Fees
                    </th>
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-white bg-primary rounded-t-[3px] py-2 px-3 w-36">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <FeeRow label="Processing Fee — Paid to 3rd Party" value={form.processingFee3rdParty} onChange={v => set('processingFee3rdParty', v)} />
                  <TotalRow label="Third Party Total" value={thirdParty} />
                </tbody>
              </table></div>
            </div>

            {/* Borrower credit sits apart from the fee tables. It is a credit,
                not a charge — it is in neither total. */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Broker Credit to Borrower
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.brokerCredit}
                  placeholder="$0.00"
                  onChange={e => set('brokerCredit', e.target.value)}
                  onBlur={e => {
                    const raw = e.target.value.trim()
                    set('brokerCredit', raw === '' ? '' : formatMoney(parseMoney(raw)))
                  }}
                  className="h-10 rounded-[3px] border border-gray-300 bg-white px-3 text-sm text-gray-900
                    placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2
                    focus:ring-primary/20 transition-all"
                />
                <p className="text-[11px] text-gray-500">Shown separately — in neither total.</p>
              </div>

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
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Notes to the Doc Drawing Team
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
