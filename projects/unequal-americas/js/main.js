/* global $ */

"use strict";
import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {

const bb = busyButtons();

const lightGrey = "#f2f2f2";
const darkGrey = "#333333";

const importedData = importData();
const incomeClasses = importedData[0];
const regionData = importedData[1];
const nClasses = incomeClasses.length + 1;
const classPal = ["yellow", "blue", "green"];

const NS = "http://www.w3.org/2000/svg";

let horChart = true;

const draw = () => {
    const $svg = $(".ua .chart-svg");
    const svgShape = [100, 100];

    /* Current position in svg: */
    /*     (x, y) if vertical chart */
    /*     (y, x) if horizontal chart */
    let pos = [0, 0];

    regionData.forEach(region => {
        for (let c = 0; c < nClasses; ++c) {
            const $rect = $(document.createElementNS(NS, "rect"));
            //$rect.addClass("");
            $rect.attr(`${horChart ? "y" : "x"}`, `${pos[0]}`);
            $rect.attr(`${horChart ? "x" : "y"}`, `${pos[1]}`);
            $rect.attr(`${horChart ? "height" : "width"}`, `${region.dist[c] * svgShape[0]}`);
            $rect.attr(`${horChart ? "width" : "height"}`, `${region.pop * svgShape[1]}`);
            $rect.attr("fill", `${classPal[c]}`);

            $svg.append($rect);

            pos[0] += region.dist[c] * svgShape[0];
        }
        pos[0] = 0;
        pos[1] += region.pop * svgShape[1];
    });
};

const init = (() => {
    draw();
})();

});
