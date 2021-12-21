import csv, json, os
import numpy as np
import pandas as pd
import bisect
from scipy.stats import beta
from scipy.special import beta as beta_f
import matplotlib.pyplot as plt
from scipy.optimize import least_squares
from scipy.optimize import root_scalar
from scipy.stats import uniform

# Current directory
dirname = os.path.dirname(os.path.abspath(__file__))


def save_data(*data):
    # Data as a JSON string
    data_json = json.dumps(data, indent=4)

    # Wraps JSON string in JavaScript module syntax, and saves it to ../js
    with open(os.path.join(dirname, "../js/importData.js"), "w") as file:
        file.write(f"export function importData() {{\n	return {data_json};\n}}")


# Beta-2 PDF
def b2_f(x, b, p, q):
    return x ** (p - 1) / (b ** p * beta_f(p, q) * (1 + x / b) ** (p + q))

# Beta-2 CDF
def b2_F(x, b, p, q):
    return beta.cdf(x / (b + x), p, q)


# Takes all parameters of the model, returns residuals
def resid(b, p, q, c, y, a):
    w0 = b2_F(a, b, p, q)
    w = np.append(w0, 1) - np.append(0, w0)

    z0 = b2_F(a, b, p + 1, q - 1)
    z = (np.append(z0, 1) - np.append(0, z0)) / w

    x = np.append(c, y)

    eps1 = (w - c) / c
    eps2 = (b * p / (q - 1) * z - y) / y

    return(np.append(eps1, eps2))


# Fits model using least squares
def fit_model(c, y, a, name):
    if y is None:
        missing_y = True
        y = (np.append(a, a[-1] + a[-2]) - np.append(0, a)) / 2
    else:
        missing_y = False
        a = (y[:-1] + y[1:]) / 2

    mu = np.mean(y)
    m = mu
    sd = np.std(y)

    def g(mu, m, sd):
        b = (mu ** 2 * (mu - m) - (3 * m - mu) * sd ** 2) / (sd ** 2 - mu ** 2 + mu * m)
        p = mu / b * (2 * m + b) / (mu - m)
        q = (mu + m + b) / (mu - m)

        return [b, p, q]

    for i in range(10):
        b_init, p_init, q_init = g(mu, m * i / 10, sd)

        if b_init > 0 and p_init > 1 and q_init > 1:
            break

    theta_init = np.append([b_init, p_init, q_init], y if missing_y else a)

    res = least_squares(
        lambda x: resid(*x[:3], c, *[x[3:], a] if missing_y else [y, x[3:]]),
        theta_init)

    b, p, q = res.x[:3]
    if missing_y:
        y = res.x[3:]
    else:
        a = res.x[3:]

    print(f"Cost: {res.cost}")

    if False:
        fig, axs = plt.subplots(1, 2)

        X_N = 100

        e = 0.01

        X_lim1 = beta.ppf(e, p, q)
        X_lim2 = beta.ppf(1 - e, p, q) * b / (1 - beta.ppf(1 - e, p, q))

        X = np.linspace(X_lim1, X_lim2, X_N)
        Y = beta.cdf(X / (b + X), p, q)

        axs[0].plot(Y, X, "r-", lw=2)

        i_x = 0
        for i in range(len(c)):
            axs[0].plot([i_x, i_x + c[i]], [y[i]] * 2, "g-", lw=2)
            i_x = i_x + c[i]

        axs[0].title.set_text(f"{name} F_inv")

        axs[1].plot(X, Y, "r-", lw=2)

        i_x = 0
        a_aug = np.concatenate(([0], a, [a[-1] * 2]))
        for i in range(len(a_aug) - 1):
            axs[1].plot([a_aug[i], a_aug[i + 1]], [np.cumsum(c)[i]] * 2, "g-", lw=2)

        axs[1].title.set_text(f"{name} F")
        plt.show()

    return(np.array([b, p, q]))


# Takes unit id, returns the income of representatives of that unit
def unit_parameters(id):
    if str(id) in fitted_pars:
        b, p, q = fitted_pars[str(id)]
    else:
        c_labels = [f"c{i + 1}" for i in range(10)]
        y_labels = [f"y{i + 1}" for i in range(10)]
        a_labels = [f"a{i + 1}" for i in range(10)]

        c = units_df.loc[id, c_labels].tolist()
        y = units_df.loc[id, y_labels].tolist()
        a = units_df.loc[id, a_labels].tolist()

        d = 12 / units_df.at[id, "months"]

        c = np.array([x for x in c if str(x) != "nan"])
        y = np.array([x for x in y if str(x) != "nan"]) * d
        a = np.array([x for x in a if str(x) != "nan"]) * d

        if len(y) == 0 and len(a) == 0:
            raise ValueError("Must supply either y or a")
        elif len(y) == 0:
            y = None
            if len(c) != len(a) + 1:
                raise ValueError(f"len(c)={len(c)} must equal len(a)={len(a)} + 1")
        elif len(a) == 0:
            a = None
            if len(c) != len(y):
                raise ValueError(f"len(c)={len(c)} must equal len(y)={len(y)}")

        b, p, q = fit_model(c, y, a, units_df.at[id, "name"])

        fitted_pars[id] = [b, p, q]

    return [b, p, q]


def region_reps(list_unit_parameters):
    u0 = list_unit_parameters[0]
    mode0 = (u0["p"] - 1) * u0["b"] / (u0["q"] + 1)

    def obj(x):
        return np.sum([b2_F(x, unit["b"], unit["p"], unit["q"]) * unit["population"] for unit in list_unit_parameters])

    quantiles = [
        root_scalar(lambda x: obj(x) - ((i + 1) / n_reps + i / n_reps) / 2, bracket=[0.01, 100 * mode0]).root
        for i in range(n_reps)]

    return quantiles


#==============================================================================#
#==============================================================================#
#==============================================================================#

# Number of representatives
n_reps = 3


# rep1, rep2, ..., rep{n_reps} refer to the income of the representatives
rep_labels = [f"rep{i + 1}" for i in range(n_reps)]

units_df = pd.read_csv("units.csv")
regions_df = pd.read_csv("regions.csv")
countries_df = pd.read_csv("countries.csv")

regions_df2 = units_df.groupby(units_df["region"]).aggregate({"population": "sum"})
units_df["population"] = units_df.apply(lambda row: row["population"] / regions_df2.at[row["region"], "population"], axis=1)

units_N = units_df.shape[0]
regions_N = regions_df.shape[0]
countries_N = countries_df.shape[0]

#X_N = 100
#X_lim = 200000

#X = np.linspace(0, X_lim, X_N)

if False:
    fitted_pars = {}
else:
    fitted_pars = json.load(open("parameters.json"))

units_df[["b", "p", "q"]] = [*units_df.index.map(unit_parameters)]

json.dump(fitted_pars, open("parameters.json",'w'))

region_reps = [region_reps(units_df[units_df["region"] == i][["population", "b", "p", "q"]].to_dict("records")) for i in range(regions_N)]

print(region_reps)
regions_df[rep_labels] = [*region_reps]
#regions_df2 = units_df.groupby(units_df["region"]).aggregate({"population": "sum", **{label: "sum" for label in class_pop_labels}})

regions_df = pd.concat([regions_df2, regions_df], axis=1)

# Converts the income class populations from proportions of total regions, to proportion of current region
#for label in class_pop_labels:
#    regions_df2[label] = regions_df2[label] / regions_df["population"]

reps_max = regions_df.groupby(regions_df["country"]).aggregate({rep_labels[-1]: "max"})[rep_labels[-1]].tolist()

reps_data = [
    [
        {
            "name": d["name"],
            "population": d["population"],
            "reps": [d[label] for label in rep_labels]}
        for d in regions_df[regions_df["country"] == c].to_dict("records")]
    for c in range(countries_N)]

save_data(n_reps, reps_data, reps_max)




#Y_units = [unit_class_pop(i, X) for i in range(units_N)]

#Y_regions = [
#    np.sum([Y_units[j] for j in units_df.index[units_df["region"] == i].tolist()], axis=0)
#    for i in range(regions_N)]

#fig, ax = plt.subplots(1, 1)

#palette = ["#6a45c2", "#96a467", "#803e4c", "#48abb8", "#d18c84", "#154e56", "#8f8ac5", "#b51d49", "#05b56f", "#df72ef"]

#for i in range(units_N):
#    ax.plot(X, Y_units[i], color=palette[units_df.at[i, "region"]], lw=1, label=units_df.at[i, "name"], alpha=0.5)

#for i in range(regions_N):
#    ax.plot(X, Y_regions[i], color=palette[i], lw=2, label=regions_df.at[i, "name"])

#plt.stackplot(X, *Y_regions, labels=regions_df["name"].tolist())


#for r in range(regions_N):
#    i_x = 0
#    a_aug = np.concatenate(([0], a_star, [a_star[-1] * 2]))
#    for i in range(len(a_aug) - 1):
#        ax.plot([a_aug[i], a_aug[i + 1]], [Y_regions[r][i]] * 2, color=palette[r], lw=2, label=regions_df.at[r, "name"])

#plt.legend()
#plt.show()
