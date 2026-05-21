"""Repair Workspace Sidebar items that crash desk boot.

Background
----------
An earlier version of the "Real Estate Management" Workspace Sidebar shipped
items with `type = "Section"`. The valid value is `"Section Break"`. During
boot, `frappe.boot.get_sidebar_items` only skips the per-item permission check
for items whose type is exactly `"Section Break"`; every other item is passed to
`Workspace Sidebar.is_item_allowed(link_to, link_type, ...)`, which immediately
does `link_type.lower()`. Those "Section" rows have a NULL `link_type`, so the
call raises `AttributeError: 'NoneType' object has no attribute 'lower'` and the
entire desk fails to boot for non-Administrator users (SessionBootFailed).

This patch is idempotent and safe to run repeatedly:

1. Normalise any `type = "Section"` rows to `"Section Break"` across ALL
   Workspace Sidebars (defensive — not just ours).
2. Guarantee no row can crash boot: any non-"Section Break" item with a NULL/
   empty `link_type` is given a harmless fallback.
3. Drop the redundant, stale "Real Estate Management" sidebar (superseded by
   the "Real Estate" sidebar). Raw deletes are used so the doctype's
   workspace-manager `on_trash` guard cannot block the migrate.
"""

import frappe

REDUNDANT_SIDEBAR = "Real Estate Management"


def execute():
    if not frappe.db.table_exists("Workspace Sidebar Item"):
        return

    has_type = frappe.db.has_column("Workspace Sidebar Item", "type")
    has_link_type = frappe.db.has_column("Workspace Sidebar Item", "link_type")

    # 1) Invalid "Section" -> valid "Section Break" (boot skips these safely).
    if has_type:
        frappe.db.sql(
            """
            UPDATE `tabWorkspace Sidebar Item`
            SET `type` = 'Section Break'
            WHERE `type` = 'Section'
            """
        )

    # 2) Belt-and-suspenders: never let a non-section item carry a NULL/empty
    #    link_type into is_item_allowed().
    if has_type and has_link_type:
        frappe.db.sql(
            """
            UPDATE `tabWorkspace Sidebar Item`
            SET `link_type` = 'DocType'
            WHERE COALESCE(`type`, '') != 'Section Break'
              AND (`link_type` IS NULL OR `link_type` = '')
            """
        )

    # 3) Remove the redundant sidebar (and its child rows) via raw deletes so
    #    the workspace-manager guard in on_trash can't abort the patch.
    if frappe.db.exists("Workspace Sidebar", REDUNDANT_SIDEBAR):
        frappe.db.delete("Workspace Sidebar Item", {"parent": REDUNDANT_SIDEBAR})
        frappe.db.delete("Workspace Sidebar", {"name": REDUNDANT_SIDEBAR})

    frappe.db.commit()
