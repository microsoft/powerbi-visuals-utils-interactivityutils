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

module powerbi.extensibility.utils.interactivity {
    import IPoint = powerbi.extensibility.utils.svg.shapes.IPoint;

    export module interactivityUtils {
        export function getPositionOfLastInputEvent(): IPoint {
            return {
                x: (d3.event as MouseEvent).clientX,
                y: (d3.event as MouseEvent).clientY
            };
        }

        export function registerStandardSelectionHandler(selection: d3.Selection<any>, selectionHandler: ISelectionHandler): void {
            selection.on("click", (d: BaseDataPoint) => handleSelection(d, selectionHandler));
        }

        export function registerGroupSelectionHandler(group: d3.Selection<any>, selectionHandler: ISelectionHandler): void {
            group.on("click", () => {
                let target = (d3.event as MouseEvent).target,
                    d: BaseDataPoint = d3.select(target).datum();

                handleSelection(d, selectionHandler);
            });
        }

        function handleSelection(d: BaseDataPoint, selectionHandler: ISelectionHandler): void {
            selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
        }
    }
}
