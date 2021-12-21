/* global $ */

"use strict";
import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {

const bb = busyButtons();

const lightGrey = "#f2f7f7";
const darkGrey = "#3a4d49";
const lightMediumGrey = "#dae2e6";
const themeColour = "#1e9664";

const data = importData();
const nReps = data[0];
const regionData = data[1];
const maxY = data[2];
const repPalette = ["#208eb7", "#6d7d4c", "#a03a58"];

const NS = "http://www.w3.org/2000/svg";

let selCountry;
let selRegion;

const createCountrySelection = () => {
    bb.toggleButton(
        ".ua .country-sel-button",
        "country",
        (id) => [lightGrey, darkGrey, themeColour],
        (id) => {
            changeCountry(Number(id));
            draw();
        },
        "0"
    );
};

const changeCountry = (country_i) => {
    selCountry = country_i;
    changeRegion(0);
    $(".ua .map-box > div").hide();
    $(`.ua .map-box > div:nth-child(${country_i + 1})`).show();
}

const changeRegion = (reg_i) => {
    selRegion = reg_i;

    let pop = regionData[selCountry][reg_i].population;

    let pop_f = new Intl.NumberFormat("en-GB").format(pop);

    $(".ua .region-info-name").text(regionData[selCountry][reg_i].name);
    $(".ua .region-info-population").text(pop_f);
};

const draw = () => {
    const $svg = $(".ua .chart-svg");
    const svgShape = [$svg.width(), $svg.height()];

    const incomeLinePadRight = 25;

    $svg.empty();

    $svg.attr("viewBox", `0 0 ${svgShape[0]} ${svgShape[1]}`);

    const drawPerson = (income, colour, opacity) => {
        const $icon = $(document.createElementNS(NS, "g"));
        const $rect = $(document.createElementNS(NS, "rect"));
        const $pent = $(document.createElementNS(NS, "path"));
        const $head = $(document.createElementNS(NS, "circle"));

        $rect.attr("x", "-10");
        $rect.attr("y", "-45");
        $rect.attr("width", "20");
        $rect.attr("height", "28");
        $rect.attr("ry", "8");
        $rect.attr("transform", "scale(-1, 1)");

        $pent.attr("d", "m 163.47374,158.08382 c -42.02989,0 -46.66625,-3.36852 -59.6542,-43.34131 -12.987949,-39.972802 -11.217017,-45.423172 22.78588,-70.127721 34.00289,-24.704549 39.73375,-24.704549 73.73664,-2e-6 34.00289,24.704547 35.77383,30.154917 22.78588,70.127713 -12.98795,39.9728 -17.62431,43.34132 -59.6542,43.34132 z");
        $pent.attr("transform", "matrix(0.11172678, 0, 0, 0.26515666, -18.264395, -41.916977)");

        $head.attr("cx", "0");
        $head.attr("cy", "-54.5");
        $head.attr("r", "7.5");

        $icon.append($rect);
        $icon.append($pent);
        $icon.append($head);

        $icon.attr("fill", colour);
        $icon.attr("opacity", opacity);
        $icon.attr("transform", `translate(${(svgShape[0] - incomeLinePadRight) * income / maxY[selCountry]}, ${svgShape[1]}) scale(0.8)`);

        $svg.append($icon);

    };

    regionData[selCountry].forEach((region, reg_i) => {
        for (let i = 0; i < nReps; ++i) {
            if (reg_i !== selRegion) {
                drawPerson(region.reps[i], lightMediumGrey, 1);
            }
        }
    });

    for (let i = 0; i < nReps; ++i) {
        drawPerson(regionData[selCountry][selRegion].reps[i], repPalette[i], 1);
    }

};

const drawAxis = () => {
    const $tick = $(document.createElement("div"));
    $tick.addClass("tick");
    $(".ua .viz-box").append($tick);
};

const drawMaps = () => {
    $(".ua path").addClass("button toggle-button region-sel-button");

    $(".ua .map-us path").each((i, path) => {
        path.dataset.region = [8, 7, 3, 6, 5, 2, 4, 8, 8, 1, 0][i];
    });

    $(".ua .map-mx path").each((i, path) => {
        path.dataset.region = [1, 0, 2, 3, 4, 5, 6, 7][i];
    });


    bb.toggleButton(
        ".ua .map-us .region-sel-button",
        "region",
        (id) => [lightGrey, darkGrey, themeColour],
        (id) => {
            changeRegion(Number(id));
            draw();
        },
        "0"
    );

    bb.toggleButton(
        ".ua .map-mx .region-sel-button",
        "region",
        (id) => [lightGrey, darkGrey, themeColour],
        (id) => {
            changeRegion(Number(id));
            draw();
        },
        "0"
    );
};

const init = (() => {
    createCountrySelection();
    drawMaps();
    changeCountry(0);
    changeRegion(0);
    draw();
})();

});
