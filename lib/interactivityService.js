// powerbi.extensibility.utils.type
var ArrayExtensions = powerbi.extensibility.utils.type.ArrayExtensions;
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
        this.renderSelectionInVisual = () => { };
        this.renderSelectionInLegend = () => { };
        this.renderSelectionInLabels = () => { };
        // Selection state
        this.selectedIds = [];
        this.isInvertedSelectionMode = false;
        this.dataPointObjectName = "dataPoint";
        this.hostService = hostServices;
        this.selectionManager = hostServices.createSelectionManager();
    }
    // IInteractivityService Implementation
    /** Binds the vsiual to the interactivityService */
    bind(dataPoints, behavior, behaviorOptions, options) {
        const didThePreviousStateHaveSelectedIds = this.selectedIds.length > 0;
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
        this.syncSelectionState(didThePreviousStateHaveSelectedIds);
    }
    /**
     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
     */
    clearSelection() {
        this.hasSelectionOverride = undefined;
        ArrayExtensions.clear(this.selectedIds);
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
            dataPoint.selected = InteractivityService.checkDatapointAgainstSelectedIds(dataPoint, this.selectedIds);
        }
        return this.hasSelection();
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
    handleSelection(dataPoint, multiSelect, skipSync) {
        // defect 7067397: should not happen so assert but also don't continue as it's
        // causing a lot of error telemetry in desktop.
        if (!dataPoint)
            return;
        if (!dataPoint.identity) {
            this.handleClearSelection();
        }
        else {
            this.select(dataPoint, multiSelect, skipSync);
            this.sendSelectionToHost(dataPoint, multiSelect);
            this.renderAll();
        }
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
    syncSelectionState(didThePreviousStateHaveSelectedIds = false) {
        let selectedIds = this.selectedIds;
        let selectableDataPoints = this.selectableDataPoints;
        let selectableLegendDataPoints = this.selectableLegendDataPoints;
        let selectableLabelsDataPoints = this.selectableLabelsDataPoints;
        let foundMatchingId = false; // Checked only against the visual's data points; it's possible to have stuff selected in the visual that's not in the legend, but not vice-verse
        if (!selectableDataPoints && !selectableLegendDataPoints)
            return;
        if (selectableDataPoints) {
            if (InteractivityService.updateSelectableDataPointsBySelectedIds(selectableDataPoints, selectedIds))
                foundMatchingId = true;
        }
        if (selectableLegendDataPoints) {
            if (InteractivityService.updateSelectableDataPointsBySelectedIds(selectableLegendDataPoints, selectedIds))
                foundMatchingId = true;
        }
        if (selectableLabelsDataPoints) {
            let labelsDataPoint;
            for (let i = 0, ilen = selectableLabelsDataPoints.length; i < ilen; i++) {
                labelsDataPoint = selectableLabelsDataPoints[i];
                if (selectedIds.some((value) => value.includes(labelsDataPoint.identity)))
                    labelsDataPoint.selected = true;
                else
                    labelsDataPoint.selected = false;
            }
        }
        if (!foundMatchingId && (selectedIds.length > 0 || didThePreviousStateHaveSelectedIds)) {
            this.clearSelection();
            this.sendSelectionToHost();
        }
    }
    // Private utility methods
    renderAll() {
        this.renderSelectionInVisual();
        this.renderSelectionInLegend();
        this.renderSelectionInLabels();
    }
    /** Marks a data point as selected and syncs selection with the host. */
    select(d, multiSelect, skipSync) {
        let id = d.identity;
        if (!id)
            return;
        let selected = !d.selected || (!multiSelect && this.selectedIds.length > 1);
        // If we have a multiselect flag, we attempt a multiselect
        if (multiSelect) {
            if (selected) {
                d.selected = true;
                this.selectedIds.push(id);
                if (id.hasIdentity()) {
                    this.removeSelectionIdsWithOnlyMeasures();
                }
                else {
                    this.removeSelectionIdsExceptOnlyMeasures();
                }
            }
            else {
                d.selected = false;
                this.removeId(id);
            }
        }
        // We do a single select if we didn't do a multiselect or if we find out that the multiselect is invalid.
        if (!multiSelect) {
            this.clearSelection();
            if (selected) {
                d.selected = true;
                this.selectedIds.push(id);
            }
        }
        if (!skipSync) {
            this.syncSelectionState();
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
    sendSelectionToHost(dataPoint, multiSelection) {
        if (!this.selectionManager) {
            return;
        }
        if (dataPoint && dataPoint.identity) {
            this.selectionManager.select(dataPoint.identity, multiSelection);
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
            if (dataPoint.selected)
                selectedIds.push(dataPoint.identity);
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
            dataPoint.selected = InteractivityService.checkDatapointAgainstSelectedIds(dataPoint, selectedIds);
            if (dataPoint.selected)
                foundMatchingId = true;
        }
        return foundMatchingId;
    }
    static checkDatapointAgainstSelectedIds(datapoint, selectedIds) {
        return selectedIds.some((value) => value.includes(datapoint.identity));
    }
    removeSelectionIdsWithOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => identity.hasIdentity());
    }
    removeSelectionIdsExceptOnlyMeasures() {
        this.selectedIds = this.selectedIds.filter((identity) => !identity.hasIdentity());
    }
}
//# sourceMappingURL=interactivityService.js.map