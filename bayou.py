import requests
from requests.auth import HTTPBasicAuth
import json
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

customers = [    
    2214, #Michael Scott
    2332, #James Gordey PSE Gas heating, no AC, gas stove, gas hot water heater
    2314, #dhanur, 350 Madrid St, San Francisco, CA 94112
    2301, #James Gordey SCL
    2287, #Mike Cozart
    2276, #Matt Forni
          # Nathan Eidelson 3905 Cesar Chavez St, San Francisco, CA 94131
]

token = 'test_175_0c11cfd27240e5bb16e56bd0200013696e3fdeac70db824947a38190df630dc2'

def get_intervals_data(customer_id):
    url = f"https://staging.bayou.energy/api/v2/customers/{customer_id}/intervals"
    resp = requests.get(url, auth=HTTPBasicAuth(token, ''))
    data = resp.json()

    return data




def get_dhanur_intervals():
    data = get_intervals_data(2314)
    intervals = data['meters'][0]['intervals']
    with open('dhanur_data.json', 'w+') as f:
        json.dump(intervals, f)
