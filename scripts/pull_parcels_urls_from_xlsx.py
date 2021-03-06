#!/usr/bin/env python

import pandas as pd
import argparse
import os.path


def parse_args():
    '''Command line argument parser'''
    parser = argparse.ArgumentParser()
    parser.add_argument('--filename', '-f',
                        help='name of input Excel file',
                        default='WRLC_Dayton_Survey_Final_Results_FOR_DISTRIBUTION_20151209.xlsx')
    args = parser.parse_args()
    if not os.path.isfile(args.filename):
        print('Error: file ', args.filename, 'was not found.')
        sys.exit()
    return args


def read_data(file):
    '''Read the Excel file'''
    df = pd.read_excel(file)
    df = df.dropna(subset=['Parcel ID', 'Image 1'])
    df = df.rename(index=str, columns={'Parcel ID': 'parcelid',
                                       'Image 1': 'image1',
                                       'Image 2': 'image2'})
    return df[['parcelid', 'image1', 'image2']]


def write_data(df):
    '''Save data to a CSV file'''
    df.to_csv('parcels_image_urls.csv', index=False)


def load_xlsx_and_output_data():
    '''
    Main routine for loading the Excel file
    and storing the parcels and images to a new file
    '''

    args = parse_args()
    df = read_data(args.filename)
    # Get rid of WR Land Conservancy urls, since they are no longer valid
    for name in ['image1', 'image2']:
        df.loc[df[name].str.contains('gis.wrlandconservancy.org', na=False), name] = ''
    write_data(df)


if __name__ == "__main__":
    load_xlsx_and_output_data()
