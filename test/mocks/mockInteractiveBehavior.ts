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

/// <reference path="../_references.ts" />

module powerbi.extensibility.utils.interactivity.test.mocks {
    // powerbi.extensibility.utils.interactivity
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;

    export class MockBehavior implements IInteractiveBehavior {
        private selectableDataPoints: SelectableDataPoint[];
        private selectionHandler: ISelectionHandler;

        constructor(selectableDataPoints: SelectableDataPoint[]) {
            this.selectableDataPoints = selectableDataPoints;
        }

        public bindEvents(options: any, selectionHandler: ISelectionHandler): void {
            this.selectionHandler = selectionHandler;
        }

        /**
         * Stub method to spy on.
         */
        public renderSelection(hasSelection: boolean): void { }

        public selectIndex(index: number, multiSelect?: boolean): void {
            this.selectionHandler.handleSelection(this.selectableDataPoints[index], !!multiSelect);
        }

        public select(datapoint: SelectableDataPoint, multiSelect?: boolean): void {
            this.selectionHandler.handleSelection(datapoint, !!multiSelect);
        }

        public clear(): void {
            this.selectionHandler.handleClearSelection();
        }

        public selectIndexAndPersist(index: number, multiSelect?: boolean): void {
            this.selectionHandler.handleSelection(this.selectableDataPoints[index], !!multiSelect);
        }

        public verifyCleared(): boolean {
            let selectableDataPoints = this.selectableDataPoints;

            for (let i = 0, ilen = selectableDataPoints.length; i < ilen; i++) {
                if (selectableDataPoints[i].selected)
                    return false;
            }

            return true;
        }

        public verifySingleSelectedAt(index: number): boolean {
            return this.selectableDataPoints[index].selected;
        }

        public verifySelectionState(selectionState: boolean[]): boolean {
            let selectableDataPoints = this.selectableDataPoints;

            for (let i = 0, ilen = selectableDataPoints.length; i < ilen; i++) {
                if (selectableDataPoints[i].selected !== selectionState[i])
                    return false;
            }
            return true;
        }

        public selections(): boolean[] {
            let selectableDataPoints = this.selectableDataPoints,
                selections: boolean[] = [];

            for (let dataPoint of selectableDataPoints) {
                selections.push(!!dataPoint.selected);
            }

            return selections;
        }
    }
}
