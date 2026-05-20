// Opens the "How It Works" guide (/propms-help) inside a Frappe dialog
// instead of navigating away / opening a new browser tab.
//
// Any anchor pointing at /propms-help on a desk page is intercepted —
// this covers both the workspace header button and the URL shortcut.

frappe.provide("propms");

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
				options: `<iframe
					src="/propms-help?modal=1"
					title="How It Works"
					style="width:100%;height:74vh;border:0;border-radius:6px;background:#fff;"
					loading="lazy"></iframe>`,
			},
		],
		primary_action_label: __("Open in Full Page"),
		primary_action: function () {
			window.open("/propms-help", "_blank");
		},
	});

	// Widen the dialog for comfortable reading.
	d.$wrapper.find(".modal-dialog").css("max-width", "1040px");
	propms._help_dialog = d;
	d.show();
};

$(document).on("click", 'a[href="/propms-help"], a[href$="/propms-help"]', function (e) {
	e.preventDefault();
	e.stopPropagation();
	propms.show_help_modal();
	return false;
});
