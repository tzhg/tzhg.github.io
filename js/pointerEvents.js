export function pointerEvents() {
	/* Pointer events for mouse and touch devices */

	/* Lightens or darkens a colour */
	/* percent=-1: black */
	/* percent=0: original colour */
	/* percent=1: white */
	const shadeColour = (colour, percent) => {
		if (percent > 1) {
			return "#FFFFFF";
		} else if (percent === 0) {
			return colour;
		} else if (percent < -1) {
			return "#000000";
		}

		let f = parseInt(colour.slice(1), 16);
		let t = percent < 0 ? 0 : 255;
		let p = percent < 0 ? percent * -1 : percent;

		let r = f >> 16;
		let g = f >> 8 & 0x00FF;
		let b = f & 0x0000FF;

		r += Math.round((t - r) * p);
		g += Math.round((t - g) * p);
		b += Math.round((t - b) * p);

		return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
	}

	/* Creates events for multiple buttons which are activated by
	/*     mouse click or touch tap
	/*
	/* sel: jQuery selector returning all buttons
	/* colour: colour of button (used by stateStyle)
	/* stateStyle: Object of css properties, which arrays of >=4 values
	/*     corresponding to button states:
	/*         type="click": [default, active, hover]
	/*         type="clickToggle": [default, toggled-on, hover, active]
	/*         type="hoverToggle": [default, hover]
	/*     The values may be hex colours, or percents corresponding to
	/*     shades of the colour "colour"
	/* stateFunc: function(elem, state) which is called when button changes
	/*     state (set stateFunc="" if no function)
	/* dataId: The buttons should have a distinct data attribute data-${id}
	/*     (non-CamelCase string)
	/* f: function(evt, id) called when button with id "id" (string) is
	/*     clicked on or toggled on.
	/*     If mandatory=false and no button is toggled,
	/*     then id="" will be passed.
	/* type:
	/*     "click":
	/*     "clickToggle":
	/*     "hoverToggle":
	/* mandatory: (only for toggle buttons)
	/*     true: one button is toggled on at any time
	/*     false: zero or one buttons can be toggled on
	/* startId: (only for toggle buttons)
	/*     if defined, is the id (string) of the button which starts toggled-on */
	const buttons = (
		type,
		sel,
		dataId,
		colour,
		stateStyle,
		stateFunc="",
		f=() => {},
		mandatory=false,
		startId="") => {

		const buttonStateId = ((id, state) => {
			const $elem = $(`${sel}[data-${dataId}=${id}]`);

			if (stateStyle !== "") {
				Object.entries(stateStyle).forEach(([key, val]) => {
					const col = isNaN(val[state]) || val[state] > 1 || val[state] < -1 ?
						val[state] :
						shadeColour(colour(id), val[state]);
					$elem.css(key, col);
				});
			}

			if (stateFunc !== "") {
				stateFunc($elem[0], state);
			}
		});

		if (type === "click" || type === "clickToggle") {
			$(sel).attr("tabindex", "1");
		}

		let toggledOnId = "";
		let touchedElem = "";

		const initDesign = () => {
			$(sel).each((_, elem) => {
				const id = $(elem).attr(`data-${dataId}`);
				if (startId === "" || startId !== id) {
					buttonStateId(id, 0);
				} else {
					toggledOnId = startId;
					buttonStateId(startId, 1);
				}
			});
		};

		const hover = (evt) => {
			const id = $(evt.target).attr(`data-${dataId}`);

			$(sel).css("cursor", "pointer");

			/* If not hovering over a toggled-on button */
			if (!(type === "clickToggle" && toggledOnId === id)) {
				buttonStateId(id, 2);
			}
		};

		const unhover = (id) => {
			$(sel).css("cursor", "auto");
			buttonStateId(id, 0);
		};

		const toggle = (id, evt, on="") => {
			/* We cannot toggle off a button if mandatory=true */
			if (mandatory && toggledOnId === id) {
				return
			}

			/* Toggles off previous button */
			if (toggledOnId !== "") {
				buttonStateId(toggledOnId, 0);
			}

			if ((on === "" || on) && toggledOnId !== id) {
				/* Toggle different button */
				buttonStateId(id, 1);
				f(evt, id);
				toggledOnId = id;
			} else {
				/* Toggle same button */
				toggledOnId = "";
				f(evt, "");
			}
		}

		$(sel)
			.on("pointerdown", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);
				touchedElem = evt.target.dataset[dataId];

				if (type === "click") {
					buttonStateId(id, 1);
				} else if (type === "clickToggle") {
					if (!mandatory || toggledOnId !== id) {
						buttonStateId(id, 3);
					}
				}
			})
			.on("pointerup keypress", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				/* Enter and space keys */
			    if (evt.type === "keypress" && evt.charCode !== 13 && evt.charCode !== 32) {
			        return
			    }

				if (type === "click") {
					f(evt, id);

					buttonStateId(id, 0);

					if (evt.pointerType !== "touch") {
						hover(evt);
					}
				} else if (type === "clickToggle") {
					if (evt.type === "keypress" || touchedElem !== "") {
						touchedElem = "";

						toggle(id, evt);

						$(sel).css("cursor", "auto");
						if (!mandatory && evt.pointerType !== "touch") {
							hover(evt);
						}
					}
				}
			})
			.on("pointerover", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				if (type === "hoverToggle" && evt.pointerType === "touch") {
					toggle(id, evt);
				} else if (type === "hoverToggle" && evt.pointerType !== "touch") {
					toggle(id, evt, true);
				} else if (type === "click" && evt.pointerType !== "touch") {
					hover(evt);
				} else if (type === "clickToggle" && evt.pointerType !== "touch") {
					if (!mandatory || toggledOnId !== id) {
						hover(evt);
					}
				}
			})
			.on("pointerleave", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				if (type === "hoverToggle" && evt.pointerType !== "touch") {
					toggle(id, evt, false);
				} else if (type === "click" && evt.pointerType !== "touch") {
					unhover(id);
				} else if (type === "clickToggle" && evt.pointerType !== "touch") {
					touchedElem = "";

					if (toggledOnId !== id) {
						unhover(id);
					}
				}
			});

		$(document.body).on("pointerdown pointercancel", (evt) => {
			if (type === "hoverToggle" && evt.pointerType === "touch") {
				let id = $(evt.target).attr(`data-${dataId}`);

				/* Toggle off any buttons */
				if (toggledOnId !== id) {
					id = toggledOnId;
					toggle(id, evt, false);
				}
			}
	    });

		/* When using back/forward browser buttons, need to rerun parts of script */
		$(window).on("pageshow load", initDesign);
	};

	return {
		buttons
	};
}
