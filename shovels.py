import requests
import time
import pprint

## BAYOU ###
####################################################################################
####################################################################################
####################################################################################
# Bayou has two environments, staging, as shown below, and production, bayou_domain="bayou.energy"
bayou_domain = "staging.bayou.energy"
# Get and manage API keys at f"https://{bayou_domain}/dashboard/keys"
# API reference: https://docs.bayou.energy/v2.0/reference/authentication 
bayou_api_key = "test_179_74ffca450b3e00baffd5eb9c0fefbbcb0e4b7d59ec15b233ce73336349f40d09"

# Create a new customer. API reference: https://docs.bayou.energy/v2.0/reference/post_customers
# customer = requests.post(f"https://{bayou_domain}/api/v2/customers", json={
# 	"utility": "speculoos_power", # Speculoos is Bayou's fake utility for testing, https://docs.bayou.energy/v2.0/reference/utility-support
# 	"email" : "QuickStart@bayou.energy" # Email address isn't a required field, https://docs.bayou.energy/docs/merge-customer-code-with-your-project
# }, auth=(bayou_api_key, '')).json()

# bills = requests.get(f"https://{bayou_domain}/api/v2/customers/2220/bills", auth=(bayou_api_key, '')).json()

####################################################################################
####################################################################################
####################################################################################


shovels_api_key = 'Tl3ne3RfvndDP2rQ09r0qRuUgX6PkgT7xP7vhk8-JIc'


green_tags = [
    # "accessory_structure",
    "air_source_heat_pump",
    # "bath_remodel",
    # "commercial",
    # "demolition",
    "efficiency",
    "electrical_panel_upgrade",
    "electrical_service_upgrade",
    "ev_charger",
    # "exterior_remodel",
    # "foundation",
    "ground_source_heat_pump",
    "heat_pump",
    "heat_pump_water_heater",
    "hvac",
    "induction_stove",
    # "kitchen_remodel",
    # "multifamily",
    # "new_adu",
    # "new_dwelling",
    # "pool_spa",
    # "public_work",
    # "reroof",
    # "residential",
    # "room_addition",
    # "sitework",
    "solar",
    "solar_battery_storage",
    # "tenant_improvement",
    "utilities",
    # "water_heater",
    "wind",
    # "window_door",
]

# tags = ['air_source_heat_pump']
tags = []

def get_permits_by_zip(zip_code, tags=None):
    start_date = '2022-01-01'
    end_date = '2023-07-01'

    items = []

    page = 1
    while page is not None:
        print('requesting pagezz', page)
        params = {
            'page': page,
            'start_date': start_date,
            # 'end_date': end_date,
            'zip_code': zip_code,
        }
        if tags:
            params['tags'] = tags

        response = requests.get(
            'https://api.shovels.ai/v1/permits/zip',
            headers={'X-API-KEY': shovels_api_key},
            params=params,
        )

        data = response.json()
        items.extend(data.get('items', []))
        next_page = data['next_page']
        page = next_page


    return items


def get_permit_by_id(permit_id):
    response = requests.get(
        f'https://api.shovels.ai/v1/permits/{permit_id}',
        headers={'X-API-KEY': shovels_api_key},
    )

    data = response.json()
    pprint.pprint(data)
    return data

def get_permits_by_address(street_no, street, city, state, zip_code):
    response = requests.get(
        f'https://api.shovels.ai/v1/permits/address',
        headers={'X-API-KEY': shovels_api_key},
        params={
            'street_no': street_no,
            'street': street,
            'city': city,
            'state': state,
            'zip_code': zip_code,
        },
    )

    data = response.json()
    items = data['items']
    permits = []
    for item in items:
        permit = get_permit_by_id(item)
        permits.append(permit)

    return permits

# Contractors who do the most work in your zip code
# Contractors who do it in the shortest time
# Your neighbors who have solar panels
# "Green" contractors in your zip code

def get_contractors(zip_code, tags=None):
    start_date = '2022-01-01'
    end_date = '2023-07-01'

    items = []

    page = 1
    while page is not None:
        print('requesting pagezz', page)
        params = {
            'page': page,
            'start_date': start_date,
            # 'end_date': end_date,
            'zip_code': zip_code,
        }
        if tags:
            params['tags'] = tags

        response = requests.get(
            f'https://api.shovels.ai/v1/contractors/activity/zip',
            headers={'X-API-KEY': shovels_api_key},
            params=params,
        )

        data = response.json()
        items.extend(data.get('items', []))
        next_page = data['next_page']
        page = next_page

    return items

def get_green_contractors(zip_code):
    by_tag = {}

    for tag in green_tags:
        items = get_contractors(zip_code, tags=[tag])
        if items:
            by_tag[tag] = items

    return by_tag
