import { Selection } from "d3-selection";
import { IPoint } from "powerbi-visuals-utils-svgutils";
import { ISelectionHandler } from "./interactivityService";
export declare function getPositionOfLastInputEvent(): IPoint;
export declare function registerStandardSelectionHandler(selection: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
export declare function registerGroupSelectionHandler(group: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
