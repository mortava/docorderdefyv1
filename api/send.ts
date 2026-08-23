import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'ReadytoClose@tqltpo.com'
const TO = ['tposupport@tqlend.com', 'Disclosuredesk@tqlend.com']

interface ContactColumn {
  brokerContact: string
  buyersAgent: string
  sellersAgent: string
  escrow: string
}

interface FormData {
  tqlLoanNumber: string
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
  tqlUwFee: string
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

function tr(label: string, value: string) {
  if (!value) return ''
  return `<tr>
    <td style="padding:6px 12px;font-size:12px;color:#64748B;font-weight:600;white-space:nowrap;background:#F7F7F8;border-bottom:1px solid #E2E8F0;width:220px;">${label}</td>
    <td style="padding:6px 12px;font-size:13px;color:#0B1220;border-bottom:1px solid #E2E8F0;">${value}</td>
  </tr>`
}

function sectionHead(title: string) {
  return `<tr><td colspan="2" style="background:#24788F;color:#fff;padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${title}</td></tr>`
}

function contactRows(data: FormData): string {
  const fields: Array<{ label: string; key: keyof FormData }> = [
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
  return fields.map(({ label, key }) => {
    const col = data[key] as ContactColumn
    return `<tr style="border-bottom:1px solid #E2E8F0;">
      <td style="padding:5px 8px;font-size:12px;color:#64748B;font-weight:500;background:#F7F7F8;width:120px;">${label}</td>
      <td style="padding:5px 8px;font-size:12px;color:#0B1220;">${col.brokerContact || ''}</td>
      <td style="padding:5px 8px;font-size:12px;color:#0B1220;">${col.buyersAgent || ''}</td>
      <td style="padding:5px 8px;font-size:12px;color:#0B1220;">${col.sellersAgent || ''}</td>
      <td style="padding:5px 8px;font-size:12px;color:#0B1220;">${col.escrow || ''}</td>
    </tr>`
  }).join('')
}

function buildHtml(d: FormData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F7F7F8;font-family:'DM Sans','Segoe UI',Arial,Helvetica,sans-serif;">
<div style="max-width:720px;margin:32px auto;background:#fff;border-radius:3px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#24788F;">
    <tr>
      <td style="padding:20px 28px;">
        <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">CLOSING DOC ORDER</div>
        <div style="color:#EDF4F6;font-size:12px;margin-top:2px;">Defy Wholesale — Broker Portal</div>
      </td>
      <td style="padding:20px 28px;text-align:right;">
        <div style="color:#EDF4F6;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">Defy Loan Number</div>
        <div style="color:#fff;font-size:20px;font-weight:700;">${d.tqlLoanNumber || 'N/A'}</div>
      </td>
    </tr>
  </table>

  <div style="padding:24px 28px;">

    <!-- Loan Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${sectionHead('Loan Details')}
      ${tr('Borrower(s) Last Name', d.borrowerLastName)}
      ${tr('Loan Amount', d.loanAmount)}
      ${tr('Date Needed on Closing Docs', d.dateNeeded)}
      ${tr('Locked Rate %', d.lockedRate)}
      ${tr('Loan Product', d.loanProduct)}
      ${tr('Transaction Type', d.transactionType)}
      ${tr('Occupancy Type', d.occupancyType)}
    </table>

    <!-- Contact Information -->
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#24788F;border-bottom:2px solid #24788F;padding-bottom:6px;margin-bottom:12px;">Contact Information</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E2E8F0;margin-bottom:12px;">
      <thead>
        <tr style="background:#24788F;">
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;width:120px;"> </th>
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Broker Contact</th>
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Buyer's Agent</th>
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Seller's Agent</th>
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Escrow/Settlement</th>
        </tr>
      </thead>
      <tbody>${contactRows(d)}</tbody>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${tr('Title Holders', d.titleHolders)}
      ${tr('Vesting Method', d.vestingMethod)}
      ${tr('Email for Closing Doc Delivery', d.closingDocEmail)}
    </table>

    <!-- Fee Details -->
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#24788F;border-bottom:2px solid #24788F;padding-bottom:6px;margin-bottom:12px;">Broker Fee Details</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${sectionHead('Standard Fees')}
      ${tr('Origination Fee (%/$)', d.originationFee)}
      ${tr('Underwriting Fee', d.tqlUwFee)}
      ${tr('Paid to Defy Discount Fee (%/$)', d.discountFee)}
      ${tr('Processing Fee — Broker Charged', d.processingFeeBroker)}
      ${tr('Credit Report Fee', d.creditReportFee)}
      ${tr('Broker YSP Credit (DSCR Only)', d.brokerYspCredit)}
      ${sectionHead('Other Fees')}
      ${tr('Misc Fee #2', d.miscFee2)}
      ${tr('Appraisal Fee — DUE', d.appraisalFeeDue)}
      ${tr('Appraisal Fee — POC', d.appraisalFeePoc)}
      ${tr('Processing Fee — Paid to 3rd Party', d.processingFee3rdParty)}
      ${tr('Broker Credit to Borrower (%)', d.brokerCredit)}
      <tr style="background:#E6EEF1;">
        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#24788F;">EXPECTED TOTAL</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#24788F;">${d.expectedTotal || '—'}</td>
      </tr>
      ${tr('Authorized By (Full Name)', d.authorizedBy)}
    </table>

    ${d.notes ? `
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#24788F;border-bottom:2px solid #24788F;padding-bottom:6px;margin-bottom:8px;">Notes to Doc Drawing Team</div>
    <div style="background:#F7F7F8;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:13px;color:#334155;line-height:1.6;margin-bottom:20px;">
      ${d.notes.replace(/\n/g, '<br/>')}
    </div>` : ''}

    <!-- Checklist reminder -->
    <div style="background:#E6EEF1;border-radius:8px;padding:12px 16px;border:1px solid #cbd5e1;">
      <div style="font-size:11px;font-weight:700;color:#24788F;margin-bottom:4px;">PLEASE INCLUDE WITH THIS ORDER:</div>
      <ul style="margin:0;padding-left:16px;font-size:12px;color:#475569;line-height:1.8;">
        <li>Invoices: Any/All 3rd Party Invoices to be collected at closing (Credit / Survey / Processing if 3rd Party)</li>
        <li>Updated Escrow/Title Fee Sheet showing correct loan amount and all fees</li>
      </ul>
    </div>
  </div>

  <div style="background:#24788F;padding:12px 28px;text-align:center;">
    <div style="color:#EDF4F6;font-size:11px;">Defy Mortgage, LLC &middot; NMLS #2383214</div>
  </div>

</div>
</body></html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const data = req.body as FormData
  const loanNumber = data.tqlLoanNumber || 'N/A'

  try {
    await resend.emails.send({
      from: FROM,
      to: TO,
      subject: `Closing Doc Order for ${loanNumber}`,
      html: buildHtml(data),
      text: `Closing Doc Order for ${loanNumber}\nBorrower: ${data.borrowerLastName}\nLoan Amount: ${data.loanAmount}\nDate Needed: ${data.dateNeeded}\nAuthorized By: ${data.authorizedBy}`,
    })

    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send email'
    return res.status(500).json({ error: msg })
  }
}
