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
import { arrayExtensions } from "powerbi-visuals-utils-typeutils";
import { AppliedFilter } from "./interfaces";

// powerbi.extensibility
import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import DataRepetitionSelector = powerbi.data.DataRepetitionSelector;
import ExtensibilityISelectionId = powerbi.extensibility.ISelectionId;
import Selector = powerbi.data.Selector;

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;

// powerbi.extensibility.utils.type
import ArrayExtensions = arrayExtensions.ArrayExtensions;

// powerbi.extensibility.utils.svg
import BoundingRect = shapesInterfaces.BoundingRect;

export interface SelectableDataPoint {
    selected: boolean;
    /** Identity for identifying the selectable data point for selection purposes */
    identity: ExtensibilityISelectionId;
    /**
     * A specific identity for when data points exist at a finer granularity than
     * selection is performed.  For example, if your data points should select based
     * only on series even if they exist as category/series intersections.
     */
    specificIdentity?: powerbi.visuals.ISelectionId;
}

/**
 * Factory method to create an IInteractivityService instance.
 */
export function createInteractivityService(hostServices: IVisualHost): IInteractivityService {
    return new InteractivityService(hostServices);
}

/**
* Creates a clear an svg rect to catch clear clicks.
*/
export function appendClearCatcher(selection: d3.Selection<any, any, any, any>): d3.Selection<any, any, any, any> {
    return selection
        .append("rect")
        .classed("clearCatcher", true)
        .attr("width", "100%")
        .attr("height", "100%" );
}

export function dataHasSelection(data: SelectableDataPoint[]): boolean {
    for (let i = 0, ilen = data.length; i < ilen; i++) {
        if (data[i].selected)
            return true;
    }
    return false;
}

export interface IInteractiveBehavior {
    bindEvents(behaviorOptions: any, selectionHandler: ISelectionHandler): void;
    renderSelection(hasSelection: boolean): void;

    hoverLassoRegion?(e: MouseEvent, rect: BoundingRect): void;
    lassoSelect?(e: MouseEvent, rect: BoundingRect): void;
}

/**
 * An optional options bag for binding to the interactivityService
 */
export interface InteractivityServiceOptions {
    isLegend?: boolean;
    isLabels?: boolean;
    overrideSelectionFromData?: boolean;
    hasSelectionOverride?: boolean;
}

/**
 * Responsible for managing interactivity between the hosting visual and its peers
 */
export interface IInteractivityService {
    /** Binds the visual to the interactivityService */
    bind(dataPoints: SelectableDataPoint[], behavior: IInteractiveBehavior, behaviorOptions: any, iteractivityServiceOptions?: InteractivityServiceOptions);

    /** Clears the selection */
    clearSelection(): void;

    /** Sets the selected state on the given data points. */
    applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean;

    /** Checks whether there is at least one item selected */
    hasSelection(): boolean;

    /** Checks whether there is at least one item selected within the legend */
    legendHasSelection(): boolean;

    /** Checks whether the selection mode is inverted or normal */
    isSelectionModeInverted(): boolean;

    /** Apply new selections to change internal state of interactivity service */
    restoreSelection(selectionIds: ISelectionId[]): void;
}

export interface ISelectionHandler {
    /**
     * Handles a selection event by selecting the given data point.  If the data point's
     * identity is undefined, the selection state is cleared. In this case, if specificIdentity
     * exists, it will still be sent to the host.
     */
    handleSelection(dataPoints: SelectableDataPoint | SelectableDataPoint[], multiSelect: boolean): void;

    /** Handles a selection clear, clearing all selection state */
    handleClearSelection(): void;

    /**
     * Sends the selection state to the host
     */
    applySelectionFilter(): void;
}

export interface IExtensibilityMeasuredSelecionId extends ExtensibilityISelectionId {
    dataMap: SelectorsForColumn;
    measures: string[];
    getSelector(): Selector;
}
 export interface IMeasuredSelectionId extends ISelectionId {
    dataMap: SelectorsForColumn;
    measures: string[];
    compareMetadata(currentDataMap: SelectorsForColumn, otherDataMap: SelectorsForColumn): boolean;
    compareMeasures(currentMeasures: string[], otherMeasures: string[]): boolean;
}
 export interface SelectorsForColumn {
    [queryName: string]: DataRepetitionSelector[];
}
 // It's a temporary function for compatibility with API 2.1
// It will probably be removed after API 2.2 release
export function checkDatapointAgainstSelectedIds(dataPoint: SelectableDataPoint, selectedIds: ISelectionId[]) {
    return selectedIds.some((selectionId) => {
        const measuredSelectionId: IMeasuredSelectionId = selectionId as IMeasuredSelectionId;
        const otherSelectionId: IExtensibilityMeasuredSelecionId = dataPoint.identity as IExtensibilityMeasuredSelecionId;
        // if the first selectionId is built only from measures then compare measures
        if (!measuredSelectionId.dataMap && measuredSelectionId.compareMeasures(measuredSelectionId.measures, otherSelectionId.measures)) {
            return true;
        }

        const selectorOne = measuredSelectionId.getSelector();
        const selectorTwo = otherSelectionId.getSelector();
            // if the first or the second selectionId doesn't have data then return false
        if (!(<any>selectorOne).data || !(<any>selectorTwo).data) {
            return false;
        }
            // At this point both CVSelectionId's got data, we see if the first selectionId data is a subset of the second selectionId data, if not return false
        for (const dataRepition of (<any>selectorOne).data) {
            if (!(<any>selectorTwo).data.some(dataI => JSON.stringify(dataI) === JSON.stringify(dataRepition))) {
                return false;
            }
        }

        return true;
    });
}

export class InteractivityService implements IInteractivityService, ISelectionHandler {
    private selectionManager: ISelectionManager;

    // References
    private renderSelectionInVisual = () => { };
    private renderSelectionInLegend = () => { };
    private renderSelectionInLabels = () => { };

    // Selection state
    private selectedIds: ISelectionId[] = [];
    private isInvertedSelectionMode: boolean = false;
    public selectableDataPoints: SelectableDataPoint[];
    public selectableLegendDataPoints: SelectableDataPoint[];
    public selectableLabelsDataPoints: SelectableDataPoint[];

    constructor(hostServices: IVisualHost) {
        this.selectionManager = hostServices.createSelectionManager();

        if (this.selectionManager.registerOnSelectCallback) {
            this.selectionManager.registerOnSelectCallback(() => {
                this.restoreSelection([...this.selectionManager.getSelectionIds() as ISelectionId[]]);
            });
        }
    }

    // IInteractivityService Implementation
    /** Binds the visual to the interactivityService */
    public bind(dataPoints: SelectableDataPoint[], behavior: IInteractiveBehavior, behaviorOptions: any, options?: InteractivityServiceOptions): void {
        // Bind the data
        if (options && options.overrideSelectionFromData) {
            // Override selection state from data points if needed
            this.takeSelectionStateFromDataPoints(dataPoints);
        }

        if (options) {
            if (options.isLegend) {
                // Bind to legend data instead of normal data if isLegend
                this.selectableLegendDataPoints = dataPoints;
                this.renderSelectionInLegend = () => behavior.renderSelection(this.legendHasSelection());
            }
            else if (options.isLabels) {
                // Bind to label data instead of normal data if isLabels
                this.selectableLabelsDataPoints = dataPoints;
                this.renderSelectionInLabels = () => behavior.renderSelection(this.labelsHasSelection());
            }
            else {
                this.selectableDataPoints = dataPoints;
                this.renderSelectionInVisual = () => behavior.renderSelection(this.hasSelection());
            }
        }
        else {
            this.selectableDataPoints = dataPoints;
            this.renderSelectionInVisual = () => behavior.renderSelection(this.hasSelection());
        }

        behavior.bindEvents(behaviorOptions, this);
        // Sync data points with current selection state
        this.syncSelectionState();
    }

    private clearSelectedIds(): void {
        ArrayExtensions.clear(this.selectedIds);
    }

    /**
     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
     */
    public clearSelection(): void {
        this.clearSelectedIds();
        this.applyToAllSelectableDataPoints((dataPoint: SelectableDataPoint) => dataPoint.selected = false);
        this.renderAll();
    }

    public applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean {
        if (hasHighlights && this.hasSelection()) {
            let selectionIds: ISelectionId[] = (this.selectionManager.getSelectionIds() || []) as ISelectionId[];

            ArrayExtensions.clear(this.selectedIds);
            ArrayExtensions.clear(selectionIds);
        }

        for (let dataPoint of dataPoints) {
            dataPoint.selected = checkDatapointAgainstSelectedIds(dataPoint, this.selectedIds);
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

    public legendHasSelection(): boolean {
        return this.selectableLegendDataPoints ? dataHasSelection(this.selectableLegendDataPoints) : false;
    }

    public labelsHasSelection(): boolean {
        return this.selectableLabelsDataPoints ? dataHasSelection(this.selectableLabelsDataPoints) : false;
    }

    public isSelectionModeInverted(): boolean {
        return this.isInvertedSelectionMode;
    }

    // ISelectionHandler Implementation
    public applySelectionFilter(): void {
        if (!this.selectionManager) {
            return;
        }

        this.selectionManager.applySelectionFilter();
    }

    public handleSelection(dataPoints: SelectableDataPoint | SelectableDataPoint[], multiSelect: boolean): void {
        // defect 7067397: should not happen so assert but also don't continue as it's
        // causing a lot of error telemetry in desktop.
        if (!dataPoints) {
            return;
        }

        this.select(dataPoints, multiSelect);
        this.sendSelectionToHost();
        this.renderAll();
    }

    public handleClearSelection(): void {
        this.clearSelection();
        this.sendSelectionToHost();
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
            InteractivityService.updateSelectableDataPointsBySelectedIds(this.selectableDataPoints, this.selectedIds);
        }

        if (this.selectableLegendDataPoints) {
            InteractivityService.updateSelectableDataPointsBySelectedIds(this.selectableLegendDataPoints, this.selectedIds);
        }

        if (this.selectableLabelsDataPoints) {
            for (let labelsDataPoint of this.selectableLabelsDataPoints) {
                labelsDataPoint.selected = this.selectedIds.some((value: ISelectionId) => {
                    return value.includes(labelsDataPoint.identity as ISelectionId);
                });
            }
        }
    }

    private syncSelectionStateInverted(): void {
        let selectedIds = this.selectedIds;
        let selectableDataPoints = this.selectableDataPoints;
        if (!selectableDataPoints)
            return;

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

    // Private utility methods
    private renderAll(): void {
        this.renderSelectionInVisual();
        this.renderSelectionInLegend();
        this.renderSelectionInLabels();
    }

    /** Marks a data point as selected and syncs selection with the host. */
    private select(dataPoints: SelectableDataPoint | SelectableDataPoint[], multiSelect: boolean): void {
        const selectableDataPoints: SelectableDataPoint[] = [].concat(dataPoints);

        const originalSelectedIds = [...this.selectedIds];

        if (!multiSelect || !selectableDataPoints.length) {
            this.clearSelectedIds();
        }

        selectableDataPoints.forEach((dataPoint: SelectableDataPoint) => {
            const shouldDataPointBeSelected: boolean = !checkDatapointAgainstSelectedIds(dataPoint, originalSelectedIds);

            this.selectSingleDataPoint(dataPoint, shouldDataPointBeSelected);
        });

        this.syncSelectionState();
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

            if (toRemove.includes(currentId))
                selectedIds.splice(i, 1);
        }
    }

    private sendSelectionToHost() {
        if (!this.selectionManager) {
            return;
        }

        if (this.selectedIds && this.selectedIds.length) {
            this.selectionManager.select([...this.selectedIds]);
        } else {
            this.selectionManager.clear();
        }
    }

    private takeSelectionStateFromDataPoints(dataPoints: SelectableDataPoint[]): void {
        let selectedIds: ISelectionId[] = this.selectedIds;

        // Replace the existing selectedIds rather than merging.
        ArrayExtensions.clear(selectedIds);

        for (let dataPoint of dataPoints) {
            if (dataPoint.selected) {
                selectedIds.push(dataPoint.identity as ISelectionId);
            }
        }
    }

    private applyToAllSelectableDataPoints(action: (selectableDataPoint: SelectableDataPoint) => void) {
        let selectableDataPoints = this.selectableDataPoints;
        let selectableLegendDataPoints = this.selectableLegendDataPoints;
        let selectableLabelsDataPoints = this.selectableLabelsDataPoints;
        if (selectableDataPoints) {
            for (let dataPoint of selectableDataPoints) {
                action(dataPoint);
            }
        }

        if (selectableLegendDataPoints) {
            for (let dataPoint of selectableLegendDataPoints) {
                action(dataPoint);
            }
        }

        if (selectableLabelsDataPoints) {
            for (let dataPoint of selectableLabelsDataPoints) {
                action(dataPoint);
            }
        }
    }

    private static updateSelectableDataPointsBySelectedIds(selectableDataPoints: SelectableDataPoint[], selectedIds: ISelectionId[]): boolean {
        let foundMatchingId = false;

        for (let dataPoint of selectableDataPoints) {
            dataPoint.selected = checkDatapointAgainstSelectedIds(dataPoint, selectedIds);

            if (dataPoint.selected)
                foundMatchingId = true;
        }

        return foundMatchingId;
    }

    private removeSelectionIdsWithOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => identity.hasIdentity());
    }

    private removeSelectionIdsExceptOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => !identity.hasIdentity());
    }
}