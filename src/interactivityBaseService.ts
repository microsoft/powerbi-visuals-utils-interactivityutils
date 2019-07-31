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

export interface BaseDataPoint {
    selected: boolean;
}

export enum FilterAction {
    merge,
    remove
}

/**
* Creates a clear an svg rect to catch clear clicks.
*/
export function appendClearCatcher(selection: d3.Selection<any, any, any, any>): d3.Selection<any, any, any, any> {
    return selection
        .append("rect")
        .classed("clearCatcher", true)
        .attr("width", "100%")
        .attr("height", "100%");
}

export function dataHasSelection(data: BaseDataPoint[]): boolean {
    for (let i = 0, ilen = data.length; i < ilen; i++) {
        if (data[i].selected) {
            return true;
        }
    }
    return false;
}

export interface IInteractiveBehavior {
    bindEvents(behaviorOptions: IBehaviorOptions<BaseDataPoint>, selectionHandler: ISelectionHandler): void;
    renderSelection(hasSelection: boolean): void;
}

/**
 * An optional options bag for binding to the interactivityService
 */
export interface InteractivityServiceOptions {
    isLegend?: boolean;
    isLabels?: boolean;
    overrideSelectionFromData?: boolean;
}

/**
 * Responsible for managing interactivity between the hosting visual and its peers
 */
export interface IInteractivityService<SelectableDataPointType extends BaseDataPoint> {
    /** Binds the visual to the interactivityService */
    bind(options: IBehaviorOptions<SelectableDataPointType>): void;

    /** Clears the selection */
    clearSelection(): void;

    /** Sets the selected state on the given data points. */
    applySelectionStateToData(dataPoints: SelectableDataPointType[], hasHighlights?: boolean): boolean;

    /** Checks whether there is at least one item selected */
    hasSelection(): boolean;

    /** Checks whether there is at least one item selected within the legend */
    legendHasSelection(): boolean;

    /** Checks whether the selection mode is inverted or normal */
    isSelectionModeInverted(): boolean;
}

export interface ISelectionHandler {
    /**
     * Handles a selection event by selecting the given data point.  If the data point's
     * identity is undefined, the selection state is cleared. In this case, if specificIdentity
     * exists, it will still be sent to the host.
     */
    handleSelection(dataPoints: BaseDataPoint | BaseDataPoint[], multiSelect: boolean): void;

    /** Handles a selection clear, clearing all selection state */
    handleClearSelection(): void;
    /** Handles a context menu click (right button click on element) */
    handleContextMenu(dataPoint: BaseDataPoint, point: powerbi.extensibility.IPoint): void;
}

export interface IBehaviorOptions<SelectableDataPointType extends BaseDataPoint> {
    behavior: IInteractiveBehavior;
    dataPoints: SelectableDataPointType[];
    interactivityServiceOptions?: InteractivityServiceOptions;
}

export abstract class InteractivityBaseService
    <SelectableDataPointType extends BaseDataPoint,
    IBehaviorOptionsType extends IBehaviorOptions<SelectableDataPointType>>
    implements IInteractivityService<SelectableDataPointType>, ISelectionHandler {

    // References
    protected renderSelectionInVisual = () => { };
    protected renderSelectionInLegend = () => { };
    protected renderSelectionInLabels = () => { };

    // Selection state
    protected isInvertedSelectionMode: boolean = false;

    public selectableDataPoints: SelectableDataPointType[];
    public selectableLegendDataPoints: SelectableDataPointType[];
    public selectableLabelsDataPoints: SelectableDataPointType[];

    // IInteractivityService Implementation

    /** Binds the visual to the interactivityService */
    public bind(options: IBehaviorOptionsType): void {
        // Bind the data
        if (options.interactivityServiceOptions && options.interactivityServiceOptions.overrideSelectionFromData) {
            // Override selection state from data points if needed
            this.takeSelectionStateFromDataPoints(options.dataPoints);
        }

        if (options.interactivityServiceOptions) {
            if (options.interactivityServiceOptions.isLegend) {
                // Bind to legend data instead of normal data if isLegend
                this.selectableLegendDataPoints = options.dataPoints;
                this.renderSelectionInLegend = () => options.behavior.renderSelection(this.legendHasSelection());
            } else if (options.interactivityServiceOptions.isLabels) {
                // Bind to label data instead of normal data if isLabels
                this.selectableLabelsDataPoints = options.dataPoints;
                this.renderSelectionInLabels = () => options.behavior.renderSelection(this.labelsHasSelection());
            } else {
                this.selectableDataPoints = options.dataPoints;
                this.renderSelectionInVisual = () => options.behavior.renderSelection(this.hasSelection());
            }
        }
        else {
            this.selectableDataPoints = options.dataPoints;
            this.renderSelectionInVisual = () => options.behavior.renderSelection(this.hasSelection());
        }

        options.behavior.bindEvents(options, this);
        // Sync data points with current selection state
        this.syncSelectionState();
    }

    public abstract applySelectionStateToData(dataPoints: SelectableDataPointType[], hasHighlights?: boolean): boolean;

    /**
     * Checks whether there is at least one item selected.
     */
    public abstract hasSelection(): boolean;

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
    public abstract syncSelectionState(): void;

    /**
     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
     */
    public clearSelection(): void {
        this.applyToAllSelectableDataPoints((dataPoint: SelectableDataPointType) => dataPoint.selected = false);
        this.renderAll();
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

    public handleSelection(dataPoints: SelectableDataPointType | SelectableDataPointType[], multiSelect: boolean): void {
        if (!dataPoints) {
            return;
        }

        this.select(dataPoints, multiSelect);
        this.sendSelectionToHost();
        this.renderAll();
    }

    public handleContextMenu(dataPoint: SelectableDataPointType, point: powerbi.extensibility.IPoint): void {
        // don't need to handle context menu here.
        // see InteractivitySelectionService class
        return;
    }

    public handleClearSelection(): void {
        this.clearSelection();
        this.sendSelectionToHost();
    }

    protected abstract select(dataPoints: SelectableDataPointType | SelectableDataPointType[], multiSelect: boolean): void;

    protected abstract takeSelectionStateFromDataPoints(dataPoints: SelectableDataPointType[]): void;

    protected abstract sendSelectionToHost(): void;

    protected renderAll(): void {
        this.renderSelectionInVisual();
        this.renderSelectionInLegend();
        this.renderSelectionInLabels();
    }

    protected applyToAllSelectableDataPoints(action: (selectableDataPoint: SelectableDataPointType) => void) {
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
}
