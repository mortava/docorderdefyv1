import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// DEFY Wholesale Resend domain (defywholesale.com). Both are env-overridable so
// routing can change without a redeploy; the defaults are the live values.
const FROM = process.env.RESEND_FROM_EMAIL || 'docorder@defywholesale.com'

// setup@ routes to the Cloudflare `submission-conditions` worker — the same
// lane the other DEFY doc/condition intake apps use.
const TO = (process.env.RESEND_TO_EMAILS || 'setup@defywholesale.com')
  .split(',')
  .map(a => a.trim())
  .filter(Boolean)

interface ContactColumn {
  escrow: string
  buyersAgent: string
  sellersAgent: string
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
  brokerTotal: string
  thirdPartyTotal: string
  authorizedBy: string
  notes: string
}

function tr(label: string, value: string) {
  if (!value) return ''
  return `<tr>
    <td style="padding:6px 12px;font-size:12px;color:#4A5A68;font-weight:600;white-space:nowrap;background:#F2F7F9;border-bottom:1px solid #D8DCE2;width:220px;">${label}</td>
    <td style="padding:6px 12px;font-size:13px;color:#0A0E17;border-bottom:1px solid #D8DCE2;">${value}</td>
  </tr>`
}

function sectionHead(title: string) {
  return `<tr><td colspan="2" style="background:#1F7C93;color:#fff;padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${title}</td></tr>`
}

function contactRows(data: FormData): string {
  const fields: Array<{ label: string; key: keyof FormData }> = [
    { label: 'Company Name',           key: 'brokerName' },
    { label: 'Contact',                key: 'contact' },
    { label: 'Phone #',                key: 'phone' },
    { label: 'Email @',                key: 'email' },
    { label: 'Address',                key: 'address' },
    { label: 'Contact Lic # (If App)', key: 'contactLic' },
  ]
  const isPurchase = data.transactionType === 'Purchase'
  return fields.map(({ label, key }) => {
    const col = data[key] as ContactColumn
    const cell = (v: string) =>
      `<td style="padding:5px 8px;font-size:12px;color:#0A0E17;">${v || ''}</td>`
    return `<tr style="border-bottom:1px solid #D8DCE2;">
      <td style="padding:5px 8px;font-size:12px;color:#4A5A68;font-weight:500;background:#F2F7F9;width:120px;">${label}</td>
      ${cell(col.escrow)}
      ${isPurchase ? cell(col.buyersAgent) + cell(col.sellersAgent) : ''}
    </tr>`
  }).join('')
}

function buildHtml(d: FormData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:Inter,'Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:720px;margin:32px auto;background:#fff;border-radius:3px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1F7C93;">
    <tr>
      <td style="padding:20px 28px;">
        <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">CLOSING DOC ORDER</div>
        <div style="color:#FFFFFF;font-size:12px;margin-top:2px;">DEFY TPO — Broker Portal</div>
      </td>
      <td style="padding:20px 28px;text-align:right;">
        <div style="color:#FFFFFF;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">Defy Loan Number</div>
        <div style="color:#fff;font-size:20px;font-weight:700;">${d.loanNumber || 'N/A'}</div>
      </td>
    </tr>
  </table>

  <div style="padding:24px 28px;">

    <!-- Loan Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #D8DCE2;border-radius:8px;overflow:hidden;margin-bottom:20px;">
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
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1F7C93;border-bottom:2px solid #1F7C93;padding-bottom:6px;margin-bottom:12px;">Title / Escrow Contact</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #D8DCE2;margin-bottom:12px;">
      <thead>
        <tr style="background:#1F7C93;">
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;width:120px;"> </th>
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Title / Escrow Contact</th>
          ${d.transactionType === 'Purchase' ? `
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Buyer's Agent</th>
          <th style="padding:6px 8px;color:#fff;font-size:11px;text-align:left;">Seller's Agent</th>` : ''}
        </tr>
      </thead>
      <tbody>${contactRows(d)}</tbody>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #D8DCE2;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${tr('Title Holders', d.titleHolders)}
      ${tr('Vesting Method', d.vestingMethod)}
      ${tr('Closing Type', d.closingType)}
      ${tr('Email for Closing Doc Delivery', d.closingDocEmail)}
    </table>

    <!-- Fee Details -->
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1F7C93;border-bottom:2px solid #1F7C93;padding-bottom:6px;margin-bottom:12px;">Broker Fee Details</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #D8DCE2;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${sectionHead('Broker Fees')}
      ${tr('Origination Fee', d.originationFee)}
      ${tr('Processing Fee — Broker Charged', d.processingFeeBroker)}
      ${tr('Credit Report Fee', d.creditReportFee)}
      ${tr('Misc Fee #2', d.miscFee2)}
      ${tr('Broker YSP Credit (DSCR Only)', d.brokerYspCredit)}

      <tr style="background:#1F7C93;">
        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#FFFFFF;">BROKER TOTAL</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#FFFFFF;">${d.brokerTotal || '—'}</td>
      </tr>
      ${sectionHead('Third Party Fees')}
      ${tr('Processing Fee — Paid to 3rd Party', d.processingFee3rdParty)}
      <tr style="background:#1F7C93;">
        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#FFFFFF;">THIRD PARTY TOTAL</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#FFFFFF;">${d.thirdPartyTotal || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#4A5A68;border-top:1px solid #D8DCE2;">
          Broker Credit to Borrower<br/>
          <span style="font-size:10px;color:#4A5A68;">shown separately — in neither total</span>
        </td>
        <td style="padding:8px 12px;font-size:13px;color:#0A0E17;border-top:1px solid #D8DCE2;">${d.brokerCredit || '—'}</td>
      </tr>
      ${tr('Authorized By (Full Name)', d.authorizedBy)}
    </table>

    ${d.notes ? `
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1F7C93;border-bottom:2px solid #1F7C93;padding-bottom:6px;margin-bottom:8px;">Notes to Doc Drawing Team</div>
    <div style="background:#F2F7F9;border:1px solid #D8DCE2;border-radius:8px;padding:12px;font-size:13px;color:#4A5A68;line-height:1.6;margin-bottom:20px;">
      ${d.notes.replace(/\n/g, '<br/>')}
    </div>` : ''}

    <!-- Checklist reminder -->
    <div style="background:#F2F7F9;border-radius:8px;padding:12px 16px;border:1px solid #D8DCE2;">
      <div style="font-size:11px;font-weight:700;color:#0A0E17;margin-bottom:4px;">PLEASE INCLUDE WITH THIS ORDER:</div>
      <ul style="margin:0;padding-left:16px;font-size:12px;color:#4A5A68;line-height:1.8;">
        <li>Invoices: Any/All 3rd Party Invoices to be collected at closing (Credit / Survey / Processing if 3rd Party)</li>
        <li>Updated Escrow/Title Fee Sheet showing correct loan amount and all fees</li>
      </ul>
    </div>
  </div>

  <div style="background:#1F7C93;padding:12px 28px;text-align:center;">
    <div style="color:#FFFFFF;font-size:11px;">Defy Mortgage, LLC &middot; NMLS #2383214</div>
  </div>

</div>
</body></html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const data = req.body as FormData
  const loanNumber = data.loanNumber || 'N/A'

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
