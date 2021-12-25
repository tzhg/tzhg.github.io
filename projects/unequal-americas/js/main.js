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
let svgShape;

const regionOrder = [[1, 3, 2, 4, 0], [0, 1, 2, 3]];

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

const changeCountry = (countryIdx) => {
    selCountry = countryIdx;
    $(".ua .map-box > div").hide();
    $(`.ua .map-box > div:nth-child(${countryIdx + 1})`).css("display", "flex");

    $(".ua .region-info-box > div").css("display", "none");

    regionData[selCountry].forEach((region, i) => {
        const regionIdx = regionOrder[selCountry][i];

        let pop = regionData[selCountry][i].population;
        pop = new Intl.NumberFormat("en-GB").format(pop);

        $(`.ua .region-info-box > div:nth-child(${regionIdx + 1})`).css("display", "flex");
        $(`.ua .region-info-box > div:nth-child(${regionIdx + 1}) .region-info-name`).text(regionData[selCountry][i].name);
        $(`.ua .region-info-box > div:nth-child(${regionIdx + 1}) .region-info-population`).text(pop);
    });

    const nRegions = regionData[selCountry].length;

    $(".ua .region-info-box > div").css("height", `${100 / nRegions}%`);
    $(".ua .map-box object").css("height", `${100 / nRegions}%`);
}

const draw = () => {
    const $svg = $(".ua .chart-svg");

    /* Income line parameters */
    const iLPadRight = 25;
    const iLPadTop = 5;
    const iLThickness = 2;
    const iLTickHeight = 8;
    const iLYProp = 0.5;

    $svg.empty();

    $svg.attr("viewBox", `0 0 ${svgShape[0]} ${svgShape[1]}`);

    const drawPerson = (nRegions, y, x, colour, opacity) => {
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

        /* Height of icon is 62 px */
        const scale = (iLYProp * svgShape[1] / nRegions) / (62 + iLPadTop);

        $icon.attr("transform", `translate(${x}, ${y}) scale(${scale})`);

        $svg.append($icon);
    };

    regionData[selCountry].forEach((region, i) => {
        const regionIdx = regionOrder[selCountry][i];

        const $incomeLine = $(document.createElementNS(NS, "g"));
        const $line = $(document.createElementNS(NS, "line"));
        const $zeroTick = $(document.createElementNS(NS, "line"));

        const y = (regionIdx + iLYProp) / regionData[selCountry].length * svgShape[1];

        for (let j = 0; j < nReps; ++j) {
            const x = iLThickness / 2 + (svgShape[0] - iLPadRight - iLThickness / 2) * region.reps[j] / maxY[selCountry];
            drawPerson(regionData[selCountry].length, y, x, repPalette[j], 1);
        }

        $line.attr("x1", "0");
        $line.attr("x2", `${svgShape[0]}`);
        $line.attr("y1", `${y}`);
        $line.attr("y2", `${y}`);
        $line.attr("stroke", `${darkGrey}`);
        $line.attr("stroke-width", `${iLThickness}`);

        $zeroTick.attr("x1", `${iLThickness / 2}`);
        $zeroTick.attr("x2", `${iLThickness / 2}`);
        $zeroTick.attr("y1", `${y - iLTickHeight}`);
        $zeroTick.attr("y2", `${y + iLTickHeight}`);
        $zeroTick.attr("stroke", `${darkGrey}`);
        $zeroTick.attr("stroke-width", `${iLThickness}`);

        $incomeLine.append($line);
        $incomeLine.append($zeroTick);
        $svg.append($incomeLine);
    });
};

const drawAxis = () => {
    const $tick = $(document.createElement("div"));
    $tick.addClass("tick");
    $(".ua .viz-box").append($tick);
};

const init = (() => {
    createCountrySelection();
    changeCountry(0);

    svgShape = [$(".ua .chart-svg").width(), $(".ua .chart-svg").height()];
    draw();

    window.addEventListener("resize", () => {
        svgShape = [$(".ua .chart-svg").width(), $(".ua .chart-svg").height()];
        draw();
    });
})();

});
