/* global $ */

"use strict";

import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {
const bb = busyButtons();

/* Imported data */
const data = importData();

const lightGrey = "#f0f5f5";
const darkGrey = "#3a4d49";
const lightMediumGrey = "#dae2e6";

const NS = "http://www.w3.org/2000/svg";

const totalPages = data.map(book => book.pages).reduce((a, b) => a + b);

const bookHeight = 20;

const plan = [25, 20];
const pagesShelf = 12000;

const draw = () => {
    $(".bk svg").empty();

    let shelf = 0;
    let pos = 0;
    let posPages = 0;

	data.forEach((book, i) => {
		const $book = $(document.createElementNS(NS, "g"))
		const $rect = $(document.createElementNS(NS, "rect"))
		const $title = $(document.createElementNS(NS, "text"))

        if (pos === plan[shelf]) {
            ++shelf;
            pos = 0;
            posPages = 0;
        }

		$book.attr({
            "transform": `translate(${posPages}, 0)`
		});

        const bookWidth = 100 * book.pages / pagesShelf;

		$rect.attr({
			"x": 0,
			"y": 0,
			"fill": book.colour,
			"stroke": "black",
			"stroke-width": 0.2,
			"width": bookWidth,
			"height": bookHeight
		});

        $title.text(book.title);

		$title.attr({
            "transform": `translate(${bookWidth / 2 - 0.3}, ${bookHeight / 2}), rotate(90)`,
            "text-anchor": "middle",
            "font-size": "1px"
		});

        $book.append($rect);
        $book.append($title);
        $(`.bk .shelf-${shelf} > svg`).append($book);

        ++pos;
        posPages += bookWidth;
	});
};

const initToolTip = () => {
    bb.tooltip(
        ".eh .viz-container > svg",
        "year",
        (elem) => {
        },
        (elem) => {
        }

    );
};

(() => {
	draw();
    initToolTip();
})();

});
