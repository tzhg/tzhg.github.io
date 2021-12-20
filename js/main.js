/* global $ */

"use strict";

import { busyButtons } from "./busy-buttons.js";

$(() => {

const bb = busyButtons();

const lightGrey = "#f2f2f2";

bb.clickButton(
    ".info-button",
    "project-id",
    (id) => lightGrey,
    (id) => { $(`.info-panel[data-project-id=${id}]`).toggle("slow"); }
);

});
