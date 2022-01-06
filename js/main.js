/* global $ */

"use strict";

import { busyButtons } from "./busy-buttons.js";

$(() => {

const bb = busyButtons();

const lightGrey = "#f0f5f5";

bb.clickButton(
    ".info-button",
    "project-id",
    (id) => "#ffffff",
    (id) => { $(`.info-panel[data-project-id=${id}]`).toggle("slow"); }
);

});
