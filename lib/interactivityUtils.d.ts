import { Selection } from "d3-selection";
import { IPoint } from "powerbi-visuals-utils-svgutils";
import { ISelectionHandler } from "./interactivityService";
export declare module interactivityUtils {
    function getPositionOfLastInputEvent(): IPoint;
    function registerStandardSelectionHandler(selection: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
    function registerGroupSelectionHandler(group: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
}
