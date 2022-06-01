#!/bin/bash

# See read-me.txt for details

import json, datetime, os, csv, re, math
from datetime import datetime, timedelta
import numpy as np
import pandas as pd


date_format = "%Y-%m-%d"

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))


def process_data(data):
    # Smooths array with Gaussian filter
    def smooth(hours_seq):
        # a: full width at half maximum of filter
        a = 14

        sigma = a / 2.355

        # Truncates Gaussian filter at 3 sigma
        b = math.ceil(3 * sigma)
        trunc = np.array([-b, 1 + b])

        w = np.array([np.exp(-0.5 * x ** 2 / sigma ** 2) for x in range(*trunc)])
        w = w / sum(w)

        # Pads start and end so we don't have to truncate data
        pad_start = [hours_seq[0]] * b
        pad_end = [hours_seq[-1]] * b

        hours_seq_a = np.concatenate((pad_start, hours_seq, pad_end), axis=0)

        H = np.fromfunction(lambda i, j: hours_seq_a[i + j], (len(hours_seq), 2 * b + 1), dtype=int)

        return np.dot(H, w)


    # Returns subset of days (grouped by year) to simplify the visualisation.
    # For each year, the subset ranges from the first day of the year,
    # to the first day of the next year inclusive (apart from the last year).
    # This ensures there will be no gaps when the years are graphed side by side.
    def idx_subset(given_days):
        # Number of days to choose in each full year
        n = 300

        year = start_year
        start_day = 0
        days_remaining = given_days
        idx_list = []
        while days_remaining >= 0:
            # Checks if leap year
            if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
                year_len = 366
            else:
                year_len = 365

            end_day = min(start_day + year_len, given_days)

            norm_days = math.floor(min(days_remaining / year_len, 1) * n)

            norm_days_idx = np.linspace(start_day, min(end_day, given_days - 1), num=norm_days)
            norm_days_idx = np.round(norm_days_idx)

            idx_list.append(norm_days_idx.astype(int))

            start_day = end_day
            year += 1
            days_remaining -= year_len

        return idx_list


    # Matrix with number of hours of each category for each day
    hours = np.array([
        [len(re.compile(row).findall(line)) for _, row in categories_info_df["id"].iteritems()]
        for line in data])

    hours = hours * mangle_arr

    # Smooths array of hours (for each category independently)
    Y_smooth = np.array([
        smooth(hours_seq)
        for hours_seq in np.transpose(hours)])

    # Ensures values >= 0
    Y_smooth = Y_smooth.clip(min=0)

    # Converts count to proportion
    Y_smooth = Y_smooth / Y_smooth.sum(axis=0)

    # Cumulative sum
    Y_smooth = np.cumsum(Y_smooth, axis=0)[:-1, :]

    # Subset of days
    idx_list = idx_subset(len(hours))

    return [Y_smooth[:, l].tolist() for l in idx_list]


with open("data.txt", "r") as file:
    hour_data = [line for line in file]

with open("mangle.npy", "rb") as f:
    mangle_arr = np.load(f)

categories_info_df = pd.read_csv("categories-info.txt")

start_year = datetime.strptime(hour_data[0].strip("\n"), date_format).year
category_info = categories_info_df[["category", "colour"]].values.tolist()
data = process_data(hour_data[1:])

# Data as an object
data_obj = {
    "startYear": start_year,
    "categoryInfo": category_info,
    "data": data}

# Data as a JSON string
data_json = json.dumps(data_obj, indent=4)

# Wraps JSON string in JavaScript module syntax, and saves it to ../js
with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
    file.write(f"export function importData() {{\n	return {data_json};\n}}")
