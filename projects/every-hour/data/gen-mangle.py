#!/bin/bash

import pandas as pd
import numpy as np

w = np.array([1.1, 0.5, 1.1, 1, 1.5, 0.9, 0.9])

with open("data.txt", "r") as file:
    n_rows = len([line for line in file])

w = np.stack([w] * (n_rows - 1))

with open("mangle.npy", "wb") as file:
    np.save(file, w)
