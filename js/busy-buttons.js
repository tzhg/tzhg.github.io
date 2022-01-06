export function busyButtons() {
	/* Pointer events for mouse and touch devices */
	/* See busy-buttons-demo.html for demo */

	const darkGrey = "#3a4d49";
	const darkMediumGrey = "#abbab2";
	const lightMediumGrey = "#dae2e6";
    const lightGrey = "#f0f5f5";
    const themeColour = "#1e9664";

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

    const lightGreyFocus = shadeColour(lightGrey, -0.03);

	/* Creates events for multiple buttons which are activated by
	/*     mouse click or touch tap
	/*
	/* sel: jQuery selector returning all buttons
	/* colour: colour of button
	/* dataId: The buttons should have a distinct data attribute data-${id}
	/*     (non-CamelCase string)
	/* f: function(id) called when button with id "id" (string) is
	/*     clicked */
	const clickButton = (sel, dataId, colour, f) => {
		const buttonStateId = ((id, state) => {
			const $elem = $(`${sel}[data-${dataId}=${id}]`);

			const backgroundColor = [colour(id), shadeColour(colour(id), -0.06), shadeColour(colour(id), -0.04)];

			$elem.css({
				"background-color": backgroundColor[state]
			});
		});

		let toggledOnId = "";

		$(sel).each((_, elem) => {
			const id = $(elem).attr(`data-${dataId}`);
			buttonStateId(id, 0);
		});

		const hover = (evt) => {
			const id = $(evt.target).attr(`data-${dataId}`);

			$(sel).css("cursor", "pointer");

			buttonStateId(id, 2);
		};

		const unhover = (id) => {
			$(sel).css("cursor", "auto");
			buttonStateId(id, 0);
		};

		$(sel)
			.on("pointerdown", (evt) => {
				evt.preventDefault();
				evt.target.releasePointerCapture(evt.pointerId);

				const id = $(evt.target).attr(`data-${dataId}`);

				buttonStateId(id, 1);
			})
			.on("pointerup keypress", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				/* Enter and space keys */
			    if (evt.type === "keypress" && evt.charCode !== 13 && evt.charCode !== 32) {
			        return
			    }

				f(id);

				buttonStateId(id, 0);

				if (evt.pointerType !== "touch") {
					hover(evt);
				}
			})
			.on("pointerover", (evt) => {
				evt.preventDefault();

				if (evt.pointerType !== "touch") {
					const id = $(evt.target).attr(`data-${dataId}`);
					hover(evt);
				}
			})
			.on("pointerleave", (evt) => {
				evt.preventDefault();

				if (evt.pointerType !== "touch") {
					const id = $(evt.target).attr(`data-${dataId}`);
					unhover(id);
				}
			});
	};

	/* Creates events for multiple buttons which are activated by
	/*     mouse click or touch tap
	/*
	/* sel: jQuery selector returning all buttons
	/* colour: colour of button when selected (border)
	/* dataId: The buttons should have a distinct data attribute data-${id}
	/*     (non-CamelCase string)
	/* f: function(id) called when button with id "id" (string) is
	/*     clicked on or toggled on.
	/*     If mandatory=false and no button is toggled,
	/*     then id="" will be passed.
	/* mandatoryId: id of initial toggled button if mandatory, "" otherwise */
	const toggleButton = (
		sel,
		dataId,
		colour=() => themeColour,
		f=() => {},
		mandatoryId="") => {

        /* state = 0: unselected */
        /* state = 1: selected */
        /* state = 2: mouse over */
        /* state = 3: mouse down */
        /* state = 4: selected and mouse over */
        /* state = 5: selected and mouse down */
		const buttonStateId = ((id, state) => {
			const $elem = $(`${sel}[data-${dataId}=${id}]`);

			const borderColour = [
                "transparent",
                colour(id),
                lightGrey,
                lightGreyFocus,
                colour(id),
                colour(id)
            ];

			const backgroundColour = [
                "#ffffff",
                "#ffffff",
                lightGrey,
                lightGreyFocus,
                lightGrey,
                lightGreyFocus
            ];

			const fontWeight = [
                "400",
                "700",
                "400",
                "400",
                "700",
                "700"
            ];

            const textColor = [
                `${mandatoryId === "" ? darkGrey : darkMediumGrey}`,
                darkGrey,
                `${mandatoryId === "" ? darkGrey : darkMediumGrey}`,
                `${mandatoryId === "" ? darkGrey : darkMediumGrey}`,
                darkGrey,
                darkGrey
            ];

            const iconColour = [
                `${mandatoryId === "" ? darkGrey : darkMediumGrey}`,
                colour(id),
                `${mandatoryId === "" ? darkGrey : darkMediumGrey}`,
                `${mandatoryId === "" ? darkGrey : darkMediumGrey}`,
                colour(id),
                colour(id)
            ];

			$elem.css({
				"border-bottom": `2px solid ${borderColour[state]}`,
				"background-color": backgroundColour[state],
                "color": textColor[state],
                "--icon-colour": iconColour[state],
                "font-weight": fontWeight[state]
			});
		});

		let toggledOnId = "";
		let touchedElem = "";

        if (mandatoryId !== "") {
            $(sel).addClass("bb-mand");
            toggledOnId = mandatoryId;
        }

		const hover = (evt) => {
			const id = $(evt.target).attr(`data-${dataId}`);

			$(sel).css("cursor", "pointer");

            buttonStateId(id, toggledOnId === id ? 4 : 2);
		};

		const unhover = (id) => {
			$(sel).css("cursor", "auto");

            buttonStateId(id, toggledOnId === id ? 1 : 0);
		};

		const toggle = (id, evt, on="") => {
			/* We cannot toggle off a button if it is mandatory */
			if (mandatoryId !== "" && toggledOnId === id) {
                buttonStateId(id, 4);
				return;
			}

			/* Toggles off previous button */
			if (toggledOnId !== "") {
				buttonStateId(toggledOnId, 0);
			}

			if ((on === "" || on) && toggledOnId !== id) {
				/* Toggle different button */
				buttonStateId(id, 4);
				toggledOnId = id;
				f(toggledOnId);
			} else {
				/* Toggle same button */
				toggledOnId = "";
				f(toggledOnId);
			}
		}

		$(sel)
			.on("pointerdown", (evt) => {
				evt.preventDefault();
				evt.target.releasePointerCapture(evt.pointerId);

				const id = $(evt.target).attr(`data-${dataId}`);
				touchedElem = evt.target.dataset[dataId];

				if (mandatoryId === "" || toggledOnId !== id) {
					buttonStateId(id, 3);
				} else {
                    buttonStateId(id, 5);
                }
			})
			.on("pointerup keypress", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				/* Enter and space keys */
			    if (evt.type === "keypress" && evt.charCode !== 13 && evt.charCode !== 32) {
			        return
			    }

				if (evt.type === "keypress" || touchedElem !== "") {
					touchedElem = "";

					toggle(id, evt);

					//$(sel).css("cursor", "auto");
					if (mandatoryId === "" && evt.pointerType !== "touch") {
						hover(evt);
					}
				}
			})
			.on("pointerover", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				if (evt.pointerType !== "touch") {
					hover(evt);
				}
			})
			.on("pointerleave", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				if (evt.pointerType !== "touch") {
					touchedElem = "";

					unhover(id);
				}
			});
	};

	/* sel: jQuery selector returning all buttons
	/* dataId: The buttons should have a distinct data attribute data-${id}
	/*     (non-CamelCase string)
	/* f: function(id) called when button with id "id" (string) is
	/*     clicked on or toggled on. */
	const hoverButton = (sel, dataId, f) => {
		const buttonStateId = ((id, state) => {
			const $elem = $(`${sel}[data-${dataId}=${id}]`);

			$elem.css({
				"background-color": ["#ffffff", lightGrey][state],
                "font-weight": ["400", "700"][state]
			});
		});

		let toggledOnId = "";

		const toggle = (id, evt, on="") => {
			/* Toggles off previous button */
			if (toggledOnId !== "") {
				buttonStateId(toggledOnId, 0);
			}

			if ((on === "" || on) && toggledOnId !== id) {
				/* Toggle different button */
				buttonStateId(id, 1);
				toggledOnId = id;
				f(toggledOnId);
			} else {
				/* Toggle same button */
				toggledOnId = "";
				f(toggledOnId);
			}
		}

		$(sel)
			.on("pointerover", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				if (evt.pointerType === "touch") {
					toggle(id, evt);
				} else if (evt.pointerType !== "touch") {
					toggle(id, evt, true);
				}
			})
			.on("pointerleave", (evt) => {
				evt.preventDefault();

				const id = $(evt.target).attr(`data-${dataId}`);

				if (evt.pointerType !== "touch") {
					toggle(id, evt, false);
				}
			});

		$(document.body).on("pointerdown pointercancel", (evt) => {
			if (evt.pointerType === "touch") {
				let id = $(evt.target).attr(`data-${dataId}`);

				/* Toggle off any buttons */
				if (toggledOnId !== "" && toggledOnId !== id) {
					id = toggledOnId;
					toggle(id, evt, false);
				}
			}
		});
	};

    const toolTipPosition = (x, y) => {
        const ttVSpace = 60;

        const $ttElem = $(".tooltip");

        /* Set in middle to measure width */
        $ttElem.css("left", "0");
        $ttElem.css("top", "0");

        let ttBox = $ttElem[0].getBoundingClientRect();

        const screenPad = 5;

        /* Ensures does not go off screen edge */
        x = Math.max(x, ttBox.width / 2 + screenPad);
        x = Math.min(x, $(window).width() - ttBox.width / 2 - screenPad);

		/* If too near bottom, puts tooltip above pointer */
		let dy = ttVSpace;
		if (y + ttVSpace + ttBox.height > $(window).scrollTop() + $(window).height()) {
			dy = -ttVSpace - ttBox.height;
		}

        $ttElem.css({
            "left": `${x - ttBox.width / 2}px`,
            "top": `${y + dy}px`
        });
    }

    $(document.body).on("pointerup pointermove", (evt) => {
        toolTipPosition(evt.originalEvent.pageX, evt.originalEvent.pageY);
    });

	/* sel: jQuery selector returning all buttons
	/* dataId: The buttons should have a distinct data attribute data-${id}
	/*     (non-CamelCase string)
	/* showTooltip: function (elem) */
	/* hideTooltip: function (elem) */
	const tooltip = (sel, dataId, showTooltip, hideTooltip) => {
		let toggledOnId = "";

		const toggle = (evt, on="") => {

			const id = $(evt.target).attr(`data-${dataId}`);

			/* Toggles off previous button */
			if (toggledOnId !== "") {
				const prevElem = $(`${sel}[data-${dataId}=${toggledOnId}]`)[0];
				hideTooltip(prevElem);
				$(".tooltip").hide();
			}

			if ((on === "" || on) && toggledOnId !== id) {
				/* Toggle different button */
				showTooltip(evt.target);
                toolTipPosition(evt.originalEvent.pageX, evt.originalEvent.pageY);

				$(".tooltip").show();
				toggledOnId = id;
			} else {
				/* Toggle same button */
				toggledOnId = "";
			}
		}

		$(sel)
			.on("pointerover", (evt) => {
				evt.preventDefault();

				if (evt.pointerType === "touch") {
					toggle(evt);
				} else if (evt.pointerType !== "touch") {
					toggle(evt, true);
				}
			})
			.on("pointerleave", (evt) => {
				evt.preventDefault();

				if (evt.pointerType !== "touch") {
					toggle(evt, false);
				}
			});

		$(document.body).on("pointerdown pointercancel", (evt) => {
			if (evt.pointerType === "touch") {
				let id = $(evt.target).attr(`data-${dataId}`);

				/* Toggle off any buttons */
				if (toggledOnId !== id) {
					id = toggledOnId;
					toggle(evt, false);
				}
			}
	    });
	};

	/* sel: jQuery selector of container which contains buttons */
	/* dataId: unique data attribute */
	/* f: function f(id) which is called when button with id "id" is toggled on ("" if all toggled off) */
	/* mandatoryId: id of initial toggled button if mandatory, "" otherwise */
	const slideBox = (
        sel,
        dataId,
        f,
        mandatoryId="") => {

        /* state = 0: unselected */
        /* state = 1: selected, mouse over */
        /* state = 2: selected, mouse not over */
		const buttonStateId = ((id, state) => {
			const $elem = $(`${sel} > *[data-${dataId}=${id}]`);

            if (mandatoryId === "") {
                $(sel).children().css({
                    "color": [darkGrey, darkMediumGrey, darkMediumGrey][state],
                });
            }

            $elem.css({
                "background-color": ["#ffffff", lightGrey, "#ffffff"][state],
                "color": [`${mandatoryId === "" ? darkGrey : darkMediumGrey}`, darkGrey, darkGrey][state],
                "font-weight": ["400", "700", "700"][state]
            });

            if (mandatoryId !== "") {
                $elem.css({
                    "border-bottom": `2px solid ${["transparent", themeColour, themeColour][state]}`
                });
            }
		});

		let slideElem = "";
		let sliding = false;

        if (mandatoryId !== "") {
            slideElem = mandatoryId;
            $(sel).children().addClass("bb-mand");
        }

		const pointerMoveHandler = (evt) => {
			const x = evt.clientX;
			const y = evt.clientY;

			$(sel).children().each((_, elem) => {
				const box = elem.getBoundingClientRect();
				if (x > box.x && x < box.x + box.width && y > box.y && y < box.y + box.height) {
					const id = $(elem).attr(`data-${dataId}`);
					if (id !== slideElem) {
						if (slideElem !== "") {
							buttonStateId(slideElem, 0);
						}
						slideElem = id;
						f(slideElem);

                        /* Show hover effects on unselected button */
						buttonStateId(slideElem, 1);
					} else {
                        /* Show hover effects on selected button */
                        buttonStateId(slideElem, 1);
                    }
				}
			});
		};

		$(sel).children().on("pointerdown pointerover", (evt) => {
			evt.preventDefault();
			if (evt.pointerType !== "touch" && evt.type === "pointerdown") {
				return;
			}

			if (!sliding) {
				$(sel)[0].setPointerCapture(evt.pointerId);

				pointerMoveHandler(evt);
				$(sel).on("pointermove", pointerMoveHandler);
				sliding = true;
			}
		});

		$(sel).on("pointerup pointerleave", (evt) => {
			evt.preventDefault();

			if (evt.pointerType !== "touch" && evt.type === "pointerup") {
				return;
			}

			if (sliding) {
				$(sel)[0].releasePointerCapture(evt.pointerId);

				if (mandatoryId === "") {
					buttonStateId(slideElem, 0);
					slideElem = "";
				} else {
    				buttonStateId(slideElem, 2);
                }

				$(sel).off("pointermove", pointerMoveHandler);
				f(slideElem);
				sliding = false;
			}
		});
	};

	return {
        shadeColour,
		clickButton,
		toggleButton,
		hoverButton,
		tooltip,
		slideBox
	};
}
