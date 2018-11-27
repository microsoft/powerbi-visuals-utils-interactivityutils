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

import powerbi from "powerbi-visuals-api";
import ExtensibilityISelectionId = powerbi.extensibility.ISelectionId;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
// powerbi.extensibility.utils.type
import { arrayExtensions } from "powerbi-visuals-utils-typeutils";
import ArrayExtensions = arrayExtensions.ArrayExtensions;

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;

import {
    IBehaviorOptions,
    BaseDataPoint,
    InteractivityBaseService,
    IInteractivityService,
    ISelectionHandler
} from "./interactivityBaseService";

export interface SelectableDataPoint extends BaseDataPoint {
    /** Identity for identifying the selectable data point for selection purposes */
    identity: ExtensibilityISelectionId;
    /**
     * A specific identity for when data points exist at a finer granularity than
     * selection is performed.  For example, if your data points should select based
     * only on series even if they exist as category/series intersections.
     */
    specificIdentity?: ExtensibilityISelectionId;
}

export class InteractivitySelectionService extends InteractivityBaseService<SelectableDataPoint, IBehaviorOptions<SelectableDataPoint>> implements IInteractivityService<SelectableDataPoint>, ISelectionHandler  {
    private selectionManager: ISelectionManager;
    private selectedIds: ISelectionId[] = [];

    constructor(hostServices: IVisualHost) {
        super();
        this.selectionManager = hostServices.createSelectionManager();

        if (this.selectionManager.registerOnSelectCallback) {
            this.selectionManager.registerOnSelectCallback(() => {
                this.restoreSelection([...this.selectionManager.getSelectionIds() as ISelectionId[]]);
            });
        }
    }

    /**
     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
     */
    public clearSelection(): void {
        ArrayExtensions.clear(this.selectedIds);
        super.clearSelection();
    }

    public applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean {
        if (hasHighlights && this.hasSelection()) {
            let selectionIds: ISelectionId[] = (this.selectionManager.getSelectionIds() || []) as ISelectionId[];

            ArrayExtensions.clear(this.selectedIds);
            ArrayExtensions.clear(selectionIds);
        }

        for (let dataPoint of dataPoints) {
            dataPoint.selected = this.isDataPointSelected(dataPoint, this.selectedIds);
        }

        return this.hasSelection();
    }

    /**
     * Apply new selections to change internal state of interactivity service
     */
    public restoreSelection(selectionIds: ISelectionId[]) {
        this.clearSelection();
        this.selectedIds = selectionIds;
        this.syncSelectionState();
        this.renderAll();
    }

    /**
     * Checks whether there is at least one item selected.
     */
    public hasSelection(): boolean {
        return this.selectedIds.length > 0;
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

        if (this.selectableDataPoints) {
            this.updateSelectableDataPointsBySelectedIds(this.selectableDataPoints, this.selectedIds);
        }

        if (this.selectableLegendDataPoints) {
            this.updateSelectableDataPointsBySelectedIds(this.selectableLegendDataPoints, this.selectedIds);
        }

        if (this.selectableLabelsDataPoints) {
            for (let labelsDataPoint of this.selectableLabelsDataPoints) {
                labelsDataPoint.selected = this.selectedIds.some((value: ISelectionId) => {
                    return value.includes(labelsDataPoint.identity as ISelectionId);
                });
            }
        }
    }

    /** Marks a data point as selected and syncs selection with the host. */
    protected select(dataPoints: SelectableDataPoint | SelectableDataPoint[], multiSelect: boolean): void {
        const selectableDataPoints: SelectableDataPoint[] = [].concat(dataPoints);
        const originalSelectedIds = [...this.selectedIds];

        if (!multiSelect || !selectableDataPoints.length) {
            ArrayExtensions.clear(this.selectedIds);
        }

        selectableDataPoints.forEach((dataPoint: SelectableDataPoint) => {
            const shouldDataPointBeSelected: boolean = !this.isDataPointSelected(dataPoint, originalSelectedIds);
            this.selectSingleDataPoint(dataPoint, shouldDataPointBeSelected);
        });

        this.syncSelectionState();
    }

    protected takeSelectionStateFromDataPoints(dataPoints: SelectableDataPoint[]): void {
        let selectedIds: ISelectionId[] = this.selectedIds;

        // Replace the existing selectedIds rather than merging.
        ArrayExtensions.clear(selectedIds);

        for (let dataPoint of dataPoints) {
            if (dataPoint.selected) {
                selectedIds.push(dataPoint.identity as ISelectionId);
            }
        }
    }

    protected sendSelectionToHost(): void {
        if (!this.selectionManager) {
            return;
        }

        if (this.selectedIds && this.selectedIds.length) {
            this.selectionManager.select([...this.selectedIds]);
        } else {
            this.selectionManager.clear();
        }
    }

    private syncSelectionStateInverted(): void {
        let selectedIds = this.selectedIds;
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

    private selectSingleDataPoint(dataPoint: SelectableDataPoint, shouldDataPointBeSelected: boolean): void {
        if (!dataPoint || !dataPoint.identity) {
            return;
        }

        const identity: ISelectionId = dataPoint.identity as ISelectionId;

        if (shouldDataPointBeSelected) {
            dataPoint.selected = true;
            this.selectedIds.push(identity);
            if (identity.hasIdentity()) {
                this.removeSelectionIdsWithOnlyMeasures();
            }
            else {
                this.removeSelectionIdsExceptOnlyMeasures();
            }
        }
        else {
            dataPoint.selected = false;
            this.removeId(identity);
        }
    }

    private removeId(toRemove: ISelectionId): void {
        let selectedIds = this.selectedIds;
        for (let i = selectedIds.length - 1; i > -1; i--) {
            let currentId = selectedIds[i];

            if (toRemove.includes(currentId)) {
                selectedIds.splice(i, 1);
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

    private removeSelectionIdsWithOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => identity.hasIdentity());
    }

    private removeSelectionIdsExceptOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => !identity.hasIdentity());
    }

}

/**
 * Factory method to create an IInteractivityService instance.
 */
export function createInteractivitySelectionService(hostServices: IVisualHost): IInteractivityService<SelectableDataPoint> {
    return new InteractivitySelectionService(hostServices);
}