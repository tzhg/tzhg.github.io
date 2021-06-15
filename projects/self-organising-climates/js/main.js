/* global $ */

"use strict";
import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {

const bb = busyButtons();

const lightGrey = "#e6e6e6";
const lightMediumGrey = "#b3b3b3";
const darkMediumGrey = "#808080";
const darkGrey = "#333333";
let svgShape;

const importedData = importData();
let varData = importedData[0];
let cityNames = importedData[1];
let mapData;

const nVar = 4;
let selectedMonth = 0;
let selectedVar = 0;

const NS = "http://www.w3.org/2000/svg";

/* Vertical spacing of names in chart */
const spacing = [[0.5], [1 / 3, 2 / 3], [0.2, 0.5, 0.8]];

const draw = () => {
    $(".soc .chart-svg").children(".city-label").each((_, label) => {
        $(label).attr("fill", mapData[0][1][label.dataset.city][selectedVar][selectedMonth] === 0 ? "white" : darkGrey);
    });
    $(".soc .chart-svg").children(".grid-cell").each((_, cell) => {
        $(cell).attr("fill", mapData[1][selectedVar][selectedMonth][cell.dataset.x][cell.dataset.y]);
    });
};

const drawColourBar = () => {
    $(".soc .colour-bar").empty();

    varData[selectedVar].labels.forEach((text, i) => {
        const $cell = $(document.createElement("div"));
        $cell.addClass("legend-cell");
        $cell.css("background-color", varData[selectedVar].legend_colours[i]);
        $cell.css("color", varData[selectedVar].legend_label_colours[i] === 0 ? "white" : darkGrey);
        $(".soc .colour-bar").append($cell);

        const $text = $(document.createElement("div"));
        $text.text(text);
        $cell.append($text);
    });
};

const chartLayout = () => {/*
    const $chartBox = $(document.createElement("div"));
    $chartBox.addClass("chart-box");
    $(".soc .viz-box").append($chartBox);

    const $chartContainer = $(document.createElement("div"));
    $chartContainer.addClass("chart-container");
    $chartBox.append($chartContainer);

    const $chartTop = $(document.createElement("div"));
    $chartTop.addClass("chart-top");
    $chartContainer.append($chartTop);

    const $icon = $(document.createElement("img"));
    $icon.addClass("var-icon");
    $icon.attr("src", `./projects/self-organising-climates/img/icon-${f}.svg`);
    $chartTop.append($icon);

    const $chartTitle = $(document.createElement("div"));
    $chartTitle.text(data[1][f].name);
    $chartTitle.addClass("chart-title");
    $chartTop.append($chartTitle);
*/
    const $svg = $(".soc .chart-svg");

    $svg.empty();

    $svg.attr("viewBox", `0 0 ${svgShape[0]} ${svgShape[1]}`);

    const mat = mapData[1][selectedVar][selectedMonth];
    const gridShape = [mat.length, mat[0].length];

    for (let i = 0; i < gridShape[0]; ++i) {
        for (let j = 0; j < gridShape[1]; ++j) {
            const $rect = $(document.createElementNS(NS, "rect"));
            $rect.addClass("grid-cell");
            $rect.attr("x", `${(i / gridShape[0]) * svgShape[0]}`);
            $rect.attr("y", `${(j / gridShape[1]) * svgShape[1]}`);
            $rect.attr("width", `${0.25 + svgShape[0] / gridShape[0]}`);
            $rect.attr("height", `${0.25 + svgShape[1] / gridShape[1]}`);
            $rect.attr("fill", mat[i][j]);
            $rect.attr("data-x", i);
            $rect.attr("data-y", j);

            $svg.append($rect);
        }
    }

    cityNames.forEach((name, c) => {
        name = name.split("|");

        name.forEach((text, i) => {
            const $text = $(document.createElementNS(NS, "text"));
            $text.text(text);

            $text.addClass("city-label");
            $text.attr({
                "fill": mapData[0][1][c][selectedVar][selectedMonth] === 0 ? "white" : darkGrey,
                "x": `${((mapData[0][0][c][0] + 0.5) / gridShape[0]) * svgShape[0]}`,
                "y": `${((mapData[0][0][c][1] + spacing[name.length - 1][i]) / gridShape[1]) * svgShape[1]}`,
                "text-anchor": "middle",
                "dominant-baseline": "central",
                "data-city": c
            });
            $svg.append($text);
        });
    });

    drawColourBar();
};

const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

const createMonthSelection = () => {
    const months = [
    	"January",
    	"February",
    	"March",
    	"April",
    	"May",
    	"June",
    	"July",
    	"August",
    	"September",
    	"October",
    	"November",
    	"December"
    ];

    const palette = [
        "#733957",
        "#823c3d",
        "#94502e",
        "#aa752f",
        "#c3a34b",
        "#d5ce81",
        "#cbe1b3",
        "#a4d8cb",
        "#74bbcd",
        "#5393bf",
        "#516ba4",
        "#62497d"
    ];

    months.forEach((month, m) => {
        const $button = $(document.createElement("div"));
        $button.addClass("month-button button");
        $button.css("background-color", lightGrey);
        $button.attr("data-month", m);
        $(".soc .month-box").append($button);

        const $textBig = $(document.createElement("div"));
        $textBig.addClass("month-text-big");
        $textBig.text(month);
        $button.append($textBig);

        const $mediumSmall = $(document.createElement("div"));
        $mediumSmall.addClass("month-text-medium");
        $mediumSmall.text(month.substring(0, 3));
        $button.append($mediumSmall);

        const $textSmall = $(document.createElement("div"));
        $textSmall.addClass("month-text-small");
        $textSmall.text(month.substring(0, 1));
        $button.append($textSmall);
    });

    bb.slideBox(
        ".soc .month-box",
        "month",
        (id) => {
            selectedMonth = Number(id);
            draw();
        },
        () => darkGrey,
        "0"
    );
};

const createVarSelection = () => {
    const varColours = ["#a76e21", "#2c86bd", "#567fc0", "#b6b68f"];

    bb.toggleButton(
        ".soc .var-button",
        "var",
        (id) => varColours[id],
        (id) => {
            selectedVar = Number(id);
            draw();
            drawColourBar();
        },
        "0"
    );
};

const layout = () => {
    let layoutType = 0;

    const thr = [380, 450, 600, 600, 750, 950, 1100];

    const mainContainerMaxW = 1100;
    const mainContainerPadding = 25;
    const minimumWidth = 100;

    const chartWidth = Math.max(
        Math.min($(window).width(), mainContainerMaxW) -
            2 * mainContainerPadding, minimumWidth
    );

    /* w: chart width */
    /* Returns number of cells horizontally */
    const nHorizCells = (w) => {
        if (w > 600) {
            return w / 25;
        }
        return w / 20;
    };

    const dataIdx = Math.max(Math.round(nHorizCells($(".chart-svg").width()) / 5) - 2, 0);
    console.log(dataIdx);

    mapData = importedData[2][dataIdx];

    svgShape = [mapData[1][0][0].length * 10, mapData[1][0][0][0].length * 10];

    chartLayout();
}

const init = (() => {
    createMonthSelection();
    createVarSelection();
    layout();
    window.addEventListener("resize", layout);
})();

});
