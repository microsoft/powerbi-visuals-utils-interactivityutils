import { Selection } from "d3-selection";
import { shapesInterfaces } from "powerbi-visuals-utils-svgutils";
import { ISelectionHandler } from "./interactivityService";
import IPoint = shapesInterfaces.IPoint;
export declare function getPositionOfLastInputEvent(): IPoint;
export declare function registerStandardSelectionHandler(selection: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
export declare function registerGroupSelectionHandler(group: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
