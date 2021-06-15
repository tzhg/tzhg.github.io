/* global $ */

"use strict";

import { busyButtons } from "./busy-buttons.js";

$(() => {

const bb = busyButtons();

const themeColour = "#1e9664";
const darkGrey = "#333333";

const projectPalette = {
    "every-hour": "#805f84",
    "el-hex-tion-results": "#199bce",
    "self-organising-climates": "#a76e21"
};

bb.clickButton(
    ".info-button",
    "project-id",
    (id) => projectPalette[id],
    (id) => {
        const info = $(`.info-content[data-project-id=${id}]`).html();
        showInfo(info);
    }
);

bb.clickButton(
    ".modal-close-button",
    "id",
    () => themeColour,
    () => {
        closeInfo();
    }
);

const showInfo = (info) => {
    $(".modal").css("display", "flex");
    $("body").css("overflow", "hidden");
    $(".modal-content").html(info);
}

const closeInfo = (show) => {
    $(".modal").css("display", "none");
    $("body").css("overflow", "auto");
}

});
