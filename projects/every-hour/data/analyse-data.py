#!/bin/bash

# See read-me.txt for details

import json, datetime, os, csv, re, math
from datetime import datetime, timedelta
import numpy as np
import pandas as pd


date_format = "%Y-%m-%d"

# This needs to be manually updated for new years (I will make it automatic)
years = 365 + np.array([0, 0, 0, 1, 0, 0])

# Range of days for each year
year_ranges = np.transpose(
    np.vstack((
        (np.insert(np.cumsum(years), 0, -1) + 1)[:-1],
        np.cumsum(years))))

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))


def process_data(data):
    categories_info_df["cat_id"] = categories_info_df.index
    act_cat_df = pd.merge(categories_info_df, activities_info_df, on="cat_id")
    act_cat_df = act_cat_df.groupby("cat_id").agg({"id": "|".join})["id"]

    # Matrix with number of hours on each activity for each day
    hours = np.array([
        [len(re.compile(row).findall(line)) for _, row in act_cat_df.iteritems()]
        for line in data])

    print(hours)

    data_string = "["

    def d(sigma, x, y):
        return np.exp(-0.5 * (x - y) ** 2 / sigma ** 2)

    # Smooths array Y with Gaussian filter
    def smooth(hours_seq, Y):
        # a: full width at half maximum of filter
        a = 14

        sigma = a / 2.355
        def f(i):
            x1 = max(math.ceil(i - 3 * sigma), 0)
            x2 = min(math.ceil(i + 1 + 3 * sigma), len(hours_seq))
            w = np.array([d(sigma, i, x) for x in range(x1, x2)])
            w = w / sum(w)
            return np.dot([hours_seq[x] for x in range(x1, x2)], w)
        return np.array([f(y) for y in Y])

    Y_all = []

    # Number of points to divide each year into
    num_pts = 300
    Y = np.linspace(0, sum(years) - 1, num=num_pts * len(years))

    Y_smooth = np.array([
        smooth(hours_seq, Y[Y < len(hours)])
        for hours_seq in np.transpose(hours)])

    for y in range(len(years)):
        yearIndices = (y + np.array([0, 1])) * num_pts

        Y_smooth_y = Y_smooth[:, yearIndices[0]:yearIndices[1]]

        Y_smooth_y = Y_smooth_y.clip(min=0)

        Y_smooth_y = Y_smooth_y / Y_smooth_y.sum(axis=0)

        Y_smooth_y = np.cumsum(Y_smooth_y, axis=0)[:-1,:]

        Y_all.append(Y_smooth_y.tolist())

    return Y_all


with open("data.txt", "r") as file:
    act_data = [line for line in file]

categories_info_df = pd.read_csv("categories-info.txt")
activities_info_df = pd.read_csv("activities-info.txt")

# Data as an object
data_obj = {
    "startYear": datetime.strptime(act_data[0].strip("\n"), date_format).year,
    "categoryInfo": categories_info_df.values.tolist(),
    "data": process_data(act_data[1:])
}

# Data as a JSON string
data_json = json.dumps(data_obj, indent=4)

# Wraps JSON string in JavaScript module syntax, and saves it to ../js
with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
    file.write(f"export function importData() {{\n	return {data_json};\n}}")
