# -*- coding: utf-8 -*-
# Copyright (c) 2018, Aakvatech and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe.model.document import Document

from propms.install import LEASE_ITEM_GROUP, create_lease_item_group


class PropertyUnit(Document):
    def on_update(self):
        # Each unit owns a Rent item, created the first time it is saved.
        if not self.rent_item:
            self.ensure_rent_item()

    def ensure_rent_item(self):
        """Create a per-unit Rent service Item (in the Lease Items group) and
        link it back to the unit. Idempotent and self-healing."""
        try:
            create_lease_item_group()
            item_code = "RENT-{0}".format(self.name)
            if not frappe.db.exists("Item", item_code):
                uom = "Nos" if frappe.db.exists("UOM", "Nos") else None
                frappe.get_doc(
                    {
                        "doctype": "Item",
                        "item_code": item_code,
                        "item_name": "Rent - {0}".format(self.unit_number or self.name),
                        "item_group": LEASE_ITEM_GROUP,
                        "stock_uom": uom,
                        "is_stock_item": 0,
                        "is_sales_item": 1,
                        "is_purchase_item": 0,
                        "description": "Rent charge for unit {0}".format(self.name),
                    }
                ).insert(ignore_permissions=True)
            self.db_set("rent_item", item_code)
        except Exception:
            frappe.log_error(
                title="Property Unit rent item creation failed",
                message=frappe.get_traceback(),
            )
