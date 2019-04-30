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
    import ExtensibilityISelectionId = powerbi.extensibility.ISelectionId;
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;
    import ISelectionManager = powerbi.extensibility.ISelectionManager;
    import ArrayExtensions = powerbi.extensibility.utils.type.ArrayExtensions;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    export interface SelectableDataPoint extends BaseDataPoint  {
        /** Identity for identifying the selectable data point for selection purposes */
        identity: ExtensibilityISelectionId;
        /**
         * A specific identity for when data points exist at a finer granularity than
         * selection is performed.  For example, if your data points should select based
         * only on series even if they exist as category/series intersections.
         */
        specificIdentity?: ExtensibilityISelectionId;
    }

    export class InteractivitySelectionService extends InteractivityBaseService<SelectableDataPoint, IBehaviorOptions<SelectableDataPoint>> implements IInteractivityService<SelectableDataPoint>, ISelectionHandler {
        private selectionManager: ISelectionManager;

        constructor(hostServices: IVisualHost) {
            super();
            this.selectionManager = hostServices.createSelectionManager();

            if (this.selectionManager.registerOnSelectCallback) {
                // when selecton was updated on Power BI side need to display actual selection state on the visual
                this.selectionManager.registerOnSelectCallback(() => {
                    this.restoreSelection();
                });
            }
        }

        /**
         * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
         */
        public clearSelection(): void {
            this.selectionManager.clear();
            super.clearSelection();
        }

        public applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean {
            if (hasHighlights && this.hasSelection()) {
                this.selectionManager.clear();
            }

            const selectedIds: ISelectionId[] = this.selectionManager.getSelectionIds() as ISelectionId[];
            for (let dataPoint of dataPoints) {
                dataPoint.selected = this.isDataPointSelected(dataPoint, selectedIds);
            }

            return this.hasSelection();
        }

        /**
         * Apply new selections to change internal state of interactivity service
         */
        public restoreSelection() {
            // syncSelectionState gets actual selectedIds
            // from selection manager and updates selectable datapoints state to correspond state
            this.syncSelectionState();
            // render new state of selection
            this.renderAll();
        }

        /**
         * Checks whether there is at least one item selected.
         */
        public hasSelection(): boolean {
            return this.selectionManager.getSelectionIds().length > 0;
        }

        /**
         * Syncs the selection state for all data points that have the same category. Returns
         * true if the selection state was out of sync and corrections were made; false if
         * the data is already in sync with the service.
         *
         * If the data is not compatible with the current service's current selection state,
         * the state is cleared and the cleared selection is sent to the host.
         *
         * Ignores series for now, since we don't support series selection at the moment.
         */
        public syncSelectionState(): void {
            if (this.isInvertedSelectionMode) {
                return this.syncSelectionStateInverted();
            }

            if (!this.selectableDataPoints && !this.selectableLegendDataPoints) {
                return;
            }

            // get current state of selections from selection manager
            const selectedIds: ISelectionId[] = this.selectionManager.getSelectionIds() as ISelectionId[];
            if (this.selectableDataPoints) {
                // update datapoints (set selection state for datapoint, update `selected` property of datapoint)
                this.updateSelectableDataPointsBySelectedIds(this.selectableDataPoints, selectedIds);
            }

            if (this.selectableLegendDataPoints) {
                // update datapoints for legend datapoint (set selection state for datapoint, update `selected` property of datapoint)
                this.updateSelectableDataPointsBySelectedIds(this.selectableLegendDataPoints, selectedIds);
            }

            if (this.selectableLabelsDataPoints) {
                // update datapoints for label datapoints
                for (let labelsDataPoint of this.selectableLabelsDataPoints) {
                    labelsDataPoint.selected = selectedIds.some((value: ISelectionId) => {
                        return value.includes(labelsDataPoint.identity as ISelectionId);
                    });
                }
            }
        }

        /** Marks a data point as selected and syncs selection with the host. */
        protected select(dataPoints: SelectableDataPoint | SelectableDataPoint[], multiSelect: boolean): void {
            const selectableDataPoints: SelectableDataPoint[] = [].concat(dataPoints);
            const originalSelectedIds = [...this.selectionManager.getSelectionIds() as ISelectionId[]];

            if (!multiSelect || !selectableDataPoints.length) {
                // if multiselect isn't active need to reset curent selections
                // or clear selection by passing empty array of selection in dataPoints parameter
                this.selectionManager.clear();
            }

            // array of selection of selected datapoints
            const selectionIdsToSelect: ISelectionId[] = [];

            selectableDataPoints.forEach((dataPoint: SelectableDataPoint) => {
                if (!dataPoint || !dataPoint.identity) {
                    return;
                }
                const shouldDataPointBeSelected: boolean = !this.isDataPointSelected(dataPoint, originalSelectedIds);
                // update state of datapoint, set as selected and acumulate selectionId in temp array
                if (shouldDataPointBeSelected) {
                    dataPoint.selected = true;
                    selectionIdsToSelect.push(dataPoint.identity as ISelectionId);
                } else {
                    // set selection as false if datapoint isn't selected
                    dataPoint.selected = false;
                    if (multiSelect) {
                        selectionIdsToSelect.push(dataPoint.identity as ISelectionId);
                    }
                }
            });
            // if multiselect isn't active selection manager resets current state of selection and applies new selections
            this.selectionManager.select(selectionIdsToSelect, multiSelect);

            this.syncSelectionState();
        }

        protected takeSelectionStateFromDataPoints(dataPoints: SelectableDataPoint[]): void {
            const selectedIds: ISelectionId[] = this.selectionManager.getSelectionIds() as ISelectionId[];

            // Replace the existing selectedIds rather than merging.
            ArrayExtensions.clear(selectedIds);

            for (let dataPoint of dataPoints) {
                if (dataPoint.selected) {
                    selectedIds.push(dataPoint.identity as ISelectionId);
                }
            }
        }

        protected sendSelectionToHost(): void {
            return;
        }

        private syncSelectionStateInverted(): void {
            let selectedIds = this.selectionManager.getSelectionIds();
            let selectableDataPoints = this.selectableDataPoints;
            if (!selectableDataPoints) {
                return;
            }

            if (selectedIds.length === 0) {
                for (let dataPoint of selectableDataPoints) {
                    dataPoint.selected = false;
                }
            }
            else {
                for (let dataPoint of selectableDataPoints) {
                    if (selectedIds.some((value: ISelectionId) => value.includes(dataPoint.identity as ISelectionId))) {
                        dataPoint.selected = true;
                    }
                    else if (dataPoint.selected) {
                        dataPoint.selected = false;
                    }
                }
            }
        }

        private updateSelectableDataPointsBySelectedIds(selectableDataPoints: SelectableDataPoint[], selectedIds: ISelectionId[]): boolean {
            let foundMatchingId = false;

            for (let dataPoint of selectableDataPoints) {
                dataPoint.selected = this.isDataPointSelected(dataPoint, selectedIds);

                if (dataPoint.selected)
                    foundMatchingId = true;
            }

            return foundMatchingId;
        }

        private isDataPointSelected(dataPoint: SelectableDataPoint, selectedIds: ISelectionId[]): boolean {
            return selectedIds.some((value: ISelectionId) => value.includes(dataPoint.identity as ISelectionId));
        }
    }

    /**
     * Factory method to create an IInteractivityService instance.
     */
    export function createInteractivitySelectionService(hostServices: IVisualHost): IInteractivityService<SelectableDataPoint> {
        return new InteractivitySelectionService(hostServices);
    }

}