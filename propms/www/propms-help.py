import frappe


def get_context(context):
    context.no_cache = 1
    context.show_sidebar = False
    context.title = "Property Management Solution — How It Works"
    context.app_version = frappe.get_attr("propms.__version__")
    # When embedded in the in-app dialog (?modal=1) we hide the website
    # navbar/footer so only the guide body shows.
    context.is_modal = frappe.form_dict.get("modal") == "1"
    return context
