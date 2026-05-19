import frappe


def get_context(context):
    context.no_cache = 1
    context.show_sidebar = False
    context.title = "Property Management Solution — How It Works"
    context.app_version = frappe.get_attr("propms.__version__")
    return context
