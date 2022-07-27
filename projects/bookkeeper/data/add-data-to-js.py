import json, os
import pandas as pd

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))

input_date_format = "%d/%m/%Y"

books_df = pd.read_csv("data.csv", sep=",")
classes_df = pd.read_csv("classes.csv", sep=",")

classes_df = classes_df.rename(columns={"name": "class_name"})

books_df["date"] = pd.to_datetime(books_df["date"], format=input_date_format)

books_df = books_df.join(classes_df, on="class")
books_df["read_year"] = books_df["date"].dt.year

books_df = books_df.drop(columns=["date", "class", "id"])

books_dict = books_df.to_dict(orient="records")

# Data as a JSON string
data_json = json.dumps(books_dict, indent=4)

# Wraps JSON string in JavaScript module syntax, and saves it to ../js
with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
    file.write(f"export function importData() {{\n	return {data_json};\n}}")
