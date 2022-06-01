#!/bin/bash

# See read-me.txt for details

from datetime import datetime, timedelta
import csv
import pandas as pd


input_date_format = "%d/%m/%Y"
output_date_format = "%Y-%m-%d"


# Separates input df into 2 dfs,
#     the first containing valid complete days
#     the second containing the remaining rows
def valid_days(df):
    # Get valid starting date (ending date of existing data in output)
    last_day = 0
    with open("data.txt", "r") as data_file:
        for i, line in enumerate(data_file):
            if i == 0:
                start_date = datetime.strptime(line.strip("\n"), output_date_format)
                continue
            last_day += 1
    end_date = start_date + timedelta(days=last_day)

    hour = 0
    day = 0
    for i, row in df.iterrows():
        date = datetime.strftime(end_date + timedelta(days=day), input_date_format)

        if row["date"] != date:
            print(f"Error: Date {row['date']} should equal {date} on row {2 + i}")
            break

        if int(row["hour"]) != hour:
            print(f"Error: Hour {row['hour']} should equal {hour} on row {2 + i}")
            break

        cat = categories_info_df.loc[categories_info_df["category"] == row["category"]]
        if cat.empty:
            print(f"Error: Activity not valid on row {2 + i}")
            break

        hour = (hour + 1) % 24
        if hour == 0:
            day += 1

    df1 = df.iloc[:24 * day, :]
    df2 = df.iloc[24 * day:, :]

    return [df1, df2]


df = pd.read_csv("data-input.txt")
categories_info_df = pd.read_csv("categories-info.txt")

df1, df2 = valid_days(df)

# Appends valid data to data.txt
if not df1.empty:
    # Converts date to YYYY-MM-DD format for easy sorting
    df1["date"] = df1["date"].apply(lambda x: datetime.strftime(datetime.strptime(x, input_date_format), "%Y-%m-%d"))

    day_df = pd.merge(df1, categories_info_df, on="category")
    day_df = day_df.sort_values(["hour", "date"])
    print(day_df)
    day_df = day_df.groupby("date").agg({"id": ",".join})["id"]

    for d in day_df.index.tolist():
        print(f"Appending {d}")
    day_df.to_csv("data.txt", index=False, mode="a", header=False, sep=";")

# Replaces data-input.txt with remaining data
df2.to_csv("data-input.txt", index=False)
