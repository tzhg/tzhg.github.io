/* global $ */

"use strict";

import { importData } from "./importData-2.js";

$(() => {

/* Imported data */
const dataObj = importData();

const categoryInfo = dataObj.categoryInfo;
const startYear = dataObj.startYear;
const data = dataObj.data;

const NS = "http://www.w3.org/2000/svg";

const initDraw = () => {
	data.forEach((yearArr, d) => {
		const $vizContainer = $(document.createElement("div"));
		$vizContainer.addClass("viz-container");
		$vizContainer.attr("grid-area", `year-${d}`);
		$(".chart-container").append($vizContainer);

		const $svg = $(document.createElementNS(NS, "svg"));
		$svg.attr("viewBox", "0 0 1 1");
		$svg.attr("preserveAspectRatio", "none");
		$svg.attr("data-year", d);

		const $yearContainer = $(document.createElement("div"));
		const $year = $(document.createElement("div"));
		$yearContainer.addClass("year-container");
		$year.text(`${startYear + d}`);

		$vizContainer.append($yearContainer);
		$yearContainer.append($year);
		$vizContainer.append($svg);
	});
};

const draw = () => {
	/* Number of points on x-axis to plot on each chart */
	const nPoints = data[0][0].length;

	data.forEach((yearArr, d) => {
		const $svg = $(`.viz-container > svg[data-year=${d}]`);
		$svg.empty();
		$svg.css("background-color", categoryInfo[0][1]);

		yearArr.forEach((catArr, i) => {
			const $path = $(document.createElementNS(NS, "path"));
			let pathBottom = "";
            
			catArr.forEach((val, j) => {
				pathBottom += `L ${j / (nPoints - 1)} ${val} `;
			});

			if (catArr.length !== nPoints) {
				pathBottom += `L 1 ${catArr[catArr.length - 1]}`;
			}

			$path.attr({
				"d": `M -0.01 1.01 V ${catArr[0]} ${pathBottom} H 1.01 V 1.01 Z`,
				"x": "0",
				"y": "0",
				"fill": categoryInfo[i + 1][1],
				"width": "10px",
				"height": "10px",
				"stroke": "white",
				"stroke-width": "1",
				"vector-effect": "non-scaling-stroke",
				"stroke-linejoin": "round"
			});

			$svg.append($path);
		});

		if (yearArr[0].length !== nPoints) {
			const $rect = $(document.createElementNS(NS, "rect"))
			const lastX = (yearArr[0].length - 1) / (nPoints - 1);
			$rect.attr({
				"x": lastX,
				"y": -0.01,
				"fill": "white",
				"width": 1 - lastX + 0.01,
				"height": 1.02
			});
			$svg.append($rect);
		}
	});
};

const genLegend = (layoutType) => {
	$(".legend-container").empty();

	/* Determines horizontal padding of buttons */
	const buttonSpace = 33;

	categoryInfo.forEach((cat, i) => {
		const $buttonContainer = $(document.createElement("div"));
		const $button = $(document.createElement("div"));
		const $buttonUnderline = $(document.createElement("div"));
		const $square = $(document.createElement("div"));
		const $label = $(document.createElement("span"));

		$button.addClass("legend-button button");
		$square.addClass("legend-square");
		$label.addClass("legend-label");

		$button.attr("data-cat", String(i));
		$square.css("background-color", cat[1]);

		$label.text(cat[0]);

		$button.append($square);
		$button.append($label);

		$(".legend-container").append($button);
	});
};

(() => {
	initDraw();
	draw();
	genLegend();
})();

});
