"""Create leasing master data on existing sites.

`after_install` only runs on a fresh install, so sites that already have propms
won't get the "Lease Items" Item Group / default "Rent" Item. This patch runs
the same idempotent setup on migrate.
"""

from propms.install import setup_lease_defaults


def execute():
    setup_lease_defaults()
