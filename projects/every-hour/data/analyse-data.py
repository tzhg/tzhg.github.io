import json, datetime, os, csv, re, math
import numpy as np
import pandas as pd


# Input:
# ==============================================================================
# Requires input files in current directory:
#     * data.txt
#     * start-date.txt
#     * category-info.txt
#     * category-info-mangled.txt (if mangling data)
# Note: for privacy reasons, I have not added these files to GitHub
#
# Output:
# ==============================================================================
# Run to take the activity data from data.txt and:
#     * group activities into categories using the mapping in category-info.txt
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
# category-info.txt:
# ==============================================================================
# List of categories in csv form, with columns
#     1. Category name
#     2. Unique identifiers of activities in each category, pipe-separated
#     3. Colours of each category, in hex format
#
# start-date.txt:
# ==============================================================================
# Start date of data in YYYY-MM-DD format
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

years = [365, 365, 365, 366, 365]

# Range of days for each year
year_ranges = np.transpose(
    np.vstack((
        (np.insert(np.cumsum(years), 0, -1) + 1)[:-1],
        np.cumsum(years))))

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))


# Returns regex list for mapping activites to categories
def process_categories_info():
    categories_info_df = pd.read_csv("categories-info.txt")

    cat_regex_list = [
        re.compile(pattern)
        for pattern in categories_info_df["Activities"]]

    cat_info_list = [
        [row["Name"], row["Colour"]]
        for _, row in categories_info_df.iterrows()]

    return (cat_info_list, cat_regex_list)


def process_data(cat_regex_list):
    with open("data.txt", "r") as file:
        # Matrix with number of hours on each activity for each day
        hours = np.array([
            [len(regex.findall(line)) for regex in cat_regex_list]
            for line in file])

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

    num_pts = 1000
    Y = np.linspace(0, sum(years) - 1, num=num_pts)

    Y_smooth = np.array([
        smooth(hours_seq, Y[Y < len(hours)])
        for hours_seq in np.transpose(hours)])

    for y in range(len(years)):
        yearIndices = [
            round(y * num_pts / len(years)),
            round((y + 1) * num_pts / len(years))]

        # This adds some overlap to the years
        yearIndices[1] = min(sum(years), yearIndices[1] + 2)
        Y_smooth_y = Y_smooth[:, yearIndices[0]:yearIndices[1]]

        Y_smooth_y = Y_smooth_y.clip(min=0)

        Y_smooth_y = Y_smooth_y / Y_smooth_y.sum(axis=0)

        Y_smooth_y = np.cumsum(Y_smooth_y, axis=0)[:-1,:]

        Y_all.append(Y_smooth_y.tolist())

    return Y_all


cat_info_list, cat_regex_list = process_categories_info()

with open("start-year.txt", "r") as file:
    start_year = int(file.read())

data = process_data(cat_regex_list)

# Data as an object
data_obj = {
    "startYear": start_year,
    "categoryInfo": cat_info_list,
    "data": data
}

# Data as a JSON string
data_json = json.dumps(data_obj, indent=4)

# Wraps JSON string in JavaScript module syntax, and saves it to ../js
with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
    file.write(f"export function importData() {{\n	return {data_json};\n}}")
