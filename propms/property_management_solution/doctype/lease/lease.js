// Copyright (c) 2018, Aakvatech and contributors
// For license information, please see license.txt

// The leased entity is the Property Unit; the owner is fetched from it.
cur_frm.add_fetch('property_unit', 'unit_owner', 'property_owner');

frappe.ui.form.on('Lease', {
	setup: function (frm) {
		frm.set_query("lease_item", "lease_item", function () {
			return {
				"filters": [
					["item_group", "=", "Lease Items"],
				]
			};
		});
		// Only offer units that belong to the selected company (when set).
		frm.set_query("property_unit", function () {
			const filters = {};
			if (frm.doc.company) {
				filters.company = frm.doc.company;
			}
			return { filters };
		});
	},
	refresh: function (frm) {
		// Per-lease action: only meaningful once the lease exists.
		if (!frm.is_new()) {
			frm.add_custom_button(__("Make Invoice Schedule"), function () {
				make_lease_invoice_schedule(frm);
			});
		}

		// Admin / bulk operations grouped under a Tools menu so they don't
		// look like per-lease actions.
		frm.add_custom_button(__("Generate Due Invoices (All Leases)"), function () {
			generate_pending_invoice(frm);
		}, __("Tools"));
		frm.add_custom_button(__("Rebuild Schedule for All Leases"), function () {
			getAllLease(frm);
		}, __("Tools"));
		frm.add_custom_button(__("Fetch Meters from Property"), function () {
			fetch_property_meters(frm, frm.doc.property, true);
		}, __("Tools"));
	},
	property_unit: function (frm) {
		if (!frm.doc.property_unit) {
			return;
		}

		// Seed the lease from the unit: a Rent lease item + security deposit.
		frappe.call({
			method: "propms.property_management_solution.doctype.lease.lease.get_unit_lease_defaults",
			args: { property_unit: frm.doc.property_unit },
			callback: function (r) {
				const d = r.message || {};
				if (d.security_deposit && !frm.doc.security_deposit) {
					frm.set_value("security_deposit", d.security_deposit);
				}
				// Only auto-add the rent line when no lease items exist yet.
				if (d.rent_item && !(frm.doc.lease_item || []).length) {
					const row = frm.add_child("lease_item");
					row.lease_item = d.rent_item;
					row.frequency = "Monthly";
					row.amount = d.rent || 0;
					row.document_type = "Sales Invoice";
					if (d.currency) {
						row.currency_code = d.currency;
					}
					if (frm.doc.customer) {
						row.paid_by = frm.doc.customer;
					}
					frm.refresh_field("lease_item");
				}
			}
		});

		// Auto-pull the building's active meters as opening-reading rows,
		// but only when the table is empty (don't clobber manual edits).
		if (!(frm.doc.meter_readings || []).length) {
			frappe.db.get_value("Property Unit", frm.doc.property_unit, "property")
				.then(function (r) {
					const property = r.message && r.message.property;
					if (property) {
						fetch_property_meters(frm, property, false);
					}
				});
		}
	},
	onload: function (frm) {
		frappe.realtime.on("lease_invoice_schedule_progress", function (data) {
			if (data.reload && data.reload === 1) {
				frm.reload_doc();
			}
			if (data.progress) {
				let progress_bar = $(cur_frm.dashboard.progress_area).find(".progress-bar");
				if (progress_bar) {
					$(progress_bar).removeClass("progress-bar-danger").addClass("progress-bar-success progress-bar-striped");
					$(progress_bar).css("width", data.progress + "%");
				}
			}
		});
	}
});

var make_lease_invoice_schedule = function (frm) {
	frappe.call({
		method: "propms.property_management_solution.doctype.lease.lease.make_lease_invoice_schedule",
		args: { leasedoc: frm.doc.name },
		freeze: true,
		freeze_message: __("Building invoice schedule…"),
		callback: function () {
			frm.reload_doc();
		}
	});
};

var generate_pending_invoice = function (frm) {
	frappe.call({
		method: "propms.lease_invoice.leaseInvoiceAutoCreate",
		args: {},
		freeze: true,
		freeze_message: __("Generating due invoices…"),
		callback: function () {
			if (frm && !frm.is_new()) {
				frm.reload_doc();
			}
		}
	});
};

var getAllLease = function (frm) {
	frappe.confirm(
		__("This rebuilds the invoice schedule for every lease and can take a while. Continue?"),
		function () {
			frappe.call({
				method: "propms.property_management_solution.doctype.lease.lease.getAllLease",
				args: {},
				freeze: true,
				freeze_message: __("Queued. This runs in the background…"),
				callback: function () {
					if (frm && !frm.is_new()) {
						frm.reload_doc();
					}
				}
			});
		}
	);
};

var fetch_property_meters = function (frm, property, replace) {
	if (!property) {
		frappe.msgprint(__("Select a Property Unit first so its building is known."));
		return;
	}
	frappe.call({
		method: "propms.property_management_solution.doctype.lease.lease.get_property_meters",
		args: { property: property },
		callback: function (r) {
			const meters = r.message || [];
			if (!meters.length) {
				if (replace) {
					frappe.msgprint(__("No active meters registered on {0}.", [property]));
				}
				return;
			}
			if (replace) {
				frm.clear_table("meter_readings");
			}
			meters.forEach(function (m) {
				const row = frm.add_child("meter_readings");
				row.meter = m.meter_number;
				row.meter_type = m.meter_type;
				row.opening_reading = m.initial_meter_reading || 0;
				row.opening_date = frm.doc.start_date;
			});
			frm.refresh_field("meter_readings");
		}
	});
};

var compute_meter_units = function (frm, cdt, cdn) {
	const row = locals[cdt][cdn];
	const consumed = flt(row.closing_reading) - flt(row.opening_reading);
	frappe.model.set_value(cdt, cdn, "units_consumed", consumed > 0 ? consumed : 0);
};

frappe.ui.form.on('Lease Meter Reading', {
	opening_reading: compute_meter_units,
	closing_reading: compute_meter_units,
});

frappe.ui.form.on('Lease Invoice Schedule', {
	create_voucher: function (frm, cdt, cdn) {
		// check if document is saved
		if (frm.is_dirty()) {
			frappe.msgprint("Please save the document first");
			return;
		}
		const row = locals[cdt][cdn];
		if (row.invoice_number || row.sales_order_number) {
			frappe.msgprint("Voucher already created");
			return;
		}
		frappe.call({
			method: "propms.lease_invoice.create_lease_voucher",
			args: {
				invoice_schedule: row,
			},
			callback: function (r) {
				// reload the doc
				frm.reload_doc();
				// refresh child table
				frm.refresh_field("lease_invoice_schedule");
			}
		});

	}
});