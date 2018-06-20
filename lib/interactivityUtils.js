import * as d3 from "d3";
const getEvent = () => require("d3").event;
export function getPositionOfLastInputEvent() {
    return {
        x: event.clientX,
        y: event.clientY
    };
}
export function registerStandardSelectionHandler(selection, selectionHandler) {
    selection.on("click", (d) => handleSelection(d, selectionHandler));
}
export function registerGroupSelectionHandler(group, selectionHandler) {
    group.on("click", () => {
        let target = event.target, d = d3.select(target).datum();
        handleSelection(d, selectionHandler);
    });
}
function handleSelection(d, selectionHandler) {
    selectionHandler.handleSelection(d, getEvent().ctrlKey);
}
//# sourceMappingURL=interactivityUtils.js.map