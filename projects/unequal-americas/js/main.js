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

const importedData = importData();
let regionNames = importedData[0];
let regionDist = importedData[1];

const NS = "http://www.w3.org/2000/svg";

const init = (() => {
    console.log(regionNames, regionDist);
})();

});
