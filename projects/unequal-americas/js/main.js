/* global $ */

"use strict";
import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {

const bb = busyButtons();

const lightGrey = "#f0f5f5";
const darkGrey = "#3a4d49";
const lightMediumGrey = "#dae2e6";
const themeColour = "#1e9664";

const countries = ["United States", "Mexico", "Brazil"];

const data = importData();
const nReps = data[0];
const regionData = data[1];
const maxY = data[2];
const repPalette = ["#208eb7", "#6d7d4c", "#a03a58"];
const repPaletteLight = ["#24a3d1", "#83965c", "#ba4367"];

const screenThresh = [450, 500, 550, 700, 799, 850, 1000];
let screenSize;
let showThousands = [false, false, false, false, true, false, false, true];
let showCurrency = [false, true, false, true, true, false, true, true];

/* Determines tick positions and labels in x-axis */
const regionAxis = [
    { ticks: [0, 25000, 50000, 75000, 100000, 125000, 150000, 175000], currency: "USD" },
    { ticks: [0, 50000, 100000, 150000, 200000, 250000, 300000, 350000], currency: "MXN" },
    { ticks: [0, 25000, 50000, 75000, 100000, 125000], currency: "BRL" }
];

const regionOrder = [
    [1, 3, 2, 4, 0],
    [0, 1, 2, 3],
    [3, 4, 2, 0, 1]
];

const NS = "http://www.w3.org/2000/svg";

let selCountry;
let svgShape = [1, 1];


const createCountrySelection = () => {
    bb.toggleButton(
        ".ua .country-sel-button",
        "country",
        (id) => themeColour,
        (id) => {
            changeCountry(Number(id));
            draw();
        },
        "0"
    );
};

const changeCountry = (countryIdx) => {
    selCountry = countryIdx;
    $(".ua .map-cell > object").css("display", "none");
    $(`.ua .map-cell > .map-${countryIdx}`).css("display", "flex");
    $(`.ua .map-cell > .map-${countryIdx}`).css("visibility", "visible");

    const nRegions = regionData[selCountry].length;

    $(".ua .main-box > *").css("visibility", "hidden");
    for (let i = 0; i < nRegions; ++i) {
        $(`.ua .main-box .row-${i}`).css("visibility", "visible");
    }

    regionData[selCountry].forEach((region, i) => {
        const regionIdx = regionOrder[selCountry][i];

        let pop = regionData[selCountry][i].population / 10**6;

        pop = new Intl.NumberFormat("en-GB", {
           minimumFractionDigits: 1,
           maximumFractionDigits: 1,
        }).format(pop);

        $(`.ua .desc-cell.row-${regionIdx} .region-info-name`).text(regionData[selCountry][i].name);
        $(`.ua .desc-cell.row-${regionIdx} .region-info-population`).text(`${pop} million`);
        $(`.ua .desc-cell.row-${regionIdx}`).css("display", "block");
    });
};

const drawAxes = () => {

};

const draw = () => {
    /* Income line parameters */
    const iLPadRight = 25;
    const iLPadTop = 5;

    const axisHeight = 25;
    const tickHeight = 5;

    const xPos = (income) => {
        return (svgShape[0] - iLPadRight) * income / maxY[selCountry];
    };

    $(".ua .viz-cell .tick, .ua .viz-cell .tick-label").remove();

    regionData[selCountry].forEach((region, i) => {
        const regionIdx = regionOrder[selCountry][i];
        const $vizCell = $(`.ua .viz-cell.row-${regionIdx}`);
        const $svg = $(`.ua .viz-cell.row-${regionIdx} > svg`);
        $svg.empty();

        //const $svg = $(document.createElementNS(NS, "svg"));
        //$svg.attr("viewBox", `0 0 ${svgShape[0]} ${svgShape[1]}`);
        //$vizCell.append($svg);

        for (let j = 0; j < nReps; ++j) {
            const $icon = $(document.createElementNS(NS, "g"));
            const $rect = $(document.createElementNS(NS, "rect"));
            const $pent = $(document.createElementNS(NS, "path"));
            const $head = $(document.createElementNS(NS, "circle"));
            const $padding = $(document.createElementNS(NS, "rect"));

            const x = xPos(region.reps[j]);

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

            $icon.attr("fill", repPalette[j]);
            $icon.attr("pointer-events", "none");

            /* Height of icon */
            const h = svgShape[1] - axisHeight - iLPadTop;

            /* Width of icon (3.1 is ratio of height to width) */
            const w = h / 3.1;

            /* Ensures padding is wide enough */
            const pad_w = Math.max(20, w)

            $padding.attr("x", `${x - pad_w / 2}`);
            $padding.attr("y", `${iLPadTop}`);
            $padding.attr("width", `${pad_w}`);
            $padding.attr("height", `${h}`);
            $padding.addClass("rep-icon");
            $padding.attr("data-rep-id", String(nReps * i + j));
            $padding.attr("opacity", "0");

            /* Height of icon is 62 px */
            const scale = h / (62 + iLPadTop);

            $icon.attr("transform", `translate(${x}, ${svgShape[1] - axisHeight}) scale(${scale})`);

            $svg.append($icon);
            $svg.append($padding);
        }

        regionAxis[selCountry].ticks.forEach((val, j) => {
            const opt = {
                style: "currency",
                currency: regionAxis[selCountry].currency,
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: "0"
            };

            let label = new Intl.NumberFormat("en-GB", showCurrency[screenSize] ? opt : {}).format(showThousands[screenSize] ? val : val / 1000);

            const $tick = $(document.createElement("div"));
            const $label = $(document.createElement("div"));

            $tick.addClass("tick");
            $label.addClass("tick-label");

            $tick.css("bottom", `${axisHeight - tickHeight}px`);
            $tick.css("height", `${j === 0 ? tickHeight * 2 + 2 : tickHeight}px`);

            $label.text(showThousands[screenSize] || val === 0 ? label : label + "k");

            $vizCell.append($tick);
            $vizCell.append($label);

            $tick.css("left", `${xPos(val)}px`);
            $label.css("left", `${xPos(val) - $label.width() / 2}px`);
        })

        const $line = $(document.createElement("div"));

        $line.addClass("income-line");

        $line.css("bottom", `${axisHeight}px`);

        $vizCell.append($line);
    });

    initToolTip();
};

const initToolTip = () => {
    bb.tooltip(
        ".ua .rep-icon",
        "rep-id",
        (elem) => {
            const regionIdx = Math.floor(elem.dataset.repId / nReps);
            const repIdx = Number(elem.dataset.repId % nReps);

            const $ttElem = $(".tooltip");
            $ttElem.empty();

            /* Wrapper allows for custom styling of tooltip */
            const $ttWrapper = $(document.createElement("div"));

    		$ttWrapper.addClass("ua");
            $ttElem.append($ttWrapper);

            /* Region label */
            let $row1 = $(document.createElement("div"));
            $row1.addClass("tt-row");

            let $span10 = $(document.createElement("span"));
            let $span11 = $(document.createElement("span"));

            $span10.text("Region:");
            $span11.text(`${regionData[selCountry][regionIdx].name}`);

            $row1.append($span10);
            $row1.append($span11);
            $ttWrapper.append($row1);

            const opt = {
                style: "currency",
                currency: regionAxis[selCountry].currency,
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: "0"
            };

            /* Quantile label */
            let $row2 = $(document.createElement("div"));
            $row2.addClass("tt-row");

            let $span20 = $(document.createElement("span"));
            let $span21 = $(document.createElement("span"));

            const income = regionData[selCountry][regionIdx].reps[repIdx];
            const incomeFormat = new Intl.NumberFormat("en-GB", opt).format(income);

            const repLabel = ["Poorest", "Middle", "Richest"][repIdx];
            $span20.text("Class:");
            $span21.text(`${repLabel} third`);

            $row2.append($span20);
            $row2.append($span21);
            $ttWrapper.append($row2);

            /* Income label */
            let $row3 = $(document.createElement("div"));
            $row3.addClass("tt-row");

            let $span30 = $(document.createElement("span"));
            let $span31 = $(document.createElement("span"));

            $span30.text("Median income:");
            $span31.text(`${incomeFormat}`);

            $row3.append($span30);
            $row3.append($span31);
            $ttWrapper.append($row3);

            $(elem).prev().children().attr("fill", bb.shadeColour(repPalette[repIdx], 0.3));
        },
        (elem) => {
            $(elem).prev().children().attr("fill", repPalette[elem.dataset.repId % nReps]);
        }

    );
};

const layout = () => {
    const winWidth = $(window).width() + 17;

    screenSize = 0;
    while (screenSize < screenThresh.length && winWidth > screenThresh[screenSize]) {
        ++screenSize;
    }

    for (let i = 0; i < 10; ++i) {
        svgShape = [$(`.ua .viz-cell.row-0 > svg`).width(), $(`.ua .viz-cell.row-0 > svg`).height()];
        $(".ua .viz-cell > svg").attr("viewBox", `0 0 ${svgShape[0]} ${svgShape[1]}`);
    }
};

const init = (() => {
    createCountrySelection();
    changeCountry(0);

    layout();
    draw();

    $(".ua .outer").css("visibility", "visible");

    window.addEventListener("resize", () => {
        layout();
        draw();
    });
})();

});
