/* global $ */

"use strict";

import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {
const bb = busyButtons();

/* Imported data */
const dataObj = importData();

const categoryInfo = dataObj.categoryInfo;
const startYear = dataObj.startYear;
const data = dataObj.data;
const nCats = categoryInfo.length;

const lightGrey = "#f2f7f7";
const darkGrey = "#3a4d49";
const lightMediumGrey = "#dae2e6";

const NS = "http://www.w3.org/2000/svg";

const initDraw = () => {
	data.forEach((yearArr, d) => {
		const $vizContainer = $(document.createElement("div"));
		$vizContainer.addClass("viz-container");
		$(".eh .chart-container").append($vizContainer);

		const $svg = $(document.createElementNS(NS, "svg"));
		$svg.attr("viewBox", "0 0 1 1");
		$svg.attr("data-year", d);

		const $axis = $(document.createElement("div"));
		$axis.addClass("x-axis");

		const $yearContainer = $(document.createElement("div"));
		$yearContainer.addClass("year-container");
		$yearContainer.text(`${startYear + d}`);

		const $tick = $(document.createElement("div"));
		$tick.addClass("tick");

		$vizContainer.append($svg);
		$axis.append($yearContainer);
		$axis.append($tick);
		$vizContainer.append($axis);
	});
};

const draw = () => {
	/* Number of points on x-axis to plot on each chart */
	const nPoints = data[0][0].length;

	data.forEach((yearArr, d) => {
		const $svg = $(`.eh .viz-container > svg[data-year=${d}]`);
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
				"stroke-width": "1.5",
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
				"fill": lightMediumGrey,
				"width": 1 - lastX + 0.01,
				"height": 1.02
			});
			$svg.append($rect);
		}
	});
};

const isolate = (cat) => {
	/* Number of points on x-axis to plot on each chart */
	const nPoints = data[0][0].length;

	data.forEach((yearArr, d) => {
		const $svg = $(`.eh .viz-container > svg[data-year=${d}]`);
		$svg.empty();
		$svg.css("background-color", lightGrey);

		const $path = $(document.createElementNS(NS, "path"));

		let pathBottom = "";

		for (let j = 0; j < yearArr[0].length; ++j) {
			let valSubtract;

			if (cat === 0) {
				valSubtract = yearArr[cat][j];
			} else if (cat < nCats - 1) {
				valSubtract = yearArr[cat][j] - yearArr[cat - 1][j];
			} else {
				valSubtract = 1 - yearArr[cat - 1][j];
			}
			pathBottom += `L ${j / (nPoints - 1)} ${1 - valSubtract} `;
		}

		if (yearArr[0].length !== nPoints) {
			pathBottom += `L 1 ${yearArr[0][yearArr[0].length - 1]}`;
		}

		$path.attr({
			"d": `M -0.01 1.01 V ${yearArr[0][0]} ${pathBottom} H 1.01 V 1.01 Z`,
			"x": "0",
			"y": "0",
			"fill": categoryInfo[cat][1],
			"width": "10px",
			"height": "10px"
		});

		$svg.append($path);

		if (yearArr[0].length !== nPoints) {
			const $rect = $(document.createElementNS(NS, "rect"))
			const lastX = (yearArr[0].length - 1) / (nPoints - 1);
			$rect.attr({
				"x": lastX,
				"y": -0.01,
				"fill": lightMediumGrey,
				"width": 1 - lastX + 0.01,
				"height": 1.02
			});
			$svg.append($rect);
		}
	});
};



const genLegend = (layoutType) => {
	$(".eh .legend-container").empty();

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

		$(".eh .legend-container").append($button);
	});

	bb.slideBox(
		".eh .legend-container",
		"cat",
        (id) => categoryInfo[id][1],
		(id) => {
			if (id === "") {
				draw();
			} else {
				isolate(Number(id));
			}
		}
	);

	/*
		"--legend-colour": [0, 1, 0, 1],
		);*/
};

(() => {
	initDraw();
	draw();
	genLegend();
})();

});
