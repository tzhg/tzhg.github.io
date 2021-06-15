/* global $ */

"use strict";

import { busyButtons } from "../../../js/busy-buttons.js";
import { importData } from "./importData.js";

$(() => {

const data = importData();

/* Active electon */
let elec = 2;

const bb = busyButtons();

/* css constants */
const themeColour = "#1e9664";
const darkThemeColour = "#146141";
const lightGrey = "#e6e6e6";
const lightMediumGrey = "#b3b3b3";
const darkMediumGrey = "#808080";
const darkGrey = "#333333";
const viewBoxW = 100;
const mapPadding = 25;

/* Coordinate systems notation: */
/* (p, q): Screen (DOM) coordinate system (SCS) */
/* (x, y): Canvas coordinate system (CCS)*/
/* (r, s): Hexagonal coordinate system (HCS)

/* Hexagonal coordinate system: */
/* Transformed version of Cartesian grid where every second row is
/* shifted to the right */
/*  * Origin at top left */
/*  * x-coordinate increases to the right */

/* Current filter */
/* selectedDensitySlider: Range slider state, [a, b] such that 0 <= a < b <= 1 */
/* selectedPartyGroup: party group id */
/* selectedSubregion: subregion id */
let selectedDensityRange, selectedPartyGroup, selectedSubregion;

const NS = "http://www.w3.org/2000/svg";

const draw = (() => {
    const angle = (x) => Math.PI * (0.5 + x) / 3;

    /* Length of sides of hexagon in CCS */
    const l = viewBoxW / (data[elec].svgDimHex[0] + 0.1) / Math.sqrt(3);

    /* Converts hex coordinates to canvas coordinates */
    const hexToCanvas = ([r, s]) => {
        const x = Math.sqrt(3) * (0.1 + 0.5 + s + (r % 2 == data[elec].linesIndented ? 0.5 : 0)) * l;
        const y = (0.1 + 1 + 1.5 * r) * l;
        return [x, y];
    };

    /* list_hexagons: list of hexagon coords in HCS */
    /* Returns list of vertices in boundary of list_hexagons in CCS */
    const areaBoundary = (list_hexagons, boundary_l, holes=true) => {
        /* hex: coords [r, s] of hexagon in HCS
        /* i: index denoting adjacent hexagon to hex: */
        /*    i=0: hexagon to bottom-right */
        /*    i increases clockwise */
        /* Returns coords of adjacent hexagon */
        const adjacentHex = (hex, j) => {
            const offset = hex[0] % 2 == data[elec].linesIndented ? 1 : 0;
            if (j === 0) {
                return [hex[0] + 1, hex[1] + offset];
            }
            if (j === 1) {
                return [hex[0]  + 1, hex[1]- 1 + offset];
            }
            if (j === 2) {
                return [hex[0], hex[1] - 1];
            }
            if (j === 3) {
                return [hex[0] - 1, hex[1] - 1 + offset];
            }
            if (j === 4) {
                return [hex[0] - 1, hex[1] + offset];
            }
            if (j === 5) {
                return [hex[0], hex[1] + 1];
            }
        };

        /* Finds numerical array in an array of numerical arrays */
        const inArr = (elem, numArr) => {
            const eps = 0.001;
            let present = false;
            numArr.forEach((elem2) => {
                if (!present) {
                    present = true;
                    elem.forEach((x, i) => {
                        if (Math.abs(x - elem2[i]) > eps) {
                            present = false;
                        }
                    });
                }
            });
            return present;
        };

        /* Draws a portion of the side of hexagon hex from vertices i1 to i2 */
        /* Takes a hexagon and two indices representing vertices */
        /* Returns vertex in between, whose length to i1 is
        /*     (((1 - linkWidth) * l) */
        const hexCorner = (hex, i1, i2) => {
            const linkWidth = 0.85;

            let v1 = hexVertex(hex, i1, boundary_l);
            let v2 = hexVertex(hex, i2, boundary_l);

            let dx = v2[0] - v1[0];
            let dy = v2[1] - v1[1];

            let dist = Math.sqrt(dx ** 2 + dy ** 2);
            let d = ((1 - linkWidth) * l) / dist;
            return [v1[0] + dx * d, v1[1] + dy * d];
        };

        /* Picks hexagon hex1 in constituency, tests if
        /*     an adjacent hexagon hex2 is in constituency,
        /* Repeats to find border of constituency */
        const getBorder = (hex1, i) => {
            let hex2 = adjacentHex(hex1, i);
            let vertex;
            let arr = [];

            let k = 0;
            while (k < 1000) {
                let j = 0;

                /* Follows border around hex1 until it runs into hex2 */
                while (!inArr(hex2, list_hexagons)) {
                    vertex = hexVertex(hex1, (i + j) % 6, boundary_l);

                    /* If path meets its beginning, we are finished */
                    if (j > 0 && inArr(vertex, arr)) {
                        return arr;
                    }

                    if (arr.length > 0 && j === 0 && boundary_l > l) {
                        arr[arr.length - 1][0] = (arr[arr.length - 1][0] + vertex[0]) / 2;
                        arr[arr.length - 1][1] = (arr[arr.length - 1][1] + vertex[1]) / 2;
                    } else if (k > 0) {
                        arr.push(vertex);
                    }

                    ++j;
                    hex2 = adjacentHex(hex1, (i + j) % 6);
                }

                /* Draws link between hex1 and hex2  */


                i = (i + j) % 6;
                arr.push(hexVertex(hex1, i, boundary_l));

                if (boundary_l < l) {
                    arr.push(hexCorner(hex1, i, (i + 1) % 6));
                }

                i = (i + 4) % 6;
                hex1 = hex2;
                hex2 = adjacentHex(hex1, i);

                if (boundary_l < l) {
                    arr.push(hexCorner(hex1, i, (i + 5) % 6));
                }

                ++k;
            }

            return false;
        }

        /* Takes three adjacent hexagons, returns vertices of hole in between */
        const getHole = (hex, i) => {
            let arr = [];

            arr.push(hexVertex(hex, (i + 1) % 6, boundary_l));
            arr.push(hexCorner(hex, (i + 1) % 6, i));

            hex = adjacentHex(hex, i);
            i = (i + 3) % 6;

            arr.push(hexCorner(hex, i, (i + 1) % 6));
            arr.push(hexVertex(hex, i, boundary_l));
            arr.push(hexCorner(hex, i, (i + 5) % 6));

            hex = adjacentHex(hex, (i + 5) % 6);
            i = (i + 3) % 6;

            arr.push(hexCorner(hex, (i + 5) % 6, i));
            arr.push(hexVertex(hex, (i + 5) % 6, boundary_l));
            arr.push(hexCorner(hex, (i + 5) % 6, (i + 4) % 6));

            hex = adjacentHex(hex, (i + 4) % 6);
            i = (i + 3) % 6;

            arr.push(hexCorner(hex, (i + 4) % 6, (i + 5) % 6));

            return arr;

        };

        let arr = [];
        let border = false;

        /* Chooses points until it finds the border */
        for (let i = 0; border === false; ++i) {
            border = getBorder(list_hexagons[i], 0);
        }

        arr.push(border);

        if (holes) {
            let list_hex_copy = list_hexagons.map((hex) => hex.slice());
            while (list_hex_copy.length >= 3) {
                for (let i = 0; i < 6; ++i) {
                    const hex1 = list_hex_copy[0];
                    const hex2 = adjacentHex(hex1, i);
                    const hex3 = adjacentHex(hex1, (i + 1) % 6);

                    if (inArr(hex2, list_hex_copy) && inArr(hex3, list_hex_copy)) {
                        arr.push(getHole(hex1, i));
                    }
                }
                list_hex_copy.shift();
            }
        }
        return arr;

    };

    /* coords: coordinates of hexagon in HCS */
    /* i: vertex, starting from bottom-right */
    const hexVertex = (coords, i, _l) => {
        const canvasCoords = hexToCanvas(coords);
        const x = canvasCoords[0];
        const y = canvasCoords[1];
        return [x + Math.cos(angle(i)) * _l, y + Math.sin(angle(i)) * _l];
    };

    /* Hexagons */
    const drawMP = ($svg, elec_id, mp, hexGapWidth) => {
        let hexShape = Array.from(Array(6))
            .map((_, i) => {
                return hexVertex(mp.hex_coords, i, l).join(", ");
            })
            .join(" ");

        const $hex = $(document.createElementNS(NS, "polygon"));
        $hex.attr("points", hexShape);
        $hex.attr("class", "hexagon");
        $hex.attr("stroke-width", "0.1");
        $hex.attr("pointer-events", "none");
        $hex.attr("fill", mp.colour);
        $hex.attr("stroke", mp.colour);
        $hex.attr("data-mp-id", mp.mp_id);

        $svg.append($hex);
    };

    /* Gap in between hexagons to create linked effect */
    const drawHexGap = ($svg, elec_id, constit, hexGapWidth) => {
        areaBoundary(constit.hex_coords, l - 0.01).forEach((border_part, i) => {
            const $border = $(document.createElementNS(NS, "path"));

            $border.attr("fill", "none");
            $border.attr("pointer-events", "none");
            $border.attr("stroke", "white");
            $border.attr("stroke-width", String(hexGapWidth));

            let str = "";
            let arr = [];
            let start = "";

            border_part.forEach((coords, i) => {
                if (i === 0) {
                    start = `M ${coords.join(" ")}`
                }
                arr.push(`L ${coords.join(" ")}`);
            });

            $border.attr("d", `${start} ${arr.join(" ")} Z`);

            $svg.append($border);
        });
    };

    /* Invisible constituency areas to emit hover event */
    const drawConstitEvtArea = ($svg, elec_id, constit, hexGapWidth) => {
        areaBoundary(constit.hex_coords, l, false).forEach((border_part, i) => {
            const $border = $(document.createElementNS(NS, "path"));

            $border.attr("fill", "none");
            $border.attr("pointer-events", "visibleFill");
            $border.attr("class", "constit-hover-border");
            $border.attr("stroke", darkGrey);
            $border.attr("opacity", "1");
            $border.attr("stroke-width", "0");
            $border.attr("data-constit-id", constit.constit_id);

            let str = "";
            let arr = [];
            let start = "";

            border_part.forEach((coords, i) => {
                if (i === 0) {
                    start = `M ${coords.join(" ")}`
                }
                arr.push(`L ${coords.join(" ")}`);
            });

            $border.attr("d", `${start} ${arr.join(" ")} Z`);

            $svg.append($border);
        });
    };

    /* Continuation of hex-gap */
    const drawSubregion = ($svg, elec_id, subregion, hexGapWidth) => {
        areaBoundary(subregion.hex_coords, l + hexGapWidth, false).forEach((border_part, i) => {
            const $border = $(document.createElementNS(NS, "path"));

            $border.attr("fill", "none");
            $border.attr("pointer-events", "none");
            $border.attr("stroke", "white");
            $border.attr("stroke-width", String(hexGapWidth + 0.1));

            let str = "";
            let arr = [];
            let start = "";

            border_part.forEach((coords, i) => {
                if (i === 0) {
                    start = `M ${coords.join(" ")}`
                }
                arr.push(`L ${coords.join(" ")}`);
            });

            $border.attr("d", `${start} ${arr.join(" ")} Z`);

            $svg.append($border);
        });
    };

    return (type, elec_id) => {
        const hexGapWidth = type === "big" ? 1.3 : 0;

        const $svg = $(`.ehr .map-svg${type === "big" ? "" : "-" + elec_id}`);

        $svg.empty();

        Object.entries(data[elec_id].mps).forEach(([_, mp]) => {
            drawMP($svg, elec_id, mp, hexGapWidth);
        });

        if (type === "big") {
            const $hexGap = $(document.createElementNS(NS, "g"));

            Object.entries(data[elec_id].constits).forEach(([_, constit]) => {
                drawConstitEvtArea(
                    $svg,
                    elec_id,
                    constit
                );
            });

            $hexGap.attr("class", "hex-gap");

            Object.entries(data[elec_id].constits).forEach(([_, constit]) => {
                drawHexGap($hexGap, elec_id, constit, hexGapWidth);
            });

            Object.entries(data[elec_id].subregions).forEach(([_, subregion]) => {
                drawSubregion($hexGap, elec_id, subregion, hexGapWidth);
            });

            $svg.append($hexGap);
        } else {
            const $hexGap = $(document.createElementNS(NS, "g"));

            Object.entries(data[elec_id].subregions).forEach(([_, subregion]) => {
                drawSubregion($hexGap, elec_id, subregion, hexGapWidth);
            });
            $svg.append($hexGap);
        }
    };
})();

/* Formats percentages in legend */
/* 0 <= n <= 1 */
const formatPercent = (n) => {
    if (n === 0) {
        return "0%";
    }
    if (n === 100) {
        return "100%";
    }
    return `${n.toFixed(1)}%`;
};

const initLegend = () => {
    $(".ehr .legend-content").empty();
    $(".ehr .legend-content").off();

    let selectedParty = "";

    const buttonList = [];
    const buttonWidthList = [];

    const nSeats = Object.entries(data[elec].parties).map(([_, party]) => party.n_seats);

    const nSeatsSortArr = Array.from(Array(nSeats.length).keys()).sort((a, b) => nSeats[a] > nSeats[b] ? -1 : (nSeats[b] > nSeats[a]) | 0);

    nSeatsSortArr.forEach(i => {
        let party = data[elec].parties[i];
        /* Retains selected party group */
        if (party.group_id === selectedPartyGroup) {
            selectedParty = String(party.party_id);
        }

        const $legendButton = $(document.createElement("div"));
        const $buttonLabel = $(document.createElement("div"));
        const $buttonIconLabel = $(document.createElement("div"));
        const $legendSeatCount = $(document.createElement("div"));

        const $hexSvg = $(document.createElementNS(NS, "svg"));
        const $hex = $(document.createElementNS(NS, "polygon"));

        const hexLength = 1;

        $hexSvg.attr("class", "legend-hex");
        $hexSvg.attr("viewBox", `${-Math.sqrt(3) / 2} -1 ${Math.sqrt(3)} 2`);

        const angle = (x) => Math.PI * (0.5 + x) / 3;

        let points = Array.from(Array(6))
            .map(
                (_, i) => `${Math.cos(angle(i)) * hexLength}, ${Math.sin(angle(i)) * hexLength}`
            )
            .join(" ");

        $hex.attr({
            "points": points,
            "pointer-events": "none",
            "stroke-width": "0",
            "fill": data[elec].parties[i].colour
        });

        $hexSvg.append($hex);

        $legendButton.addClass("legend-button button");
        $buttonLabel.addClass("legend-button-label");
        $legendSeatCount.addClass("legend-seat-count");

        $legendButton.attr("data-party-id", party.party_id);

        $buttonLabel.text(party.party_name);

        $buttonIconLabel.append($hexSvg);
        $buttonIconLabel.append($buttonLabel);
        $legendButton.append($buttonIconLabel);
        $legendButton.append($legendSeatCount);

        $(".ehr .legend-content").append($legendButton);
    });

    bb.slideBox(
        ".ehr .legend-content",
        "party-id",
        (id) => {
            selectedPartyGroup = id === "" ?
                "" :
                data[elec].parties[id].group_id;
            filter();
        }
    );

};

const initSubregionLabels = () => {
    const drawSubregionLabels = () => {
        $(".ehr .subregion-label").remove();
        Object.entries(data[elec].subregions).forEach(([_, subregion]) => {
            let $label = $(document.createElement("div"));
            let $container = $(".ehr .viz-box .map-container");

            $label.addClass("subregion-label button hover-button");
            $label.html(subregion.name);
            $label.attr("data-subregion-id", subregion.subregion_id);

            $label.css({
                "font-size": $(".ehr .map-svg").width() > 400 ? "14px" : "12px",
                "padding": $(".ehr .map-svg").width() > 400 ? "4px 8px" : "2px 4px"
            });

            $container.append($label);

            let mapWidth = $container[0].getBoundingClientRect().width;
            let mapHeight = $container[0].getBoundingClientRect().height;

            let labelWidth = $label[0].getBoundingClientRect().width;
            let labelHeight = $label[0].getBoundingClientRect().height;

            $label.css({
                "left": `${subregion.x * mapWidth - labelWidth / 2}px`,
                "top": `${subregion.y * mapHeight - labelHeight / 2}px`
            });
        });

		bb.hoverButton(
			".ehr .subregion-label",
			"subregion-id",
            () => projectColour,
            (id) => {
                selectedSubregion = id;
                filter();
            }
		);
    };

    drawSubregionLabels();

    $(window).on("resize", () => {
        drawSubregionLabels();
    });
};

const filterMap = (type, elec_id) => {
    const $svg = $(`.ehr .map-svg${type === "big" ? "" : "-" + elec_id}`);

    let partyCounts;
    if (type === "big") {
        partyCounts = new Array(Object.keys(data[elec].parties).length).fill(0);
    }

    $svg.find(".hexagon").each((_, hex) => {
        const mp = data[elec_id].mps[hex.dataset.mpId];

        let d = Number(data[elec_id].constits[mp.constit_id].density);
        let filterDensity = selectedDensityRange === "" ||
            (d >= selectedDensityRange[0] && d <= selectedDensityRange[1]);

        let filterParty = selectedPartyGroup === "" ||
            mp.party_group_id === Number(selectedPartyGroup);

        let s = data[elec_id].constits[mp.constit_id].subregion_id;
        let filterSubregion = selectedSubregion === "" ||
            s === Number(selectedSubregion);

        if (filterDensity && filterParty && filterSubregion) {
            if (type === "big") {
                ++partyCounts[mp.party_id];
            }
        } else {
            $(hex).addClass("grey-hex");
            $(hex).appendTo($(hex).parents("svg"));
        }

    });

    if (type === "big") {
        $(".ehr .hex-gap").appendTo($svg);
        return partyCounts;
    }
};

/* Applies filters and draws map */
const filter = () => {
    $(".ehr .hexagon").removeClass("grey-hex");

    Object.entries(data).forEach(([elec_id, _]) => {
        filterMap("small", elec_id)
    });

    const partyCounts = filterMap("big", elec);

    /* Updates party seat count */

    const totalSeats = partyCounts.reduce((a, b) => a + b, 0);

    $(".ehr .legend-button").each((_, legendButton) => {
        const i = Number($(legendButton).attr("data-party-id"));
        const percent = totalSeats === 0 ?
            "n/a" :
            formatPercent(100 * partyCounts[i] / totalSeats);

        $(legendButton).find(".legend-seat-count").text(`${partyCounts[i]} (${percent})`);
    });

    /* Updates total seat count */

    let totalPercent = totalSeats === 0 ? "n/a" : "100%";

    $(".ehr .legend-footer").text(`Total seats: ${totalSeats}`);
};

const initToolTip = (elec_id) => {
    const $svg = $(".ehr map-svg");

    const constitData = Object.entries(data[elec_id].constits).map(([_, constit]) => {
        return constit.mps.map((mp) => {
            return {
                "name": data[elec_id].mps[mp].mp_name,
                "party": data[elec_id].mps[mp].abbreviation,
                "colour": data[elec_id].mps[mp].colour,
                "percent": data[elec_id].mps[mp].first_pref_percent
            };
        });
    });

    const ttVSpace = 60;

    bb.tooltip(
        ".ehr .constit-hover-border",
        "constit-id",
        (elem, state) => {
            const constitId = elem.dataset.constitId;

            const $ttElem = $(".tooltip");
            $ttElem.empty();
            let dataObj = constitData[elem.dataset.constitId];

            let $boxHeader = $(document.createElement("div"));
    		$boxHeader.addClass("tooltip-mp-box");

            /* Constituency name */
            let $constitLabel = $(document.createElement("div"));
            $constitLabel.text(data[elec_id].constits[constitId].name);
    		$constitLabel.addClass("tooltip-constit-label");
            $boxHeader.append($constitLabel);

            /* % first preference label */
            let $pfpLabel= $(document.createElement("div"));
            $pfpLabel.text("FIRST PREF.");
    		$pfpLabel.addClass("tooltip-pfp-label table-header");
            $boxHeader.append($pfpLabel);

            $ttElem.append($boxHeader);

            /* MPs */
            dataObj.forEach((mp, i) => {
                let $box = $(document.createElement("div"));
    			$box.addClass("tooltip-mp-box");

                let $partyLabel = $(document.createElement("div"));
                let $span = $(document.createElement("span"));

    			$partyLabel.addClass("tooltip-party");
                $partyLabel.css("background-color", mp.colour);
    			$partyLabel.css("color", "white");

                $span.text(mp.party);

                $partyLabel.append($span);
                $box.append($partyLabel);

                let $nameLabel = $(document.createElement("span"));
    			$nameLabel.addClass("tooltip-name");
                $nameLabel.text(mp.name);
                $box.append($nameLabel);

                const pfp = Number(mp.percent) > 0 ?
                    formatPercent(mp.percent) :
                    "C.C.";

                let $percentLabel = $(document.createElement("span"));
    			$percentLabel.addClass("tooltip-percent");
                $percentLabel.text(pfp);
                $box.append($percentLabel);

                $ttElem.append($box);
            });

            const $border = $(document.createElementNS(NS, "path"));
            $border.attr("fill", "none");
            $border.attr("pointer-events", "none");
            $border.attr("class", "hover-border");
            $border.attr("d", $(elem).attr("d"));
            $border.attr("stroke", darkGrey);
            $border.attr("opacity", "1");
            $border.attr("stroke-width", "0.3");
            $(".viz-box .map-svg").append($border);
        },
        () => {
            $(".ehr .hover-border").remove();
        }

    );
};

const initDensitySelection = () => {
    const densityRanges = [
        [0, 35],
        [35, 50],
        [50, 75],
        [75, 500],
        [500, 2000],
        [2000, 10000]
    ];

    const densityPalette = [
        "#1f9663",
        "#598936",
        "#7c7712",
        "#98610d",
        "#ab4628",
        "#b02949"
    ];

    bb.slideBox(
        ".ehr .density-container",
        "density",
        (id) => {
            selectedDensityRange = id === "" ? "" : densityRanges[id];
            filter();
        }
    );
};

const initElectionSelection = () => {
    selectedDensityRange = "";
    selectedPartyGroup = "";
    selectedSubregion = "";
    const viewBoxH = viewBoxW / data[elec].svgDimHex[0] * data[elec].svgDimHex[1];
    const svgViewBox = `0 0 ${viewBoxW} ${viewBoxH}`;

    Object.entries(data).forEach(([elec_id, obj]) => {
        const $mapContainer = $(document.createElement("div"));
        const $electionButton = $(document.createElement("div"));
        const $buttonLabel = $(document.createElement("div"));
        const $svg = $(document.createElementNS(NS, "svg"));

        $mapContainer.addClass("map-container");
        $electionButton.addClass("election-button");
        $buttonLabel.addClass("election-label button toggle-button");
        $svg.addClass(`map-svg-${elec_id}`);

        $buttonLabel.text(`GE ${obj.name}`);
        $buttonLabel.attr("data-election-id", elec_id);

        $svg.attr("viewBox", svgViewBox);
        $svg.attr("preserveAspectRatio", "none");

        $mapContainer.append($svg);
        $electionButton.append($mapContainer);
        $electionButton.append($buttonLabel);
        $(".ehr .election-box").append($electionButton);

        draw("small", elec_id);
    });

    bb.toggleButton(
        ".ehr .election-label",
        "election-id",
        () => [darkThemeColour, "white", darkThemeColour],
        (id) => {
            elec = Number(id);

            drawElection();
        },
        String(elec)
    );

    const $mapContainer = $(document.createElement("div"));
    const $svg = $(document.createElementNS(NS, "svg"));

    $mapContainer.addClass("map-container");
    $svg.addClass("map-svg");

    $svg.attr("viewBox", svgViewBox);
    $svg.attr("preserveAspectRatio", "none");

    $mapContainer.append($svg);
    $(".ehr .viz-box").append($mapContainer);

    drawElection()
};


const drawElection = () => {
    draw("big", elec);
    initToolTip(elec);
    initLegend();

    filter();
};

const init = (() => {
    initElectionSelection();
    initDensitySelection();
    initSubregionLabels();
})();

});
