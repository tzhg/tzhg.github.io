/* global $ */

"use strict";

import { busyButtons } from "./busy-buttons.js";

$(() => {

const bb = busyButtons();

const themeColour = "#1e9664";
const lightGrey = "#f2f2f2";

let infoShow = false;

bb.clickButton(
    ".info-button",
    "project-id",
    (id) => lightGrey,
    (id) => {
        $(`.info-panel[data-project-id=${id}]`).css("display", infoShow ? "none" : "block");
        infoShow = !infoShow;
    }
);

});
