/* global $ */

"use strict";

import { pointerEvents } from "./pointerEvents.js";

$(() => {

const bb = pointerEvents();

const themeColour = "#1e9664";


bb.buttons(
    "click",
    ".gh-button",
    "id",
    (id) => themeColour,
    {
        "background-color": [1, 0.2, 0.3],
        "color": [0, 0, 0]
    }
);

bb.buttons(
    "click",
    ".info-button",
    "project-id",
    () => themeColour,
    {
        "background-color": [0, 0.2, 0.3],
        "color": [1, 1, 1]
    },
    "",
    (evt, id) => {
        const info = $(`.info-content[data-project-id=${id}]`).html();
        showInfo(info);
    }
);

bb.buttons(
    "click",
    ".modal-close-button",
    "id",
    () => themeColour,
    {
        "background-color": [0, 0.2, 0.3],
        "color": [1, 1, 1]
    },
    "",
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
