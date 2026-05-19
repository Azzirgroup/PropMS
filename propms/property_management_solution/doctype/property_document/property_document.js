// Copyright (c) 2026, Aakvatech and contributors
// For license information, please see license.txt

frappe.ui.form.on("Property Document", {
    refresh: function(frm) {
        if (!frm.is_new() && frm.doc.expiry_date) {
            const today = frappe.datetime.get_today();
            const days_to_expiry = frappe.datetime.get_day_diff(frm.doc.expiry_date, today);
            if (days_to_expiry < 0) {
                frm.dashboard.set_headline_alert(
                    `<div class="indicator red">Expired ${Math.abs(days_to_expiry)} day(s) ago</div>`
                );
            } else if (days_to_expiry <= (frm.doc.renewal_reminder_days || 30)) {
                frm.dashboard.set_headline_alert(
                    `<div class="indicator orange">Expires in ${days_to_expiry} day(s)</div>`
                );
            }
        }
    }
});
