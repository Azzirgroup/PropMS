# -*- coding: utf-8 -*-
# Copyright (c) 2026, Aakvatech and contributors
# For license information, please see license.txt

import frappe

LEASE_ITEM_GROUP = "Lease Items"


def after_install():
    setup_lease_defaults()


def setup_lease_defaults():
    """Create the leasing master data the app relies on.

    Only the "Lease Items" Item Group is needed globally — the Lease form
    filters lease items to it, and each Property Unit creates its own Rent
    item (in this group) on save. Idempotent: safe on install and via patch.
    """
    create_lease_item_group()
    frappe.db.commit()


def create_lease_item_group():
    if frappe.db.exists("Item Group", LEASE_ITEM_GROUP):
        return
    parent = (
        "All Item Groups"
        if frappe.db.exists("Item Group", "All Item Groups")
        else None
    )
    frappe.get_doc(
        {
            "doctype": "Item Group",
            "item_group_name": LEASE_ITEM_GROUP,
            "parent_item_group": parent,
            "is_group": 0,
        }
    ).insert(ignore_permissions=True)
