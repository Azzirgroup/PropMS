# -*- coding: utf-8 -*-
# Copyright (c) 2026, Aakvatech and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_days, getdate, today


class PropertyDocument(Document):
    def validate(self):
        self.update_status()

    def update_status(self):
        if self.status in ("Renewed", "Superseded", "Archived"):
            return
        if not self.expiry_date:
            return
        expiry = getdate(self.expiry_date)
        today_date = getdate(today())
        reminder_days = int(self.renewal_reminder_days or 0)
        if expiry < today_date:
            self.status = "Expired"
        elif reminder_days and expiry <= add_days(today_date, reminder_days):
            self.status = "Expiring Soon"
        else:
            self.status = "Active"


def mark_expiring_documents():
    """Daily scheduler: refresh status on Property Document records nearing/past expiry."""
    docs = frappe.get_all(
        "Property Document",
        filters={
            "status": ["in", ["Active", "Expiring Soon"]],
            "expiry_date": ["is", "set"],
        },
        fields=["name"],
    )
    for d in docs:
        try:
            doc = frappe.get_doc("Property Document", d.name)
            previous = doc.status
            doc.update_status()
            if doc.status != previous:
                doc.db_set("status", doc.status, update_modified=False)
        except Exception:
            frappe.log_error(
                title="Property Document status refresh failed",
                message=frappe.get_traceback(),
            )
