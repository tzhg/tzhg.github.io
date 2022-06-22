import pandas as pd

input_date_format = "%d/%m/%Y"

books_df = pd.read_csv("data.csv", sep=",")
classes_df = pd.read_csv("classes.csv", sep=",")

classes_df = classes_df.rename(columns={"name": "class_name"})

books_df["date"] = pd.to_datetime(books_df["date"], format=input_date_format)

books_df = books_df.join(classes_df, on="class")
books_df["read_year"] = books_df["date"].dt.year

books_df = books_df.drop(columns=["date", "class", "id"])

print(books_df.to_dict(orient="records"))
