#!/usr/bin/env python

from __future__ import division, print_function
import pandas as pd
import argparse
import os.path
import numpy as np


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
    df = df.rename(index=str, columns={'Parcel ID': 'parcelid', 'Image 1': 'image1',
                                       'Image 2': 'image2'})
    return df[['parcelid', 'image1', 'image2']]


def write_data(df):
    '''Save data to a CSV file'''
    df.to_csv('parcels_image_urls.csv')


def load_xlsx_and_output_data():
    '''
    Main routine for loading the Excel file
    and storing the parcels and images to a new file
    '''

    args = parse_args()
    df = read_data(args.filename)
    write_data(df)


if __name__ == "__main__":
    load_xlsx_and_output_data()
