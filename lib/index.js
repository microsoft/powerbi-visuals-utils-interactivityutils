var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var utils;
        (function (utils) {
            var filter;
            (function (filter) {
                var SQExprKind;
                (function (SQExprKind) {
                    SQExprKind[SQExprKind["Entity"] = 0] = "Entity";
                    SQExprKind[SQExprKind["SubqueryRef"] = 1] = "SubqueryRef";
                    SQExprKind[SQExprKind["ColumnRef"] = 2] = "ColumnRef";
                    SQExprKind[SQExprKind["MeasureRef"] = 3] = "MeasureRef";
                    SQExprKind[SQExprKind["Aggregation"] = 4] = "Aggregation";
                    SQExprKind[SQExprKind["PropertyVariationSource"] = 5] = "PropertyVariationSource";
                    SQExprKind[SQExprKind["Hierarchy"] = 6] = "Hierarchy";
                    SQExprKind[SQExprKind["HierarchyLevel"] = 7] = "HierarchyLevel";
                    SQExprKind[SQExprKind["And"] = 8] = "And";
                    SQExprKind[SQExprKind["Between"] = 9] = "Between";
                    SQExprKind[SQExprKind["In"] = 10] = "In";
                    SQExprKind[SQExprKind["Or"] = 11] = "Or";
                    SQExprKind[SQExprKind["Contains"] = 12] = "Contains";
                    SQExprKind[SQExprKind["Compare"] = 13] = "Compare";
                    SQExprKind[SQExprKind["StartsWith"] = 14] = "StartsWith";
                    SQExprKind[SQExprKind["Exists"] = 15] = "Exists";
                    SQExprKind[SQExprKind["Not"] = 16] = "Not";
                    SQExprKind[SQExprKind["Constant"] = 17] = "Constant";
                    SQExprKind[SQExprKind["DateSpan"] = 18] = "DateSpan";
                    SQExprKind[SQExprKind["DateAdd"] = 19] = "DateAdd";
                    SQExprKind[SQExprKind["Now"] = 20] = "Now";
                    SQExprKind[SQExprKind["AnyValue"] = 21] = "AnyValue";
                    SQExprKind[SQExprKind["DefaultValue"] = 22] = "DefaultValue";
                    SQExprKind[SQExprKind["Arithmetic"] = 23] = "Arithmetic";
                    SQExprKind[SQExprKind["FillRule"] = 24] = "FillRule";
                    SQExprKind[SQExprKind["ResourcePackageItem"] = 25] = "ResourcePackageItem";
                    SQExprKind[SQExprKind["ScopedEval"] = 26] = "ScopedEval";
                    SQExprKind[SQExprKind["WithRef"] = 27] = "WithRef";
                    SQExprKind[SQExprKind["Percentile"] = 28] = "Percentile";
                    SQExprKind[SQExprKind["SelectRef"] = 29] = "SelectRef";
                    SQExprKind[SQExprKind["TransformTableRef"] = 30] = "TransformTableRef";
                    SQExprKind[SQExprKind["TransformOutputRoleRef"] = 31] = "TransformOutputRoleRef";
                    SQExprKind[SQExprKind["ThemeDataColor"] = 32] = "ThemeDataColor";
                    SQExprKind[SQExprKind["GroupRef"] = 33] = "GroupRef";
                    SQExprKind[SQExprKind["Floor"] = 34] = "Floor";
                    SQExprKind[SQExprKind["RoleRef"] = 35] = "RoleRef";
                    SQExprKind[SQExprKind["Discretize"] = 36] = "Discretize";
                    SQExprKind[SQExprKind["NamedQueryRef"] = 37] = "NamedQueryRef";
                    SQExprKind[SQExprKind["Member"] = 38] = "Member";
                    SQExprKind[SQExprKind["FilteredEval"] = 39] = "FilteredEval";
                    SQExprKind[SQExprKind["Conditional"] = 40] = "Conditional";
                })(SQExprKind = filter.SQExprKind || (filter.SQExprKind = {}));
                var QueryComparisonKind;
                (function (QueryComparisonKind) {
                    QueryComparisonKind[QueryComparisonKind["Equal"] = 0] = "Equal";
                    QueryComparisonKind[QueryComparisonKind["GreaterThan"] = 1] = "GreaterThan";
                    QueryComparisonKind[QueryComparisonKind["GreaterThanOrEqual"] = 2] = "GreaterThanOrEqual";
                    QueryComparisonKind[QueryComparisonKind["LessThan"] = 3] = "LessThan";
                    QueryComparisonKind[QueryComparisonKind["LessThanOrEqual"] = 4] = "LessThanOrEqual";
                    QueryComparisonKind[QueryComparisonKind["Contains"] = 12] = "Contains";
                    QueryComparisonKind[QueryComparisonKind["Is"] = 13] = "Is";
                    QueryComparisonKind[QueryComparisonKind["StartsWith"] = 14] = "StartsWith";
                    QueryComparisonKind[QueryComparisonKind["DoesNotContain"] = 16] = "DoesNotContain";
                })(QueryComparisonKind = filter.QueryComparisonKind || (filter.QueryComparisonKind = {}));
            })(filter = utils.filter || (utils.filter = {}));
        })(utils = extensibility.utils || (extensibility.utils = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var utils;
        (function (utils) {
            var filter;
            (function (filter_1) {
                var FilterManager = (function () {
                    function FilterManager() {
                    }
                    /*
                        Restore SelectionID's from filter
                    */
                    FilterManager.restoreSelectionIds = function (filter) {
                        var selectionIds = [];
                        try {
                            if (filter
                                && filter.whereItems
                                && filter.whereItems.length > 0
                                && filter.whereItems[0]
                                && filter.whereItems[0].condition
                                && filter.whereItems[0].condition.values) {
                                filter.whereItems.forEach(function (whereItem) {
                                    if (!whereItem.condition || !whereItem.condition.values) {
                                        return;
                                    }
                                    var condition = whereItem.condition;
                                    var selectionId = condition.values.map(function (valueArray) {
                                        var sqlExpr = condition.args
                                            .map(function (arg, argIndex) {
                                            return new powerbi["data"].SQCompareExpr(filter_1.QueryComparisonKind.Equal, arg, valueArray[argIndex]);
                                        })
                                            .reduce(function (prExp, curExpr) {
                                            if (!prExp) {
                                                return curExpr;
                                            }
                                            return powerbi["data"].SQExprBuilder.and(prExp, curExpr);
                                        }, undefined);
                                        var identity = powerbi["data"].createDataViewScopeIdentity(sqlExpr);
                                        return powerbi["visuals"].SelectionId.createWithId(identity);
                                    });
                                    selectionIds = selectionIds.concat(selectionId);
                                });
                            }
                        }
                        catch (ex) { }
                        return selectionIds;
                    };
                    FilterManager.restoreFilter = function (filter) {
                        if (!filter
                            || !filter.whereItems
                            || !filter.whereItems[0]
                            || !filter.whereItems[0].condition) {
                            return undefined;
                        }
                        var expr = filter.whereItems[0].condition;
                        var basicFilterOperator = FilterManager.getBasicFilterOperator(expr._kind);
                        if ((expr.values || expr.arg && expr.arg.values) &&
                            (basicFilterOperator === "In" ||
                                basicFilterOperator === "All" ||
                                basicFilterOperator === "NotIn")) {
                            return FilterManager.restoreBasicFilter(expr);
                        }
                        return FilterManager.restoreAdvancedFilter(expr);
                    };
                    /*
                        Restores AdvancedFilter instance from filter
                    */
                    FilterManager.restoreAdvancedFilter = function (expr) {
                        var logicalOperator = FilterManager.getLogicalOperatorNameByKind(expr._kind);
                        var conditions;
                        if (logicalOperator === "And" || logicalOperator === "Or") {
                            conditions = FilterManager.getConditions([expr.left, expr.right]);
                        }
                        else {
                            logicalOperator = "And";
                            conditions = FilterManager.getConditions([expr]);
                        }
                        var advancedFilter = new window["powerbi-models"].AdvancedFilter(null, logicalOperator, conditions);
                        return advancedFilter.toJSON();
                    };
                    /*
                        Restores BasicFilter instance from filter
                    */
                    FilterManager.restoreBasicFilter = function (expr) {
                        var basicFilterOperator = FilterManager.getBasicFilterOperator(expr._kind);
                        var basicFilter = new window["powerbi-models"].BasicFilter(null, basicFilterOperator, expr.values || expr.arg && expr.arg.values);
                        return basicFilter.toJSON();
                    };
                    FilterManager.getConditions = function (exprs) {
                        var conditions = [];
                        exprs.forEach(function (expr) {
                            if (expr) {
                                if ((expr.left && expr.right || expr.arg) &&
                                    typeof expr.comparison === "undefined" &&
                                    (expr._kind === filter_1.QueryComparisonKind.Contains ||
                                        expr._kind === filter_1.QueryComparisonKind.Is ||
                                        expr._kind === filter_1.QueryComparisonKind.DoesNotContain ||
                                        expr._kind === filter_1.QueryComparisonKind.StartsWith)) {
                                    var internal = FilterManager
                                        .getConditions([expr.left, expr.right, expr.arg]
                                        .filter(function (expr) { return expr; }))
                                        .filter(function (con) { return typeof con.value !== "undefined"; }); // null must be considered as value
                                    internal.forEach(function (con) {
                                        if (con.operator === "None") {
                                            con.operator = FilterManager.getCondictionOperatorByComparison(expr._kind);
                                        }
                                        // IsBlank stores inside semantic filter as "value is null"
                                        if (con.value === null && con.operator === "Is") {
                                            con.operator = "IsBlank";
                                        }
                                        if (con.value === null && con.operator === "DoesNotContain") {
                                            con.operator = "IsNotBlank";
                                        }
                                    });
                                    // check DoesNotStartsWith as  DoesNotContain values as StartsWith value
                                    if (internal.every(function (con) { return con.operator === "StartsWith"; }) && expr._kind === filter_1.QueryComparisonKind.DoesNotContain) {
                                        internal.forEach(function (con) {
                                            con.operator = "DoesNotStartWith";
                                        });
                                    }
                                    if (internal.every(function (con) { return con.operator === "Contains"; }) && expr._kind === filter_1.QueryComparisonKind.DoesNotContain) {
                                        internal.forEach(function (con) {
                                            con.operator = "DoesNotContain";
                                        });
                                    }
                                    if (internal.every(function (con) { return con.operator === "Is"; }) && expr._kind === filter_1.QueryComparisonKind.DoesNotContain) {
                                        internal.forEach(function (con) {
                                            con.operator = "IsNot";
                                        });
                                    }
                                    if (internal.every(function (con) { return con.operator === "IsBlank"; }) && expr._kind === filter_1.QueryComparisonKind.DoesNotContain) {
                                        internal.forEach(function (con) {
                                            con.operator = "IsNotBlank";
                                        });
                                    }
                                    conditions = conditions.concat(internal);
                                    return;
                                }
                                conditions.push(FilterManager.getCondition(expr));
                            }
                        });
                        return conditions;
                    };
                    FilterManager.getValue = function (expr) {
                        if (!expr) {
                            return undefined;
                        }
                        if (expr._kind === filter_1.SQExprKind.Constant) {
                            return expr.value;
                        }
                        if (expr._kind === filter_1.SQExprKind.Contains) {
                            return expr.value;
                        }
                        var exprs = [
                            expr.left,
                            expr.right,
                            expr.arg,
                        ];
                        for (var _i = 0, exprs_1 = exprs; _i < exprs_1.length; _i++) {
                            var currentExpr = exprs_1[_i];
                            var value = FilterManager.getValue(currentExpr);
                            if (value !== undefined) {
                                return value;
                            }
                        }
                    };
                    FilterManager.getCondition = function (expr) {
                        return {
                            value: FilterManager.getValue(expr),
                            operator: FilterManager.getCondictionOperatorByComparison(expr.comparison),
                        };
                    };
                    FilterManager.getBasicFilterOperator = function (kind) {
                        switch (kind) {
                            case filter_1.SQExprKind.In: {
                                return "In";
                            }
                            case filter_1.SQExprKind.And: {
                                return "All";
                            }
                            case filter_1.SQExprKind.Not: {
                                return "NotIn";
                            }
                            default:
                                return null;
                        }
                    };
                    FilterManager.getLogicalOperatorNameByKind = function (kind) {
                        switch (kind) {
                            case filter_1.SQExprKind.And: {
                                return "And";
                            }
                            case filter_1.SQExprKind.Or: {
                                return "Or";
                            }
                            default:
                                return null;
                        }
                    };
                    FilterManager.getCondictionOperatorByComparison = function (comparison) {
                        switch (comparison) {
                            case filter_1.QueryComparisonKind.Equal: {
                                return "Is";
                            }
                            case filter_1.QueryComparisonKind.Is: {
                                return "Is";
                            }
                            case filter_1.QueryComparisonKind.GreaterThan: {
                                return "GreaterThan";
                            }
                            case filter_1.QueryComparisonKind.GreaterThanOrEqual: {
                                return "GreaterThanOrEqual";
                            }
                            case filter_1.QueryComparisonKind.LessThan: {
                                return "LessThan";
                            }
                            case filter_1.QueryComparisonKind.LessThanOrEqual: {
                                return "LessThanOrEqual";
                            }
                            case filter_1.QueryComparisonKind.Contains: {
                                return "Contains";
                            }
                            case filter_1.QueryComparisonKind.DoesNotContain: {
                                return "DoesNotContain";
                            }
                            case filter_1.QueryComparisonKind.StartsWith: {
                                return "StartsWith";
                            }
                        }
                        return "None";
                    };
                    return FilterManager;
                }());
                filter_1.FilterManager = FilterManager;
            })(filter = utils.filter || (utils.filter = {}));
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
                        var _this = this;
                        // References
                        this.renderSelectionInVisual = function () { };
                        this.renderSelectionInLegend = function () { };
                        this.renderSelectionInLabels = function () { };
                        // Selection state
                        this.selectedIds = [];
                        this.isInvertedSelectionMode = false;
                        this.selectionManager = hostServices.createSelectionManager();
                        if (this.selectionManager.registerOnSelectCallback) {
                            this.selectionManager.registerOnSelectCallback(function () {
                                _this.restoreSelection(_this.selectionManager.getSelectionIds().slice());
                            });
                        }
                    }
                    // IInteractivityService Implementation
                    /** Binds the visual to the interactivityService */
                    InteractivityService.prototype.bind = function (dataPoints, behavior, behaviorOptions, options) {
                        var _this = this;
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
                        this.syncSelectionState();
                    };
                    InteractivityService.prototype.clearSelectedIds = function () {
                        this.hasSelectionOverride = undefined;
                        ArrayExtensions.clear(this.selectedIds);
                    };
                    /**
                     * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
                     */
                    InteractivityService.prototype.clearSelection = function () {
                        this.clearSelectedIds();
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
                            dataPoint.selected = InteractivityService.isDataPointSelected(dataPoint, this.selectedIds);
                        }
                        return this.hasSelection();
                    };
                    /**
                     * Apply new selections to change internal state of interactivity service from filter
                     */
                    InteractivityService.prototype.applySelectionFromFilter = function (appliedFilter) {
                        this.restoreSelection(utils.filter.FilterManager.restoreSelectionIds(appliedFilter));
                    };
                    /**
                     * Apply new selections to change internal state of interactivity service
                     */
                    InteractivityService.prototype.restoreSelection = function (selectionIds) {
                        this.clearSelection();
                        this.selectedIds = selectionIds;
                        this.syncSelectionState();
                        this.renderAll();
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
                    InteractivityService.prototype.handleSelection = function (dataPoints, multiSelect) {
                        // defect 7067397: should not happen so assert but also don't continue as it's
                        // causing a lot of error telemetry in desktop.
                        if (!dataPoints) {
                            return;
                        }
                        this.select(dataPoints, multiSelect);
                        this.sendSelectionToHost();
                        this.renderAll();
                    };
                    InteractivityService.prototype.handleClearSelection = function () {
                        this.clearSelection();
                        this.sendSelectionToHost();
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
                    InteractivityService.prototype.syncSelectionState = function () {
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
                            var _loop_1 = function (labelsDataPoint) {
                                labelsDataPoint.selected = this_1.selectedIds.some(function (value) {
                                    return value.includes(labelsDataPoint.identity);
                                });
                            };
                            var this_1 = this;
                            for (var _i = 0, _a = this.selectableLabelsDataPoints; _i < _a.length; _i++) {
                                var labelsDataPoint = _a[_i];
                                _loop_1(labelsDataPoint);
                            }
                        }
                    };
                    InteractivityService.prototype.syncSelectionStateInverted = function () {
                        var selectedIds = this.selectedIds;
                        var selectableDataPoints = this.selectableDataPoints;
                        if (!selectableDataPoints)
                            return;
                        if (selectedIds.length === 0) {
                            for (var _i = 0, selectableDataPoints_1 = selectableDataPoints; _i < selectableDataPoints_1.length; _i++) {
                                var dataPoint = selectableDataPoints_1[_i];
                                dataPoint.selected = false;
                            }
                        }
                        else {
                            var _loop_2 = function (dataPoint) {
                                if (selectedIds.some(function (value) { return value.includes(dataPoint.identity); })) {
                                    dataPoint.selected = true;
                                }
                                else if (dataPoint.selected) {
                                    dataPoint.selected = false;
                                }
                            };
                            for (var _a = 0, selectableDataPoints_2 = selectableDataPoints; _a < selectableDataPoints_2.length; _a++) {
                                var dataPoint = selectableDataPoints_2[_a];
                                _loop_2(dataPoint);
                            }
                        }
                    };
                    // Private utility methods
                    InteractivityService.prototype.renderAll = function () {
                        this.renderSelectionInVisual();
                        this.renderSelectionInLegend();
                        this.renderSelectionInLabels();
                    };
                    /** Marks a data point as selected and syncs selection with the host. */
                    InteractivityService.prototype.select = function (dataPoints, multiSelect) {
                        var _this = this;
                        var selectableDataPoints = [].concat(dataPoints);
                        var originalSelectedIds = this.selectedIds.slice();
                        if (!multiSelect || !selectableDataPoints.length) {
                            this.clearSelectedIds();
                        }
                        selectableDataPoints.forEach(function (dataPoint) {
                            var shouldDataPointBeSelected = !InteractivityService.isDataPointSelected(dataPoint, originalSelectedIds);
                            _this.selectSingleDataPoint(dataPoint, shouldDataPointBeSelected);
                        });
                        this.syncSelectionState();
                    };
                    InteractivityService.prototype.selectSingleDataPoint = function (dataPoint, shouldDataPointBeSelected) {
                        if (!dataPoint || !dataPoint.identity) {
                            return;
                        }
                        var identity = dataPoint.identity;
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
                    };
                    InteractivityService.prototype.removeId = function (toRemove) {
                        var selectedIds = this.selectedIds;
                        for (var i = selectedIds.length - 1; i > -1; i--) {
                            var currentId = selectedIds[i];
                            if (toRemove.includes(currentId))
                                selectedIds.splice(i, 1);
                        }
                    };
                    InteractivityService.prototype.sendSelectionToHost = function () {
                        if (!this.selectionManager) {
                            return;
                        }
                        if (this.selectedIds && this.selectedIds.length) {
                            this.selectionManager.select(this.selectedIds.slice());
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
                            if (dataPoint.selected) {
                                selectedIds.push(dataPoint.identity);
                            }
                        }
                    };
                    InteractivityService.prototype.applyToAllSelectableDataPoints = function (action) {
                        var selectableDataPoints = this.selectableDataPoints;
                        var selectableLegendDataPoints = this.selectableLegendDataPoints;
                        var selectableLabelsDataPoints = this.selectableLabelsDataPoints;
                        if (selectableDataPoints) {
                            for (var _i = 0, selectableDataPoints_3 = selectableDataPoints; _i < selectableDataPoints_3.length; _i++) {
                                var dataPoint = selectableDataPoints_3[_i];
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
                        for (var _i = 0, selectableDataPoints_4 = selectableDataPoints; _i < selectableDataPoints_4.length; _i++) {
                            var dataPoint = selectableDataPoints_4[_i];
                            dataPoint.selected = InteractivityService.isDataPointSelected(dataPoint, selectedIds);
                            if (dataPoint.selected)
                                foundMatchingId = true;
                        }
                        return foundMatchingId;
                    };
                    InteractivityService.isDataPointSelected = function (dataPoint, selectedIds) {
                        return selectedIds.some(function (value) { return value.includes(dataPoint.identity); });
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
