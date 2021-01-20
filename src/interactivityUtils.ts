/*
*  Power BI Visualizations
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

import { shapesInterfaces } from "powerbi-visuals-utils-svgutils";
import { select, Selection, BaseType } from "d3-selection";
import { ISelectionHandler } from "./interactivityBaseService";
import { SelectableDataPoint } from "./interactivitySelectionService";

import IPoint = shapesInterfaces.IPoint;
//!!!!Seems unused
export function getPositionOfLastInputEvent(): IPoint {
    return {
        x: (<MouseEvent>event).clientX,
        y: (<MouseEvent>event).clientY
    };
}
//!!!!Seems unused
export function registerStandardSelectionHandler(selection: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void {
    selection.on("click", (event, d: SelectableDataPoint) => handleSelection(d, selectionHandler, event));
}
//!!!!Seems unused
export function registerGroupSelectionHandler(group: Selection<any, any, any, any>, selectionHandler: ISelectionHandler): void {
    group.on("click", (event) => {
        let target: EventTarget = (<MouseEvent>event).target,
            d: SelectableDataPoint = <SelectableDataPoint>select(<BaseType>target).datum();

        handleSelection(d, selectionHandler, event);
    });
}

function handleSelection(d: SelectableDataPoint, selectionHandler: ISelectionHandler, event?): void {
    selectionHandler.handleSelection(d, (<MouseEvent>event).ctrlKey);
}