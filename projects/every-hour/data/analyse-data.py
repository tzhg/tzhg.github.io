#!/bin/bash

# Input:
#     ./data.xlsx

# Output:
#     ../js/importData.js

# Takes activity data from data.xlsx, counts the occurrence of each category
# in each day, smooths counts, normalises counts to sum to 1, applies reverse
# cumulative summation and outputs a subset of the resulting data to the
# JavaScript module ../js/importData.js with an object containing:
#     - categoryLabels,
#     - categoryColours,
#     - data,
#     - nDays,
#     - startDate.

import json, os, math, random
import numpy as np
import pandas as pd
from openpyxl import load_workbook

random.seed()

date_format = "%Y-%m-%d"

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))


def process_data(data):
    # Returns subset of days (grouped by year) to simplify the visualisation.
    # For each year, the subset ranges from the first day of the year,
    # to the first day of the next year inclusive (apart from the last year).
    # This ensures there will be no gaps when the years are graphed side by side.
    def idx_subset(given_days):
        # Number of days to choose in each full year
        n = 500

        year = start_year
        start_day = 0
        days_remaining = given_days
        idx_list = []
        while days_remaining >= 0:
            year_len = 365
            # Checks if leap year
            if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
                year_len += 1

            end_day = min(start_day + year_len, given_days)

            norm_days = math.floor(min(days_remaining / year_len, 1) * n)

            norm_days_idx = np.linspace(start_day, min(end_day, given_days - 1), num=norm_days)
            norm_days_idx = np.round(norm_days_idx)

            idx_list.append(norm_days_idx.astype(int))

            start_day = end_day
            year += 1
            days_remaining -= year_len

        return idx_list
    

    # The script smooths using a moving average of length a, so day_i = average{ day i to day i+a }
    # It results in a truncation of a-1 days from the end
    a = 7
    n = len(hours) - (a - 1)
    
    # Smooths array of hours (for each category independently)
    Y_smooth = np.array([
        np.dot(
            np.fromfunction(lambda i, j: np.concatenate((hours_seq, [0] * (a - 1)), axis=0)[i + j], (len(hours_seq), a), dtype=int),
            np.array([1] * a) / a
        )[0:-(a - 1)]
        for hours_seq in np.transpose(hours)])

    # Ensures values >= 0
    Y_smooth = Y_smooth.clip(min=0)

    # Converts count to proportion
    Y_smooth = Y_smooth / Y_smooth.sum(axis=0)

    # Cumulative sum
    Y_smooth = np.cumsum(Y_smooth, axis=0)[:-1, :]

    # Subset of days
    idx_list = idx_subset(n)

    return [Y_smooth[:, l].tolist() for l in idx_list]

# Loads input file

workbook = load_workbook(os.path.join(dirname, "data.xlsx"))

wb_cats = workbook["Categories"].values
df_cats = pd.DataFrame(wb_cats, columns=next(wb_cats))
df_cats["ID"] = df_cats["ID"].astype("string")

no_cats = len(df_cats)
cat_ids = df_cats["ID"].tolist()
cat_pos = { row["ID"]: row["Position"] for _, row in df_cats.iterrows() }

hours = []

last_row = len(list(workbook["Input"].values)) - 1

for i, row in enumerate(workbook["Input"].values):
    end = False

    if i == 0:
        continue

    if i == last_row:
        end = True

    counts = [0] * no_cats

    row = list(row[:24])

    # Checks for 24 values
    for value in row:
        if value == None:
            if last_row:
                end = True
            else:
                raise ValueError(f"input/data.xlsx: missing value in row {i}")
            
    row = "".join([str(value) for value in row])

    if end:
        break

    for value in row:
        if value == "Z":
            pass
        elif value in cat_ids:
            counts[cat_pos[value]] += 1
        else:
            raise ValueError(f"input/data.xlsx: '{value}' invalid value in row {i}")
        
    counts[cat_pos["T"]] += counts[cat_pos["X"]] 

    del counts[cat_pos["X"]]  
        
    hours.append(counts)

start_year = workbook["Dates"]["b1"].value.year

# Data as an object
data_obj = {
    "startYear": start_year,
    "categoryInfo": df_cats[df_cats["ID"] != "X"].sort_values(["Position"])[["Category", "Colour"]].values.tolist(),
    "data": process_data(hours)}

# Data as a JSON string
data_json = json.dumps(data_obj, indent=4)

# Wraps JSON string in JavaScript module syntax, and saves it to ../js
with open(os.path.join(dirname, "../js/importData-2.js"), "w") as file:
    file.write(f"export function importData() {{\n	return {data_json};\n}}")
