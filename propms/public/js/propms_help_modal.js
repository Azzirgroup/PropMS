// "How It Works" — renders the Property Management Solution guide directly
// inside a Frappe dialog (no iframe, no external page navigation).
//
// Any element that links to /propms-help or carries the .propms-how-it-works
// class on a desk page is intercepted and opens this in-app modal instead.

frappe.provide("propms");

propms.help_content = function () {
	// Self-contained HTML. Inline styles keep it readable inside the dialog
	// without depending on any built CSS asset.
	return `
<div class="propms-guide" style="max-height:74vh;overflow-y:auto;padding:4px 14px 20px;line-height:1.55;">

  <p style="color:var(--text-muted);margin-bottom:16px;">
    Property Management Solution runs the full cycle: register buildings &amp; units,
    lease them, bill rent automatically, handle maintenance, and track compliance.
    Here's how the pieces fit together.
  </p>

  <h4 style="margin:18px 0 6px;">🏗️ The core model: Building → Unit → Lease</h4>
  <p>The three entities you work with every day:</p>
  <ul style="margin:6px 0 12px;padding-left:20px;">
    <li><b>Property</b> = the <i>building or estate</i>. Holds location, shared meters,
        insurance, documents, amenities, company &amp; cost center. It's a tree, so an
        estate can contain buildings (use <code>Is Group</code>).</li>
    <li><b>Property Unit</b> = the <i>individually leasable space</i> (apartment, office,
        shop) inside a Property. Carries rent, deposit, bedrooms and the
        <b>occupancy status</b> (Available / Rented / …). <b>This is what you lease.</b></li>
    <li><b>Lease</b> = the tenancy contract for one <b>Property Unit</b>. The building,
        company and cost center are auto-filled from the unit, so billing and reports
        keep working at the building level.</li>
  </ul>
  <div style="background:var(--bg-color,#f6f8fa);border-left:3px solid #449cf0;padding:8px 12px;border-radius:4px;margin:8px 0 16px;">
    <b>In short:</b> you create a <b>Property</b> (building) once, add a
    <b>Property Unit</b> per leasable space, then raise a <b>Lease</b> against the unit.
    Leasing a unit flips its status to <b>Rented</b>; when the lease ends it returns to
    <b>Available</b> automatically.
  </div>

  <h4 style="margin:18px 0 6px;">🔗 Doctypes &amp; how they link</h4>
  <pre style="background:var(--bg-color,#f6f8fa);padding:12px 14px;border-radius:6px;overflow-x:auto;font-size:12.5px;line-height:1.5;">
   Customer ──owns/rents──┐
                          ▼
   Property (building / estate, tree)
     ├── company, cost_center        ← inherited by its units
     ├── Insurance
     ├── Property Document  (expiry / compliance)
     ├── Property Vendor    (service providers)
     ├── Property Meter Reading ── Meter
     └── Property Unit  (the leasable space, status: Available/Rented/…)
              │
              ▼
          Lease ── Lease Item (rent, service charge, …)
              │
              ▼
     Lease Invoice Schedule  ──(daily 12:00)──►  Sales Invoice ──► Payment Entry

   Meter Reading ──(on submit)──► Sales Invoice   (utility bill to tenant)
   Issue ──► Material Request ──► Sales Invoice    (maintenance bill-back)
   Lease (on submit) ──► Daily Checklist           (Handover / Takeover)
  </pre>

  <h4 style="margin:18px 0 6px;">📋 Day-to-day workflows</h4>

  <p style="margin:10px 0 4px;"><b>1 · Onboard a building &amp; its units</b></p>
  <ol style="margin:4px 0 12px;padding-left:22px;">
    <li>Create a <b>Property</b> for the building — set Company &amp; Cost Center (these flow down to its units).</li>
    <li>Add a <b>Property Unit</b> for each leasable space, with its <code>property</code> set to that building. Rent, deposit and status live here — <b>saving the unit auto-creates its Rent item</b>.</li>
    <li>Attach the title deed / certificates as <b>Property Documents</b> (with expiry dates) and register meters under the Property.</li>
  </ol>

  <p style="margin:10px 0 4px;"><b>2 · Lease a unit</b></p>
  <ol style="margin:4px 0 12px;padding-left:22px;">
    <li>Create a <b>Lease</b>, pick the <b>Property Unit</b> — the building, company &amp; owner auto-fill, a <b>Rent</b> Lease Item is pre-added from the unit's rent, and the security deposit is seeded.</li>
    <li>Adjust or add more <b>Lease Items</b> (service charge, parking…) with their frequency (Monthly, Quarterly, Annually…).</li>
    <li>Capture <b>opening meter readings</b> at handover in the <em>Meter Readings</em> table — these auto-fill from the unit's building meters; record <b>closing readings</b> at move-out and units consumed is computed.</li>
    <li><b>Save</b>, then click <b>Make Invoice Schedule</b> to generate the billing rows. <b>Submit</b> the lease.</li>
    <li>The unit's status becomes <b>Rented</b>; a <b>Handover</b> Daily Checklist is created automatically.</li>
  </ol>

  <p style="margin:10px 0 4px;"><b>3 · Billing</b></p>
  <ol style="margin:4px 0 12px;padding-left:22px;">
    <li>Daily at <b>12:00</b>, due rows in <b>Lease Invoice Schedule</b> become <b>Sales Invoices</b> (grouped per customer / item-group / date / currency).</li>
    <li>Use <b>Tools → Generate Due Invoices</b> on a Lease to run it on demand, or <b>Create Voucher</b> on a single schedule row.</li>
    <li>Utility charges: submit a <b>Meter Reading</b> → a Sales Invoice is raised to the unit's current lease customer.</li>
  </ol>

  <p style="margin:10px 0 4px;"><b>4 · Maintenance</b></p>
  <ol style="margin:4px 0 12px;padding-left:22px;">
    <li>Open an <b>Issue</b> for the property, assign a person-in-charge / <b>Property Vendor</b>.</li>
    <li>Add parts to <em>Materials Required</em> → a Material Request is created; on issue it can bill the tenant via Sales Invoice.</li>
    <li>Close the Issue with customer feedback.</li>
  </ol>

  <p style="margin:10px 0 4px;"><b>5 · Move-out</b></p>
  <ol style="margin:4px 0 12px;padding-left:22px;">
    <li>Create an <b>Exit</b> record and a <b>Takeover</b> Daily Checklist.</li>
    <li>Reconcile the Security Deposit on the Lease (Returned / Recovered for rent / repairs).</li>
    <li>After lease end, the daily scheduler flips the unit back to <b>Available</b>.</li>
  </ol>

  <h4 style="margin:18px 0 6px;">⚙️ Settings that matter</h4>
  <table class="table table-bordered" style="font-size:13px;margin:6px 0 14px;">
    <thead><tr><th>Setting</th><th>Where</th><th>Effect</th></tr></thead>
    <tbody>
      <tr><td>Invoice Start Date</td><td>Property Management Settings</td><td>Auto-invoice job ignores schedule rows before this date.</td></tr>
      <tr><td>Maintenance Item Group</td><td>Property Management Settings</td><td>Item groups eligible for automated maintenance billing.</td></tr>
      <tr><td>Security Deposit Item / Payment Type</td><td>Property Management Settings</td><td>Defaults for deposit Journal Entries.</td></tr>
      <tr><td>Company → Default Tax Template</td><td>Company</td><td>Applied to every auto-generated Sales Invoice.</td></tr>
      <tr><td>Cost Center</td><td>Property (building)</td><td>Stamped on invoices for per-property P&amp;L; inherited by units.</td></tr>
      <tr><td>Checklist Checkup Area</td><td>Checklist Checkup Area</td><td>"Handover"/"Takeover" templates seed Daily Checklist tasks.</td></tr>
    </tbody>
  </table>

  <h4 style="margin:18px 0 6px;">⏱️ Scheduled jobs</h4>
  <table class="table table-bordered" style="font-size:13px;margin:6px 0 14px;">
    <thead><tr><th>Job</th><th>When</th><th>Does</th></tr></thead>
    <tbody>
      <tr><td>statusChangeBeforeLeaseExpire</td><td>Daily</td><td>Units whose lease ends ≤3 months → <em>Off Lease in 3 Months</em>.</td></tr>
      <tr><td>statusChangeAfterLeaseExpire</td><td>Daily</td><td>Units whose lease has ended → <em>Available</em>.</td></tr>
      <tr><td>leaseInvoiceAutoCreate</td><td>Daily 12:00</td><td>Turns due schedule rows into Sales Invoices.</td></tr>
      <tr><td>mark_expiring_documents</td><td>Daily</td><td>Property Documents → <em>Expiring Soon</em> / <em>Expired</em>.</td></tr>
    </tbody>
  </table>

  <h4 style="margin:18px 0 6px;">📊 Reports</h4>
  <table class="table table-bordered" style="font-size:13px;margin:6px 0 4px;">
    <thead><tr><th>Report</th><th>Answers</th></tr></thead>
    <tbody>
      <tr><td>Property Status</td><td>Leased / available / on-sale split.</td></tr>
      <tr><td>Lease Information</td><td>Active leases with tenants, dates, deposits.</td></tr>
      <tr><td>Pending Signed Agreement</td><td>Submitted leases missing a signed copy.</td></tr>
      <tr><td>Rent Invoices Details</td><td>Rent billing history &amp; outstanding.</td></tr>
      <tr><td>Debtors Report</td><td>Aged receivables for tenants.</td></tr>
      <tr><td>Security Deposit</td><td>Per-lease deposit balances &amp; status.</td></tr>
    </tbody>
  </table>

</div>`;
};

propms.show_help_modal = function () {
	if (propms._help_dialog) {
		propms._help_dialog.show();
		return;
	}

	const d = new frappe.ui.Dialog({
		title: __("Property Management Solution — How It Works"),
		fields: [
			{
				fieldtype: "HTML",
				fieldname: "help_body",
				options: propms.help_content(),
			},
		],
	});

	// Widen for comfortable reading.
	d.$wrapper.find(".modal-dialog").css("max-width", "1040px");
	propms._help_dialog = d;
	d.show();
};

// Intercept the workspace button / shortcut and open the native modal instead
// of navigating to the standalone page.
$(document).on(
	"click",
	'a[href="/propms-help"], a[href$="/propms-help"], .propms-how-it-works',
	function (e) {
		e.preventDefault();
		e.stopPropagation();
		propms.show_help_modal();
		return false;
	}
);
