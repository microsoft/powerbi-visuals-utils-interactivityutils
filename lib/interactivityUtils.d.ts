import { shapesInterfaces } from "powerbi-visuals-utils-svgutils";
import * as d3 from "d3";
import { ISelectionHandler } from "./interactivityService";
import IPoint = shapesInterfaces.IPoint;
export declare function getPositionOfLastInputEvent(): IPoint;
export declare function registerStandardSelectionHandler(selection: d3.Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
export declare function registerGroupSelectionHandler(group: d3.Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void;
