import dbm
import csv
import json
from datetime import datetime
import pandas as pd


def is_eligible(row):
    return (row['eligible'] != 'Sold' and row['paymentplan'] == 'False' and
            row['paymentwindow'] == 'False' and row['lastyear'] < '2016' and
            row['class'] != 'E')


def is_new(parcel_id, old_rows):
    for old_row in old_rows:
        old_id = old_row.get('parcelid', '').replace(' ', '')
        if old_id == parcel_id:
            return False
    return True


df_urls = pd.read_csv('parcels_image_urls.csv').fillna('')
applied = []
with open('parcels.csv') as csvfile:
    reader = csv.DictReader(csvfile, ['parcel', 'addl', 'address'])
    for row in reader:
        applied.append(row['parcel'].replace(" ", ""))
        if len(row['addl']) > 0:
            addl = row['addl'].replace("*", "").split(',')
            nospace_parcel = row['parcel'].replace(" ", "")
            for record in addl:
                record = record.strip()
                val = nospace_parcel[:len(nospace_parcel) - len(record)] + record
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
                # latlon = db[row['parcel']].split()
                nospace_parcel = row['parcel'].replace(" ", "")
                latlon = db[nospace_parcel].split()
                claimed = False
                lot = False
                if nospace_parcel in applied:
                    claimed = True
                if row['buildingvalue'] == '000000000000.00':
                    lot = True
                new_record = is_new(nospace_parcel, old_records)
                if new_record:
                    count = count + 1
                    print('New record (' + str(count) + '): ' + row['parcel'])
                matched_row = df_urls[df_urls.parcelid == row['parcel']]
                if matched_row.shape[0] < 1:
                    image1 = ''
                    image2 = ''
                    print('No images found for', row['parcel'])
                else:
                    image1 = matched_row.iloc[0]['image1']
                    image2 = matched_row.iloc[0]['image2']
                if matched_row.shape[0] > 1:
                    print(matched_row.shape[0], 'matching rows found for',
                          row['parcel'] + '. Pulling data for first matching row only.')
                values.append({'parcelid': row['parcel'],
                               'street': row['street'],
                               'lat': latlon[0].decode("utf-8"),
                               'lon': latlon[1].decode("utf-8"),
                               'claimed': claimed,
                               'lot': lot,
                               'new': new_record,
                               'image1': image1,
                               'image2': image2})
            except Exception as e:
                # if not, log it in a separate json file for analysis/reporting
                print("ERROR", row['parcel'], e)
    file.write('var lastupdated = new Date("' +
               datetime.now().strftime("%B %d, %Y %H:%M:%S") + '");\n')
    file.write('var points =')
    file.write(json.dumps(values, indent=2))
    file.write(';')
    file.close()
    json_file.close()
