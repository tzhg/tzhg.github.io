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

const lightGrey = "#f0f5f5";
const darkGrey = "#3a4d49";
const lightMediumGrey = "#dae2e6";

const NS = "http://www.w3.org/2000/svg";

const initDraw = () => {
	data.forEach((yearArr, d) => {
		const $vizContainer = $(document.createElement("div"));
		$vizContainer.addClass("viz-container");
		$vizContainer.attr("grid-area", `year-${d}`);
		$(".eh .chart-container").append($vizContainer);

		const $svg = $(document.createElementNS(NS, "svg"));
		$svg.attr("viewBox", "0 0 1 1");
		$svg.attr("data-year", d);

		const $axis = $(document.createElement("div"));
		$axis.addClass("x-axis");

		const $yearContainer = $(document.createElement("div"));
		$yearContainer.addClass("year-container");
		$yearContainer.text(`${startYear + d}`);

        if (d === data.length - 1) {
            const $yearContainer2 = $(document.createElement("div"));
            $yearContainer2.addClass("year-container next-year");
            $yearContainer2.text(`${startYear + d + 1}`);
    		$axis.append($yearContainer2);
        }

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
				"fill": "white",
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
		$svg.css("background-color", lightMediumGrey);

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
				"fill": "white",
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
		(id) => {
			if (id === "") {
				draw();
			} else {
				isolate(Number(id));
			}
		}
	);
};

const initToolTip = () => {
    const $svg = $(".eh .viz-container svg");

    let ttUpdate;

    bb.tooltip(
        ".eh .viz-container > svg",
        "year",
        (elem) => {
            const year = elem.dataset.year;
            const size = $(elem).height();

            ttUpdate = (evt) => {
                let x = evt.offsetX / size;
                let y = evt.offsetY / size;

                x = Math.min(x, 1);
                x = Math.max(x, 0);
                y = Math.min(y, 1);
                y = Math.max(y, 0);

                const dayIdx = Math.round(x * (data[0][0].length - 1));

                /* If day in future */
                if (dayIdx >= data[year][0].length) {
                    $(elem).off("pointermove", ttUpdate);
                    $(".tooltip").hide();
                    return;
                }

                const dayArr = data[year].map((arr) => arr[dayIdx]);

                let catIdx = 0;
                while (dayArr[catIdx] < y) {
                    ++catIdx;
                }

                const yearLengths = [365, 365, 365, 366, 365, 365];

                const date = new Date(startYear + Number(year), 0, x * yearLengths[year]);
                const dateStr = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric"}).format(date);

                const prop = (catIdx < nCats - 1 ? dayArr[catIdx] : 1) - (catIdx > 0 ? dayArr[catIdx - 1] : 0);
                const valStr = `${(prop * 100).toFixed(0)}% (${(prop * 24).toFixed(1)} hrs/day)`;

                $(".eh .tt-row:first-child span:last-child").text(dateStr);
                $(".eh .tt-row:nth-child(2) span:last-child").text(categoryInfo[catIdx][0]);
                $(".eh .tt-row:nth-child(3) span:last-child").text(valStr);
            };

            $(elem).on("pointermove", ttUpdate);

            const $ttElem = $(".tooltip");
            $ttElem.empty();

            /* Wrapper allows for custom styling of tooltip */
            const $ttWrapper = $(document.createElement("div"));

    		$ttWrapper.addClass("eh");
            $ttElem.append($ttWrapper);

            /* Date label */
            let $row1 = $(document.createElement("div"));
            $row1.addClass("tt-row");

            let $span10 = $(document.createElement("span"));
            let $span11 = $(document.createElement("span"));

            $span10.text("Date:");

            $row1.append($span10);
            $row1.append($span11);
            $ttWrapper.append($row1);

            /* Category label */
            let $row2 = $(document.createElement("div"));
            $row2.addClass("tt-row");

            let $span20 = $(document.createElement("span"));
            let $span21 = $(document.createElement("span"));

            $span20.text("Category:");

            $row2.append($span20);
            $row2.append($span21);
            $ttWrapper.append($row2);

            /* Value label */
            let $row3 = $(document.createElement("div"));
            $row3.addClass("tt-row");

            let $span30 = $(document.createElement("span"));
            let $span31 = $(document.createElement("span"));

            $span30.text("Time spent:");

            $row3.append($span30);
            $row3.append($span31);
            $ttWrapper.append($row3);
        },
        (elem) => {
            $(elem).off("pointermove", ttUpdate);
        }

    );
};

(() => {
	initDraw();
	draw();
	genLegend();
    initToolTip();
})();

});
