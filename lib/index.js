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
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var utils;
        (function (utils) {
            var interactivity;
            (function (interactivity) {
                // powerbi.extensibility.utils.type
                var ArrayExtensions = powerbi.extensibility.utils.type.ArrayExtensions;
                /**
                 * Factory method to create an IInteractivityService instance.
                 */
                function createInteractivityService(hostServices) {
                    return new InteractivityService(hostServices);
                }
                interactivity.createInteractivityService = createInteractivityService;
                /**
                * Creates a clear an svg rect to catch clear clicks.
                */
                function appendClearCatcher(selection) {
                    return selection
                        .append("rect")
                        .classed("clearCatcher", true)
                        .attr({ width: "100%", height: "100%" });
                }
                interactivity.appendClearCatcher = appendClearCatcher;
                function dataHasSelection(data) {
                    for (var i = 0, ilen = data.length; i < ilen; i++) {
                        if (data[i].selected)
                            return true;
                    }
                    return false;
                }
                interactivity.dataHasSelection = dataHasSelection;
                var InteractivityService = (function () {
                    function InteractivityService(hostServices) {
                        this.renderSelectionInVisual = function () { };
                        this.renderSelectionInLegend = function () { };
                        this.renderSelectionInLabels = function () { };
                        // Selection state
                        this.selectedIds = [];
                        this.isInvertedSelectionMode = false;
                        this.dataPointObjectName = "dataPoint";
                        this.hostService = hostServices;
                        this.selectionManager = hostServices.createSelectionManager();
                    }
                    // IInteractivityService Implementation
                    /** Binds the vsiual to the interactivityService */
                    InteractivityService.prototype.bind = function (dataPoints, behavior, behaviorOptions, options) {
                        var _this = this;
                        var didThePreviousStateHaveSelectedIds = this.selectedIds.length > 0;
                        // Bind the data
                        if (options && options.overrideSelectionFromData) {
                            // Override selection state from data points if needed
                            this.takeSelectionStateFromDataPoints(dataPoints);
                        }
                        if (options) {
                            if (options.isLegend) {
                                // Bind to legend data instead of normal data if isLegend
                                this.selectableLegendDataPoints = dataPoints;
                                this.renderSelectionInLegend = function () { return behavior.renderSelection(_this.legendHasSelection()); };
                            }
                            else if (options.isLabels) {
                                // Bind to label data instead of normal data if isLabels
                                this.selectableLabelsDataPoints = dataPoints;
                                this.renderSelectionInLabels = function () { return behavior.renderSelection(_this.labelsHasSelection()); };
                            }
                            else {
                                this.selectableDataPoints = dataPoints;
                                this.renderSelectionInVisual = function () { return behavior.renderSelection(_this.hasSelection()); };
                            }
                            if (options.hasSelectionOverride != null) {
                                this.hasSelectionOverride = options.hasSelectionOverride;
                            }
                        }
                        else {
                            this.selectableDataPoints = dataPoints;
                            this.renderSelectionInVisual = function () { return behavior.renderSelection(_this.hasSelection()); };
                        }
                        // Bind to the behavior
                        this.behavior = behavior;
                        behavior.bindEvents(behaviorOptions, this);
                        // Sync data points with current selection state
                        this.syncSelectionState(didThePreviousStateHaveSelectedIds);
                    };
                    /**
                     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
                     */
                    InteractivityService.prototype.clearSelection = function () {
                        this.hasSelectionOverride = undefined;
                        ArrayExtensions.clear(this.selectedIds);
                        this.applyToAllSelectableDataPoints(function (dataPoint) { return dataPoint.selected = false; });
                        this.renderAll();
                    };
                    InteractivityService.prototype.applySelectionStateToData = function (dataPoints, hasHighlights) {
                        if (hasHighlights && this.hasSelection()) {
                            var selectionIds = (this.selectionManager.getSelectionIds() || []);
                            ArrayExtensions.clear(this.selectedIds);
                            ArrayExtensions.clear(selectionIds);
                        }
                        for (var _i = 0, dataPoints_1 = dataPoints; _i < dataPoints_1.length; _i++) {
                            var dataPoint = dataPoints_1[_i];
                            dataPoint.selected = InteractivityService.checkDatapointAgainstSelectedIds(dataPoint, this.selectedIds);
                        }
                        return this.hasSelection();
                    };
                    /**
                     * Checks whether there is at least one item selected.
                     */
                    InteractivityService.prototype.hasSelection = function () {
                        return this.selectedIds.length > 0;
                    };
                    InteractivityService.prototype.legendHasSelection = function () {
                        return this.selectableLegendDataPoints ? dataHasSelection(this.selectableLegendDataPoints) : false;
                    };
                    InteractivityService.prototype.labelsHasSelection = function () {
                        return this.selectableLabelsDataPoints ? dataHasSelection(this.selectableLabelsDataPoints) : false;
                    };
                    InteractivityService.prototype.isSelectionModeInverted = function () {
                        return this.isInvertedSelectionMode;
                    };
                    // ISelectionHandler Implementation
                    InteractivityService.prototype.applySelectionFilter = function () {
                        if (!this.selectionManager) {
                            return;
                        }
                        this.selectionManager.applySelectionFilter();
                    };
                    InteractivityService.prototype.handleSelection = function (dataPoint, multiSelect) {
                        // defect 7067397: should not happen so assert but also don't continue as it's
                        // causing a lot of error telemetry in desktop.
                        if (!dataPoint)
                            return;
                        if (!dataPoint.identity) {
                            this.handleClearSelection();
                        }
                        else {
                            this.select(dataPoint, multiSelect);
                            this.sendSelectionToHost(dataPoint, multiSelect);
                            this.renderAll();
                        }
                    };
                    InteractivityService.prototype.handleClearSelection = function () {
                        this.clearSelection();
                        this.sendSelectionToHost();
                    };
                    // Private utility methods
                    InteractivityService.prototype.renderAll = function () {
                        this.renderSelectionInVisual();
                        this.renderSelectionInLegend();
                        this.renderSelectionInLabels();
                    };
                    /** Marks a data point as selected and syncs selection with the host. */
                    InteractivityService.prototype.select = function (d, multiSelect) {
                        var id = d.identity;
                        if (!id)
                            return;
                        var selected = !d.selected || (!multiSelect && this.selectedIds.length > 1);
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
                        this.syncSelectionState();
                    };
                    InteractivityService.prototype.removeId = function (toRemove) {
                        var selectedIds = this.selectedIds;
                        for (var i = selectedIds.length - 1; i > -1; i--) {
                            var currentId = selectedIds[i];
                            if (toRemove.includes(currentId))
                                selectedIds.splice(i, 1);
                        }
                    };
                    InteractivityService.prototype.sendSelectionToHost = function (dataPoint, multiSelection) {
                        if (!this.selectionManager) {
                            return;
                        }
                        if (dataPoint && dataPoint.identity) {
                            this.selectionManager.select(dataPoint.identity, multiSelection);
                        }
                        else {
                            this.selectionManager.clear();
                        }
                    };
                    InteractivityService.prototype.takeSelectionStateFromDataPoints = function (dataPoints) {
                        var selectedIds = this.selectedIds;
                        // Replace the existing selectedIds rather than merging.
                        ArrayExtensions.clear(selectedIds);
                        for (var _i = 0, dataPoints_2 = dataPoints; _i < dataPoints_2.length; _i++) {
                            var dataPoint = dataPoints_2[_i];
                            if (dataPoint.selected)
                                selectedIds.push(dataPoint.identity);
                        }
                    };
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
                    InteractivityService.prototype.syncSelectionState = function (didThePreviousStateHaveSelectedIds) {
                        if (didThePreviousStateHaveSelectedIds === void 0) { didThePreviousStateHaveSelectedIds = false; }
                        var selectedIds = this.selectedIds;
                        var selectableDataPoints = this.selectableDataPoints;
                        var selectableLegendDataPoints = this.selectableLegendDataPoints;
                        var selectableLabelsDataPoints = this.selectableLabelsDataPoints;
                        var foundMatchingId = false; // Checked only against the visual's data points; it's possible to have stuff selected in the visual that's not in the legend, but not vice-verse
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
                            var labelsDataPoint_1;
                            for (var i = 0, ilen = selectableLabelsDataPoints.length; i < ilen; i++) {
                                labelsDataPoint_1 = selectableLabelsDataPoints[i];
                                if (selectedIds.some(function (value) { return value.includes(labelsDataPoint_1.identity); }))
                                    labelsDataPoint_1.selected = true;
                                else
                                    labelsDataPoint_1.selected = false;
                            }
                        }
                        if (!foundMatchingId && (selectedIds.length > 0 || didThePreviousStateHaveSelectedIds)) {
                            this.clearSelection();
                            this.sendSelectionToHost();
                        }
                    };
                    InteractivityService.prototype.applyToAllSelectableDataPoints = function (action) {
                        var selectableDataPoints = this.selectableDataPoints;
                        var selectableLegendDataPoints = this.selectableLegendDataPoints;
                        var selectableLabelsDataPoints = this.selectableLabelsDataPoints;
                        if (selectableDataPoints) {
                            for (var _i = 0, selectableDataPoints_1 = selectableDataPoints; _i < selectableDataPoints_1.length; _i++) {
                                var dataPoint = selectableDataPoints_1[_i];
                                action(dataPoint);
                            }
                        }
                        if (selectableLegendDataPoints) {
                            for (var _a = 0, selectableLegendDataPoints_1 = selectableLegendDataPoints; _a < selectableLegendDataPoints_1.length; _a++) {
                                var dataPoint = selectableLegendDataPoints_1[_a];
                                action(dataPoint);
                            }
                        }
                        if (selectableLabelsDataPoints) {
                            for (var _b = 0, selectableLabelsDataPoints_1 = selectableLabelsDataPoints; _b < selectableLabelsDataPoints_1.length; _b++) {
                                var dataPoint = selectableLabelsDataPoints_1[_b];
                                action(dataPoint);
                            }
                        }
                    };
                    InteractivityService.updateSelectableDataPointsBySelectedIds = function (selectableDataPoints, selectedIds) {
                        var foundMatchingId = false;
                        for (var _i = 0, selectableDataPoints_2 = selectableDataPoints; _i < selectableDataPoints_2.length; _i++) {
                            var dataPoint = selectableDataPoints_2[_i];
                            dataPoint.selected = InteractivityService.checkDatapointAgainstSelectedIds(dataPoint, selectedIds);
                            if (dataPoint.selected)
                                foundMatchingId = true;
                        }
                        return foundMatchingId;
                    };
                    InteractivityService.checkDatapointAgainstSelectedIds = function (datapoint, selectedIds) {
                        return selectedIds.some(function (value) { return value.includes(datapoint.identity); });
                    };
                    InteractivityService.prototype.removeSelectionIdsWithOnlyMeasures = function () {
                        this.selectedIds = this.selectedIds.filter(function (identity) { return identity.hasIdentity(); });
                    };
                    InteractivityService.prototype.removeSelectionIdsExceptOnlyMeasures = function () {
                        this.selectedIds = this.selectedIds.filter(function (identity) { return !identity.hasIdentity(); });
                    };
                    return InteractivityService;
                }());
                interactivity.InteractivityService = InteractivityService;
            })(interactivity = utils.interactivity || (utils.interactivity = {}));
        })(utils = extensibility.utils || (extensibility.utils = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
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
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var utils;
        (function (utils) {
            var interactivity;
            (function (interactivity) {
                var interactivityUtils;
                (function (interactivityUtils) {
                    function getPositionOfLastInputEvent() {
                        return {
                            x: d3.event.clientX,
                            y: d3.event.clientY
                        };
                    }
                    interactivityUtils.getPositionOfLastInputEvent = getPositionOfLastInputEvent;
                    function registerStandardSelectionHandler(selection, selectionHandler) {
                        selection.on("click", function (d) { return handleSelection(d, selectionHandler); });
                    }
                    interactivityUtils.registerStandardSelectionHandler = registerStandardSelectionHandler;
                    function registerGroupSelectionHandler(group, selectionHandler) {
                        group.on("click", function () {
                            var target = d3.event.target, d = d3.select(target).datum();
                            handleSelection(d, selectionHandler);
                        });
                    }
                    interactivityUtils.registerGroupSelectionHandler = registerGroupSelectionHandler;
                    function handleSelection(d, selectionHandler) {
                        selectionHandler.handleSelection(d, d3.event.ctrlKey);
                    }
                })(interactivityUtils = interactivity.interactivityUtils || (interactivity.interactivityUtils = {}));
            })(interactivity = utils.interactivity || (utils.interactivity = {}));
        })(utils = extensibility.utils || (extensibility.utils = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
