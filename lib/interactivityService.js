import { arrayExtensions } from "powerbi-visuals-utils-typeutils";
import { FilterManager } from "./filtermanager";
// powerbi.extensibility.utils.type
var ArrayExtensions = arrayExtensions.ArrayExtensions;
/**
 * Factory method to create an IInteractivityService instance.
 */
export function createInteractivityService(hostServices) {
    return new InteractivityService(hostServices);
}
/**
* Creates a clear an svg rect to catch clear clicks.
*/
export function appendClearCatcher(selection) {
    return selection
        .append("rect")
        .classed("clearCatcher", true)
        .attr("width", "100%")
        .attr("height", "100%");
}
export function dataHasSelection(data) {
    for (let i = 0, ilen = data.length; i < ilen; i++) {
        if (data[i].selected)
            return true;
    }
    return false;
}
export class InteractivityService {
    constructor(hostServices) {
        // References
        this.renderSelectionInVisual = () => { };
        this.renderSelectionInLegend = () => { };
        this.renderSelectionInLabels = () => { };
        // Selection state
        this.selectedIds = [];
        this.isInvertedSelectionMode = false;
        this.selectionManager = hostServices.createSelectionManager();
        if (this.selectionManager.registerOnSelectCallback) {
            this.selectionManager.registerOnSelectCallback(() => {
                this.restoreSelection([...this.selectionManager.getSelectionIds()]);
            });
        }
    }
    // IInteractivityService Implementation
    /** Binds the visual to the interactivityService */
    bind(dataPoints, behavior, behaviorOptions, options) {
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
            if (options.hasSelectionOverride != null) {
                this.hasSelectionOverride = options.hasSelectionOverride;
            }
        }
        else {
            this.selectableDataPoints = dataPoints;
            this.renderSelectionInVisual = () => behavior.renderSelection(this.hasSelection());
        }
        // Bind to the behavior
        this.behavior = behavior;
        behavior.bindEvents(behaviorOptions, this);
        // Sync data points with current selection state
        this.syncSelectionState();
    }
    clearSelectedIds() {
        this.hasSelectionOverride = undefined;
        ArrayExtensions.clear(this.selectedIds);
    }
    /**
     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
     */
    clearSelection() {
        this.clearSelectedIds();
        this.applyToAllSelectableDataPoints((dataPoint) => dataPoint.selected = false);
        this.renderAll();
    }
    applySelectionStateToData(dataPoints, hasHighlights) {
        if (hasHighlights && this.hasSelection()) {
            let selectionIds = (this.selectionManager.getSelectionIds() || []);
            ArrayExtensions.clear(this.selectedIds);
            ArrayExtensions.clear(selectionIds);
        }
        for (let dataPoint of dataPoints) {
            dataPoint.selected = InteractivityService.isDataPointSelected(dataPoint, this.selectedIds);
        }
        return this.hasSelection();
    }
    /**
     * Apply new selections to change internal state of interactivity service from filter
     */
    applySelectionFromFilter(appliedFilter) {
        this.restoreSelection(FilterManager.restoreSelectionIds(appliedFilter));
    }
    /**
     * Apply new selections to change internal state of interactivity service
     */
    restoreSelection(selectionIds) {
        this.clearSelection();
        this.selectedIds = selectionIds;
        this.syncSelectionState();
        this.renderAll();
    }
    /**
     * Checks whether there is at least one item selected.
     */
    hasSelection() {
        return this.selectedIds.length > 0;
    }
    legendHasSelection() {
        return this.selectableLegendDataPoints ? dataHasSelection(this.selectableLegendDataPoints) : false;
    }
    labelsHasSelection() {
        return this.selectableLabelsDataPoints ? dataHasSelection(this.selectableLabelsDataPoints) : false;
    }
    isSelectionModeInverted() {
        return this.isInvertedSelectionMode;
    }
    // ISelectionHandler Implementation
    applySelectionFilter() {
        if (!this.selectionManager) {
            return;
        }
        this.selectionManager.applySelectionFilter();
    }
    handleSelection(dataPoints, multiSelect) {
        // defect 7067397: should not happen so assert but also don't continue as it's
        // causing a lot of error telemetry in desktop.
        if (!dataPoints) {
            return;
        }
        this.select(dataPoints, multiSelect);
        this.sendSelectionToHost();
        this.renderAll();
    }
    handleClearSelection() {
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
    syncSelectionState() {
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
                labelsDataPoint.selected = this.selectedIds.some((value) => {
                    return value.includes(labelsDataPoint.identity);
                });
            }
        }
    }
    syncSelectionStateInverted() {
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
                if (selectedIds.some((value) => value.includes(dataPoint.identity))) {
                    dataPoint.selected = true;
                }
                else if (dataPoint.selected) {
                    dataPoint.selected = false;
                }
            }
        }
    }
    // Private utility methods
    renderAll() {
        this.renderSelectionInVisual();
        this.renderSelectionInLegend();
        this.renderSelectionInLabels();
    }
    /** Marks a data point as selected and syncs selection with the host. */
    select(dataPoints, multiSelect) {
        const selectableDataPoints = [].concat(dataPoints);
        const originalSelectedIds = [...this.selectedIds];
        if (!multiSelect || !selectableDataPoints.length) {
            this.clearSelectedIds();
        }
        selectableDataPoints.forEach((dataPoint) => {
            const shouldDataPointBeSelected = !InteractivityService.isDataPointSelected(dataPoint, originalSelectedIds);
            this.selectSingleDataPoint(dataPoint, shouldDataPointBeSelected);
        });
        this.syncSelectionState();
    }
    selectSingleDataPoint(dataPoint, shouldDataPointBeSelected) {
        if (!dataPoint || !dataPoint.identity) {
            return;
        }
        const identity = dataPoint.identity;
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
    removeId(toRemove) {
        let selectedIds = this.selectedIds;
        for (let i = selectedIds.length - 1; i > -1; i--) {
            let currentId = selectedIds[i];
            if (toRemove.includes(currentId))
                selectedIds.splice(i, 1);
        }
    }
    sendSelectionToHost() {
        if (!this.selectionManager) {
            return;
        }
        if (this.selectedIds && this.selectedIds.length) {
            this.selectionManager.select([...this.selectedIds]);
        }
        else {
            this.selectionManager.clear();
        }
    }
    takeSelectionStateFromDataPoints(dataPoints) {
        let selectedIds = this.selectedIds;
        // Replace the existing selectedIds rather than merging.
        ArrayExtensions.clear(selectedIds);
        for (let dataPoint of dataPoints) {
            if (dataPoint.selected) {
                selectedIds.push(dataPoint.identity);
            }
        }
    }
    applyToAllSelectableDataPoints(action) {
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
    static updateSelectableDataPointsBySelectedIds(selectableDataPoints, selectedIds) {
        let foundMatchingId = false;
        for (let dataPoint of selectableDataPoints) {
            dataPoint.selected = InteractivityService.isDataPointSelected(dataPoint, selectedIds);
            if (dataPoint.selected)
                foundMatchingId = true;
        }
        return foundMatchingId;
    }
    static isDataPointSelected(dataPoint, selectedIds) {
        return selectedIds.some((value) => value.includes(dataPoint.identity));
    }
    removeSelectionIdsWithOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => identity.hasIdentity());
    }
    removeSelectionIdsExceptOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => !identity.hasIdentity());
    }
}
//# sourceMappingURL=interactivityService.js.map