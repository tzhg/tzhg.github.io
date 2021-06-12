import os, json
import numpy as np
import pandas as pd


# Input files:
# ==============================================================================
#
# party_groups: associates identical or similar parties between elections
#     colour: party colour (hex format)
#
# subregions.csv: groups of constituencies
#     name: name of subregion
#     x: x-position of centre of label of subregion in svg, as percentage
#     y: y-position of centre of label of subregion in svg, as percentage
#
# dir: A directory corresponding to an election
#
# dir/constits.csv: constituencies (groups of mps which must form a contiguous area)
#    name: name of constituency
#    subregion_id: id (row index) of containing subregion
#    area: surface area (people / km^2)
#    population: population
# dir/constit_map.txt: map showing positions of each constituency on hexagonal grid
# dir/mps.csv: elected members of parliament
#     name 1: last name
#     name 2: first name
#     constit_id: id (row index) of containing constituency
#     party_id: id of containing party
# dir/parties.csv: political parties
#     name: name of party
#     abbreviation: abbreviated name
#     group: party group id (row index)
#
# Output file:
# ==============================================================================
# ../js/importData.js

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))

# List of elections
data_info = {
    "0": {
        "name": "2011",
        "dir": "ie-ge-2011"
    },
    "1": {
        "name": "2016",
        "dir": "ie-ge-2016"
    },
    "2": {
        "name": "2020",
        "dir": "ie-ge-2020"
    }
}


def election_dict(election):
    dir = election["dir"]

    # Load csv input files
    constits_df = pd.read_csv(os.path.join(dirname, f"./{dir}/constits.csv"), encoding="utf_8")
    mps_df = pd.read_csv(os.path.join(dirname, f"./{dir}/mps.csv"), encoding="utf_8")
    parties_df = pd.read_csv(os.path.join(dirname, f"./{dir}/parties.csv"), encoding="utf_8")
    subregions_df = pd.read_csv(os.path.join(dirname, f"./subregions.csv"), encoding="utf_8")
    party_groups_df = pd.read_csv(os.path.join(dirname, f"./party_groups.csv"), encoding="utf_8")

    # Add ids
    constits_df["constit_id"] = constits_df.index
    mps_df["mp_id"] = mps_df.index
    parties_df["party_id"] = parties_df.index
    subregions_df["subregion_id"] = subregions_df.index

    # Associate parties through party group id
    mps_df["party_group_id"] = mps_df.apply(
        lambda row: parties_df.at[row["party_id"], "group_id"],
        axis=1)

    parties_df["colour"] = parties_df.apply(
        lambda row: party_groups_df.at[row["group_id"], "colour"],
        axis=1)

    # For each mp, adds details of its party
    mps_df["mp_name"] = mps_df["name2"] + " " + mps_df["name1"]
    parties_df.rename(columns={"name": "party_name"}, inplace = True)
    mps_df.drop(["name1", "name2"], axis=1, inplace=True)
    mps_df = pd.merge(mps_df, parties_df, how="left", on="party_id")

    # Load constit_map.txt into np.ndarray
    with open(os.path.join(dirname, f"./{dir}/constit_map.txt"), "r") as file:
        constit_map = np.asarray([[
                int(x)
                if x != "__"
                else "-1"
                for x in line[:-1].split()
            ] for line in file], dtype=int)

    # lines_indented = 0: odd-numbered lines indented
    # lines_indented = 1: even-numbered lines indented
    with open(os.path.join(dirname, f"./{dir}/constit_map.txt"), "r") as file:
        if list(file)[0][0] == "_":
            lines_indented = 1
        else:
            lines_indented = 0

    # Width and height of map (relative to hexagon width)
    svg_dim_hex = [
        max(
            np.size(constit_map[lines_indented::2], 1) + 0.5,
            np.size(constit_map[(lines_indented + 1) % 2::2], 1)),
        (2 / 3 ** 0.5) * (1 + 0.75 * (constit_map.shape[0] - 1))
    ]

    # For each constituency, adds corresponding hexagon coords from "constit_map.txt
    constits_df["hex_coords"] = constits_df.apply(
        lambda row: np.argwhere(constit_map == row["constit_id"]).tolist(),
        axis=1)

    # For each mp, assigns hexagon coords from its constituency
    def assign_mps_to_map(row):
        xx = constits_df.at[row["constit_id"], "hex_coords"]
        return xx[row.name % len(xx)]

    mps_df["hex_coords"] = mps_df.apply(assign_mps_to_map, axis=1)

    # For each constituency, adds ids of mps in that constituency
    constits_df["mps"] = mps_df.groupby("constit_id")["mp_id"].apply(list)

    # For each subregion, adds ids and hex_coords of mps in that constituency
    subregions_df["mps"] = constits_df.groupby("subregion_id")["mps"].apply(
        lambda ds: [item for sublist in list(ds) for item in sublist])
    subregions_df["hex_coords"] = constits_df.groupby("subregion_id")["hex_coords"].apply(
        lambda ds: [item for sublist in list(ds) for item in sublist])

    # For each party, adds ids and hex_coords of mps in that party
    parties_df["mps"] = mps_df.groupby("party_id")["mp_id"].apply(list)
    parties_df["hex_coords"] = mps_df.groupby("party_id")["hex_coords"].apply(list)
    parties_df["n_seats"] = parties_df["hex_coords"].apply(lambda l: len(l))

    # For each constituency, adds population density
    constits_df["density"] = constits_df["population"] / constits_df["area"]
    constits_df.drop(["population", "area"], axis=1, inplace=True)

    return {
        "name": election["name"],
        "parties": parties_df.to_dict(orient="index"),
        "constits": constits_df.to_dict(orient="index"),
        "mps": mps_df.to_dict(orient="index"),
        "subregions": subregions_df.to_dict(orient="index"),
        "svgDimHex": svg_dim_hex,
        "linesIndented": lines_indented
    }


# Data as an object
data_obj = {
    elec_id: election_dict(info)
    for (elec_id, info) in data_info.items()}

# Data as a JSON string
data_json = json.dumps(data_obj, indent=4)

# Wraps JSON string in JavaScript module syntax, and saves it to ../js
with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
    file.write(f"export function importData() {{\n	return {data_json};\n}}")
