import dbm
import csv
import json
from datetime import datetime

applied = []
with open('parcels.csv') as csvfile:
  reader = csv.DictReader(csvfile, ['parcel', 'addl', 'address'])
  for row in reader:
    applied.append(row['parcel'])
    if len(row['addl']) > 0:
      addl = row['addl'].split(',')
      for record in addl:
        record = record.strip()
        value = row['parcel'][:len(row['parcel']) - len(record)] + record
        applied.append(value)

db = dbm.open('./centroids.dbm', 'r')
#open output json file
file = open('georeaps.json', 'w')
values = []
with open('reapitems.csv') as csvfile:
    reader = csv.DictReader(csvfile, ['parcel', 'street', 'eligible', 'paymentplan', 'lastyear', 'paymentwindow', 'class', 'buildingvalue'])
    for row in reader:
        #if the record should be included, include it
        if row['eligible'] != 'Sold' and row['paymentplan'] == 'False' and row['paymentwindow'] == 'False' and row['lastyear'] < '2013' and row['class'] != 'E':
            try:
                latlon = db[row['parcel']].split()
                claimed = False
                lot = False
                if row['parcel'] in applied:
                    claimed = True
                if row['buildingvalue'] == '000000000000.00':
                    lot = True
                values.append({'parcelid': row['parcel'], 'street': row['street'], 'lat': latlon[0], 'lon': latlon[1], 'claimed': claimed, 'lot': lot})
            except:
                #if not, log it in a separate json file for analysis/reporting
                print row['parcel']
    file.write('var lastupdated = new Date("' + datetime.now().strftime("%B %d, %Y %H:%M:%S") + '");\n')
    file.write('var points =')
    file.write(json.dumps(values, indent=2))
    file.write(';')
    file.close()
