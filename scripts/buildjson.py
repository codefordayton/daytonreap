import dbm
import csv
import json
from datetime import datetime


def is_eligible(row):
    return (row['eligible'] != 'Sold' and row['paymentplan'] == 'False' and
            row['paymentwindow'] == 'False' and row['lastyear'] < '2014' and
            row['class'] != 'E')


def is_new(row, old_rows):
    for old_row in old_rows:
        if old_row.get('parcelid', None) == row['parcel']:
            return False
    return True


applied = []
with open('parcels.csv') as csvfile:
    reader = csv.DictReader(csvfile, ['parcel', 'addl', 'address'])
    for row in reader:
        applied.append(row['parcel'])
        if len(row['addl']) > 0:
            addl = row['addl'].split(',')
            for record in addl:
                record = record.strip()
                val = row['parcel'][:len(row['parcel']) - len(record)] + record
                applied.append(val)

# open the old row file, if present
json_file = open('oldrows.json')
json_data = json_file.read()
old_records = json.loads(json_data)

db = dbm.open('./centroids.dbm', 'r')
# open output json file
file = open('georeaps.json', 'w')
values = []
with open('reapitems.csv') as csvfile:
    reader = csv.DictReader(csvfile, ['parcel', 'street', 'eligible',
                                      'paymentplan', 'lastyear',
                                      'paymentwindow', 'class',
                                      'buildingvalue'])
    count = 0
    for row in reader:
        # if the record should be included, include it
        if is_eligible(row):
            try:
                latlon = db[row['parcel']].split()
                claimed = False
                lot = False
                if row['parcel'] in applied:
                    claimed = True
                if row['buildingvalue'] == '000000000000.00':
                    lot = True
                new_record = is_new(row, old_records)
                if new_record:
                    count = count + 1
                    print('New record (' + str(count) + '): ' + row['parcel'])
                values.append({'parcelid': row['parcel'],
                               'street': row['street'],
                               'lat': latlon[0],
                               'lon': latlon[1],
                               'claimed': claimed,
                               'lot': lot,
                               'new': new_record})
            except Exception as e:
                # if not, log it in a separate json file for analysis/reporting
                print(row['parcel'], e)
    file.write('var lastupdated = new Date("' +
               datetime.now().strftime("%B %d, %Y %H:%M:%S") + '");\n')
    file.write('var points =')
    file.write(json.dumps(values, indent=2))
    file.write(';')
    file.close()
    json_file.close()
