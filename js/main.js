/* global $ */

"use strict";

import { busyButtons } from "./busy-buttons.js";

$(() => {

const bb = busyButtons();

const themeColour = "#1e9664";

bb.clickButton(
    ".info-button",
    "project-id",
    () => themeColour,
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
