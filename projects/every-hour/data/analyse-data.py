import json, datetime, os, csv, re, math
from datetime import datetime, timedelta
import numpy as np
import pandas as pd


# Input:
# ==============================================================================
# Requires input files in current directory:
#     * data.txt
#     * categories-info.txt
#     * activities-info.txt
# Note: for privacy reasons, I have not added all these files to GitHub
#
# Output:
# ==============================================================================
# Run to take the activity data from data.txt and:
#     * group activities into categories using the mapping in activities-info.txt
#     * count the occurrence of each category in each day
#     * for various levels of smoothness:
#         * smooth
#         * normalise each day to sum to 1
#         * apply cumulative sum (in reverse)
#     * output js module ../js/importData.js with object containing
#         * categoryLabels
#         * categoryColours
#         * data
#         * nDays
#         * startDate
#
# categories-info.txt:
# ==============================================================================
# List of categories in csv form, with columns
#     name: category name
#     colour: colours of each category, in hex format
#
# activities-info.txt:
# ==============================================================================
# List of activities in csv form, with columns
#     id: unique identifier
#     activity: name
#     cat: id (row number) of containing category
#
# data.txt:
# ==============================================================================
# The rows of the data correspond to days (starting at the start date),
#     and columns correspond to hours (starting at the hour from midnight
#     to 01:00) in the local timezone.
# For a given hour of a given day, the value in the table consists of
#     zero or more activities (denoted by unique identifiers)
#     corresponding to that hour.
# "_" is for hours with 0 activities (due to moving through time zones etc.)
# "+" is used to join activities for hours with multiple activities
#     (due to moving through time zones etc.)

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
