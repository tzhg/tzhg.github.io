import json, os, math, random, cmcrameri
import numpy as np
import matplotlib.pyplot as plt
from matplotlib import colorbar
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm, Normalize
from minisom import MiniSom

# Input:
# ==============================================================================
# data.csv: ";"-separated values, rows = cities, columns = climate variables
#    col 1: name: name of city to be displayed in charts, "|" = new line
#    col 2: mean high for each month, ","-separated
#    col 3: unsed
#    col 4: mean low for each month, ","-separated
#    col 5: mean precipation for each month, ","-separated
#    col 6: mean sunshine hours for each month, ","-separated


# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))


def get_variable_info():
    variable_info_ = [{
            "range": [-16.5, 46.9],
            "labels": [-16.5, -10, 0, 10, 20, 30, 40, 46.9]},
        {
            "range": [-16.5, 46.9],
            "labels": [-16.5, -10, 0, 10, 20, 30, 40, 46.9]},
        {
            "range": [0, 400],
            "labels": [0, 50, 100, 150, 200, 250, 300, 350, 400]},
        {
            "range": [0, 387.5],
            "labels": [0, 50, 100, 150, 200, 250, 300, 350, 387.5]}]


    cm_list = [None] * len(variable_info_)

    seq = np.linspace(0, 1, 256)

    #colours1 = cmcrameri.cm.batlow(seq[64:128])
    #colours2 = cmcrameri.cm.batlow(seq[128:])
    #nodes1 = (seq[:128] * 2) ** 0.5 / 2
    #nodes2 = seq[128:]
    #vik_modified = LinearSegmentedColormap.from_list(
    #    "vik_modified", list(zip(nodes1, colours1)) + list(zip(nodes2, colours2)))

    #cm_list[0] = vik_modified
    #cm_list[1] = vik_modified

    cm_list[0] = cmcrameri.cm.roma_r
    cm_list[1] = cmcrameri.cm.roma_r

    colours = cmcrameri.cm.oslo_r(seq[8:192])
    nodes = np.linspace(0, 1, 192 - 8)
    cm_list[2] = LinearSegmentedColormap.from_list(
        "oslo_modified",
        list(zip(nodes, colours)))

    colours = cmcrameri.cm.nuuk(seq[144:])
    nodes = (seq ** 3)[144:]
    cm_list[3] = LinearSegmentedColormap.from_list(
        "nuuk_modified",
        [(0, (0.25, 0.25, 0.25, 1))] + list(zip(nodes, colours)))


    def get_colours_func(f):
        if f == 0 or f == 1:
            offset = TwoSlopeNorm(
                vcenter=0,
                vmin=variable_info_[f]["range"][0],
                vmax=variable_info_[f]["range"][1])
        elif f == 2 or f == 3:
            offset = Normalize(
                vmin=variable_info_[f]["range"][0],
                vmax=variable_info_[f]["range"][1])

        def get_colours(values):
            values = offset(values)

            # Values can have arbitrary number of dimensions
            # There's probably a better way of doing this...
            if values.ndim == 1:
                array = np.asarray(255 * cm_list[f](values)[:, :-1], dtype="uint32")
                return ["#" + hex(x)[2:].rjust(6, "0") for x in (array[:, 0]<<16) + (array[:, 1]<<8) + array[:, 2]]

            if values.ndim == 3:
                array = np.asarray(255 * cm_list[f](values)[:, :, :, :-1], dtype="uint32")
                return [[[
                            "#" + hex(x3)[2:].rjust(6, "0")
                            for x3 in x2]
                        for x2 in x1]
                    for x1 in (array[:, :, :, 0]<<16) + (array[:, :, :, 1]<<8) + array[:, :, :, 2]]

        return get_colours


    def get_text_colours_func(f):
        if f == 0 or f == 1:
            def get_text_colours(value):
                if value <= -10 or value >= 30:
                    return 0
                return 1
        elif f == 2:
            def get_text_colours(value):
                if value >= 250:
                    return 0
                return 1
        elif f == 3:
            def get_text_colours(value):
                if value == 0:
                    return 0
                return 1

        return get_text_colours


    for f, var in enumerate(variable_info_):
        var["get_text_colours"] = get_text_colours_func(f)
        var["get_colours"] = get_colours_func(f)
        var["cm"] = cm_list[f]
        var["legend_colours"] = var["get_colours"](var["labels"])
        var["legend_label_colours"] = [var["get_text_colours"](x) for x in var["labels"]]

    return variable_info_


def transform_data(data):
    def trans(l, range):
        v = (l - range[0]) / (range[1] - range[0])

        v = max(v, 0)
        v = min(v, 1)

        return v

    for i in range(len(variable_info)):
        data_list[:, i] = np.apply_along_axis(lambda l: trans(l[i], variable_info[i]["range"]), 1, data)

    return [arr.flatten() for arr in data]


def get_som_climate_data(weights):
    def trans_inv(v, range):
        return v * (range[1] - range[0]) + range[0]

    data = np.apply_along_axis(lambda X: X.reshape((len(variable_info), 12)), 2, weights)

    for i in range(len(variable_info)):
        data[:, :, i] = np.apply_along_axis(lambda l: trans_inv(l[i], variable_info[i]["range"]), 2, data)

    return data


def fit_som(data, r, grid_size, sigma, learning_rate):
    som = MiniSom(
        *grid_size,
        len(variable_info) * 12,
        sigma=sigma,
        learning_rate=learning_rate,
        random_seed=r,
        neighborhood_function="gaussian")

    som.train(data, 50000, verbose=True)

    error = [som.topographic_error(data), som.quantization_error(data)]
    max_ar = np.max(som.activation_response(data2))

    city_positions = np.array([som.winner(city) for city in data])

    return (som, city_positions, error, max_ar)


def plot_climate():
    W = np.apply_along_axis(lambda X: X.reshape((len(variable_info), 12)), 1, data_flat)
    plt.figure(figsize=(15, 15))
    for i, f in enumerate(feature_names):
        plt.subplot(1, len(variable_info), i + 1)
        for j, l in enumerate(W):
            plt.plot(range(12), l[i])

    plt.show()


def plot_som_dist():
    plt.pcolor(som.distance_map().T, cmap='bone_r')
    plt.colorbar()

    for i, city in enumerate(data_flat):
        w = som.winner(city)
        plt.text(w[0] + 0.5, w[1], data_names[i][:2])

    plt.show()


def get_city_positions(city_positions, som_climate_data):
    city_text = [
        [
            [
                variable_info[f]["get_text_colours"](som_climate_data[pos[0], pos[1], f, m])
                for m in range(12)]
            for f in range(len(variable_info))]
        for pos in city_positions]

    city_positions[:, 1] = np.shape(som_climate_data)[1] - 1 - city_positions[:, 1]

    # For converting to JSON later
    city_positions = city_positions.tolist();

    return [city_positions, city_text]


def save_data(*data):
    # Data as a JSON string
    data_json = json.dumps(data, indent=4)

    # Wraps JSON string in JavaScript module syntax, and saves it to ../js
    with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
        file.write(f"export function importData() {{\n	return {data_json};\n}}")


# Plots one map
def test(weights, city_positions):
    plt.figure(figsize=(20, 20))

    plt.pcolor(weights[:, :, 0].T, cmap="coolwarm")
    plt.colorbar()

    for j, pos in enumerate(city_positions):
        plt.text(pos[0], pos[1], data_names[j][:5], {"fontsize":"xx-small"})

    plt.savefig(
        os.path.join(dirname, f"../img/0-0test.jpeg"),
        bbox_inches="tight",
        pad_inches = 0)
    plt.close()


def get_map_data(grid_width, seed):
    max_ar = 2
    error = [1, 1]
    count = 0
    grid_height = round(200 / grid_width)

    if seed == 0:
        seed = int(random.random() * 1000000)

    while max_ar > 1 or error[0] > 0 or error[1] > 0.02:
        random.seed(seed)

        som, city_positions, error, max_ar = fit_som(data2, seed, [grid_width, grid_height], 1.5, 2.2)

        count += 1
        if count == 100:
            count = 0
            grid_height += 1

        print(f"Grid size: [{grid_width}, {grid_height}]")
        success = [seed, [grid_width, grid_height], *error]

        seed = int(random.random() * 1000000)

    # Gets SOM climate data
    som_climate_data = get_som_climate_data(som.get_weights())

    # Saves data

    saved_city_data = get_city_positions(city_positions, som_climate_data)

    grid_data = [np.flip(
        var["get_colours"](
            [som_climate_data[:, :, f, m] for m in range(12)]),
        (2)).tolist()
        for f, var in enumerate(variable_info)]

    return [success, saved_city_data, grid_data]


#==============================================================================#
#==============================================================================#
#==============================================================================#


# Climate variables
variable_info = get_variable_info()

# Loads city climate data
with open(os.path.join(dirname, f"./data.csv")) as f:
    data_list = np.array(
        [[x.split(",") for x in line.split(";")[1:]]
            for i, line in enumerate(f) if i > 0],
        dtype="float")

# Deletes 2nd column (mean temperature)
data_list = np.delete(data_list, 1, 1)

# Data range
#data_range = np.array([np.amin(data_list, axis=(0, 2)), np.amax(data_list, axis=(0, 2))])

# Transforms data
data2 = transform_data(data_list)

# Grid widths and seeds
map_data = [
    get_map_data(10, 0),
    get_map_data(15, 0),
    get_map_data(20, 0),
    get_map_data(25, 0)
]

# Prints details of each map
for m_d in map_data:
    print(m_d[0])

saved_var_info = [
    {
        "labels": var["labels"],
        "legend_colours": var["legend_colours"],
        "legend_label_colours": var["legend_label_colours"]}
    for var in variable_info]

# Loads city names
with open(os.path.join(dirname, f"./data.csv")) as f:
    city_names = [line.split(";")[0] for i, line in enumerate(f) if i > 0]

save_data(saved_var_info, city_names, [x[1:] for x in map_data])
