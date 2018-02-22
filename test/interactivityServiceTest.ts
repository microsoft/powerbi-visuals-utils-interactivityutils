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

/// <reference path="_references.ts" />

module powerbi.extensibility.utils.interactivity.test {
    // powerbi.visuals
    import ISelectionIdExtended = powerbi.visuals.ISelectionId;

    // powerbi.extensibility
    import ISelectionId = powerbi.extensibility.ISelectionId;
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;

    // powerbi.extensibility.utils.interactivity
    import InteractivityService = powerbi.extensibility.utils.interactivity.InteractivityService;
    import FilterManager = powerbi.extensibility.utils.filter.FilterManager;
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;
    import MockBehavior = powerbi.extensibility.utils.interactivity.test.mocks.MockBehavior;

    import createVisualHost = powerbi.extensibility.utils.test.mocks.createVisualHost;
    import createSelectionId = powerbi.extensibility.utils.test.mocks.createSelectionId;

    describe("Interactivity service", () => {
        let host: IVisualHost,
            interactivityService: InteractivityService,
            identities: ISelectionId[],
            selectableDataPoints: SelectableDataPoint[],
            behavior: MockBehavior;

        beforeEach(() => {
            host = createVisualHost();

            interactivityService = createInteractivityService(host) as InteractivityService;

            identities = [
                createSelectionId(),
                createSelectionId(),
                createSelectionId(),
                createSelectionId(),
                createSelectionId(),
                createSelectionId()
            ];
            selectableDataPoints = <SelectableDataPoint[]>[
                { selected: false, identity: identities[0] },
                { selected: false, identity: identities[1] },
                { selected: false, identity: identities[2] },
                { selected: false, identity: identities[3] },
                { selected: false, identity: identities[4] },
                { selected: false, identity: identities[5] },
            ];

            behavior = new MockBehavior(selectableDataPoints);
        });

        describe("applySelectionFilter", () => {
            it("shouldn't throw any exceptions if the selectionManager is undefined", () => {
                interactivityService["selectionManager"] = null;

                expect(() => {
                    interactivityService.applySelectionFilter();
                }).not.toThrow();
            });

            it("the selectionManager.applySelectionFilter should be called", () => {
                (interactivityService["selectionManager"] as ISelectionManager).applySelectionFilter = () => {};

                spyOn(interactivityService["selectionManager"], "applySelectionFilter");

                interactivityService.applySelectionFilter();

                expect((interactivityService["selectionManager"] as ISelectionManager).applySelectionFilter)
                    .toHaveBeenCalled();
            });
        });

        describe("Binding", () => {

            it("Basic binding", () => {
                spyOn(behavior, "bindEvents");
                spyOn(behavior, "renderSelection");
                interactivityService.bind(selectableDataPoints, behavior, null);
                expect(behavior.bindEvents).toHaveBeenCalled();
                expect(behavior.verifyCleared()).toBeTruthy();
                expect(behavior.renderSelection).not.toHaveBeenCalled();
                expect(interactivityService.hasSelection()).toBeFalsy();
            });

            it("Binding passes behaviorOptions", () => {
                spyOn(behavior, "bindEvents");
                let arbitraryBehaviorOptions = {
                    some: "random",
                    collection: "of",
                    random: "stuff",
                };
                interactivityService.bind(selectableDataPoints, behavior, arbitraryBehaviorOptions);
                expect(behavior.bindEvents).toHaveBeenCalledWith(arbitraryBehaviorOptions, interactivityService);
            });
        });

        describe("Selection", () => {

            it("Basic selection", () => {
                spyOn(behavior, "renderSelection");
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(0, false);
                expect(behavior.verifySingleSelectedAt(0)).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(true);
                expect(interactivityService.hasSelection()).toBeTruthy();
            });

            it("Apply selection", () => {
                let newDataPoints = selectableDataPoints.map((selectableDataPoint: SelectableDataPoint) => {
                    return {
                        selected: false,
                        identity: selectableDataPoint.identity
                    } as SelectableDataPoint;
                });

                spyOn(behavior, "renderSelection");
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(0, false);
                expect(behavior.verifySingleSelectedAt(0)).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(true);
                interactivityService.applySelectionStateToData(newDataPoints);
                expect(newDataPoints[0].selected).toBeTruthy();
                expect(newDataPoints[1].selected).toBeFalsy();
                expect(newDataPoints[2].selected).toBeFalsy();
                expect(newDataPoints[3].selected).toBeFalsy();
                expect(newDataPoints[4].selected).toBeFalsy();
                expect(newDataPoints[5].selected).toBeFalsy();
            });

            it("Clear selection through event", () => {
                spyOn(behavior, "renderSelection");
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(0, false);
                behavior.clear();
                expect(behavior.verifyCleared()).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(false);
                expect(interactivityService.hasSelection()).toBeFalsy();
            });

            it("Clear selection through service", () => {
                spyOn(behavior, "renderSelection");
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(0, false);
                interactivityService.clearSelection();
                expect(behavior.verifyCleared()).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(false);
                expect(interactivityService.hasSelection()).toBeFalsy();
            });

            it("Multiple single selects", () => {
                interactivityService.bind(selectableDataPoints, behavior, null);
                for (let i = 0, ilen = selectableDataPoints.length; i < ilen; i++) {
                    behavior.selectIndex(i, false);
                    expect(behavior.verifySingleSelectedAt(i)).toBeTruthy();
                }
            });

            it("Single select clears", () => {
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(1, false);
                expect(behavior.verifySingleSelectedAt(1)).toBeTruthy();
                behavior.selectIndex(1, false);
                expect(behavior.verifyCleared()).toBeTruthy();
            });

            it("Single select null identity does not crash", () => {
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.select({
                    identity: createSelectionId(),
                    selected: false,
                });
                expect(behavior.verifyCleared()).toBeTruthy();
            });

            it("Basic multiselect", () => {
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(1, true);
                expect(behavior.verifySelectionState([false, true, false, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(2, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(5, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, true, false])).toBeTruthy();
            });

            it("Multiselect clears", () => {
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(1, true);
                expect(behavior.verifySelectionState([false, true, false, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(2, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(1, true);
                expect(behavior.verifySelectionState([false, false, true, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(5, true);
                expect(behavior.verifySelectionState([false, false, true, false, false, true, false])).toBeTruthy();
                behavior.selectIndex(5, true);
                expect(behavior.verifySelectionState([false, false, true, false, false, false, false])).toBeTruthy();
            });

            it("Single and multiselect", () => {
                interactivityService.bind(selectableDataPoints, behavior, null);
                behavior.selectIndex(1, false);
                expect(behavior.verifySingleSelectedAt(1)).toBeTruthy();
                behavior.selectIndex(2, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(5, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, true, false])).toBeTruthy();
                behavior.selectIndex(3, false);
                expect(behavior.verifySingleSelectedAt(3)).toBeTruthy();
                behavior.selectIndex(0, true);
                expect(behavior.verifySelectionState([true, false, false, true, false, false, false])).toBeTruthy();
            });

            it("Null identity", () => {
                let nullIdentity: SelectableDataPoint = {
                    selected: false,
                    identity: null,
                    specificIdentity: createSelectionId(),
                };
                interactivityService.handleSelection(nullIdentity, false);
                expect(interactivityService.hasSelection()).toBe(false);
            });

            it("Null specific identity", () => {
                let nullIdentity: SelectableDataPoint = {
                    selected: false,
                    identity: createSelectionId(),
                    specificIdentity: null,
                };
                interactivityService.handleSelection(nullIdentity, false);
                expect(interactivityService.hasSelection()).toBe(true);
            });

            it("Null for identity and specific identity", () => {
                let nullIdentity: SelectableDataPoint = {
                    selected: false,
                    identity: null,
                    specificIdentity: null,
                };
                interactivityService.handleSelection(nullIdentity, false);
                expect(interactivityService.hasSelection()).toBe(false);
            });
        });

        describe("Legend", () => {

            it("Selection", () => {
                let legendDataPoints = [
                    { selected: false, identity: selectableDataPoints[0].identity },
                    { selected: false, identity: selectableDataPoints[1].identity },
                ];
                let legendBehavior = new MockBehavior(legendDataPoints);
                interactivityService.bind(selectableDataPoints, behavior, null);
                interactivityService.bind(legendDataPoints, legendBehavior, null, { isLegend: true });

                legendBehavior.selectIndex(0);
                expect(legendBehavior.verifySingleSelectedAt(0)).toBeTruthy();
                expect(behavior.verifySelectionState([true, false, false, false, false, false])).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeTruthy();
                expect(interactivityService.legendHasSelection()).toBeTruthy();

                behavior.selectIndex(1);

                expect(behavior.verifySingleSelectedAt(1)).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeTruthy();
            });

            it("Datapoint selection syncs legend datapoints", () => {
                // Datapoints
                let selectableDataPoints = [
                    { selected: false, identity: createSelectionId() },
                    { selected: false, identity: createSelectionId() },
                ];
                behavior = new MockBehavior(selectableDataPoints);
                interactivityService.bind(selectableDataPoints, behavior, null);

                // Legend datapoints
                let legendDataPoints = [
                    { selected: false, identity: selectableDataPoints[0].identity },
                    { selected: false, identity: selectableDataPoints[1].identity },
                ];
                let legendBehavior = new MockBehavior(legendDataPoints);
                interactivityService.bind(legendDataPoints, legendBehavior, null, { isLegend: true });

                // Trigger selection on datapoints
                behavior.selectIndex(1);
                expect(behavior.verifySelectionState([false, true])).toBeTruthy();
                expect(legendBehavior.verifySelectionState([false, true])).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeTruthy();
                expect(interactivityService.legendHasSelection()).toBeTruthy();

                // Trigger selection on legend
                legendBehavior.selectIndex(0);
                expect(behavior.verifySelectionState([true, false])).toBeTruthy();
                expect(legendBehavior.verifySelectionState([true, false])).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeTruthy();
                expect(interactivityService.legendHasSelection()).toBeTruthy();

                // Trigger selection on datapoints
                behavior.selectIndex(0);
                expect(behavior.verifySelectionState([false, false])).toBeTruthy();
                expect(legendBehavior.verifySelectionState([false, false])).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeFalsy();
                expect(interactivityService.legendHasSelection()).toBeFalsy();
            });

            it("Invalid selection without selectableDataPoints (only legendDataPoints)", () => {
                let legendDataPoints = [
                    { selected: false, identity: createSelectionId() },
                    { selected: false, identity: createSelectionId() },
                ];
                let legendBehavior = new MockBehavior(legendDataPoints);
                interactivityService.bind(legendDataPoints, legendBehavior, null, { isLegend: true });

                // Select first legend item
                legendBehavior.selectIndex(0);
                expect(legendBehavior.verifySelectionState([true, false])).toBeTruthy();

                // New legend datapoints
                let newLegendDataPoints = [
                    { selected: false, identity: createSelectionId() },
                    { selected: false, identity: createSelectionId() },
                ];
                legendBehavior = new MockBehavior(newLegendDataPoints);
                interactivityService.bind(newLegendDataPoints, legendBehavior, null, { isLegend: true });

                // Select a new legend item
                legendBehavior.selectIndex(0);
                expect(legendBehavior.verifySelectionState([true, false])).toBeTruthy();

                // Attempting to select an invalid legend item should clearSelection
                legendBehavior.select(legendDataPoints[1]);

                expect(legendBehavior.verifySelectionState([false, false])).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeFalsy();
                expect(interactivityService.legendHasSelection()).toBeFalsy();
            });
        });

        describe("Labels", () => {

            it("Basic selection", () => {
                let labelsDataPoints = [
                    { selected: false, identity: selectableDataPoints[0].identity },
                    { selected: false, identity: selectableDataPoints[1].identity },
                ];
                let labelBehavior = new MockBehavior(labelsDataPoints);
                interactivityService.bind(selectableDataPoints, behavior, null);
                interactivityService.bind(labelsDataPoints, labelBehavior, null, { isLabels: true });

                labelBehavior.selectIndex(0);
                labelBehavior.verifySingleSelectedAt(0);
                behavior.verifySelectionState([true, false, true, false, true, false]);
                expect(interactivityService.hasSelection()).toBeTruthy();
                expect(interactivityService.labelsHasSelection()).toBeTruthy();

                behavior.selectIndex(1);
                behavior.verifySingleSelectedAt(1);
                labelBehavior.verifyCleared();
                expect(interactivityService.hasSelection()).toBeTruthy();
            });
        });
    });

    describe("FilterManager", () => {
        describe("restore selectionIDs", () => {

        });

        describe("basic filter", () => {
            // In [1000, 2000] basic filter sample
            let filterIn10002000: string =
            `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
            `"whereItems":[{"condition":{"_kind":10,"args":[{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"}],` +
            `"values":[[{"_kind":17,"type":{"underlyingType":260,"category":null},"value":1000,"typeEncodedValue":"1000L"}],` +
            `[{"_kind":17,"type":{"underlyingType":260,"category":null},"value":2000,"typeEncodedValue":"2000L"}]]}}]}`;

            let filterNotIn10002000: string =
            `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
            `"whereItems":[{"condition":{"_kind":16,"arg":{"_kind":10,"args":[{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"}],` +
            `"values":[[{"_kind":17,"type":{"underlyingType":260,"category":null},"value":1000,"typeEncodedValue":"1000L"}],` +
            `[{"_kind":17,"type":{"underlyingType":260,"category":null},"value":2000,"typeEncodedValue":"2000L"}]]}}}]}`;

            it("restore 'In' condition filter", (done) => {
                let filter = JSON.parse(filterIn10002000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IBasicFilter;

                expect(restoredFilter.operator).toBe("In");
                expect(restoredFilter.values.length).toBe(2);
                expect(restoredFilter.filterType).toBe(1 /* FilterType.Basic*/);
                expect(restoredFilter.values[0][0].value).toBe(1000);
                expect(restoredFilter.values[1][0].value).toBe(2000);
                done();
            });

            it("restore 'NotIn' condition filter", (done) => {
                let filter = JSON.parse(filterNotIn10002000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IBasicFilter;

                expect(restoredFilter.operator).toBe("NotIn");
                expect(restoredFilter.values.length).toBe(2);
                expect(restoredFilter.filterType).toBe(1 /* FilterType.Basic*/);
                expect(restoredFilter.values[0][0].value).toBe(1000);
                expect(restoredFilter.values[1][0].value).toBe(2000);
                done();
            });
        });

        describe("restore advanced filter with one condition", () => {
            let filterContaints1000 =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":12,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}]}`;

            let filterDoesNotContain1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":16,"arg":{"_kind":12,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}}]}`;

            let filterDoesNotStartWith1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":16,"arg":{"_kind":14,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}}]}`;

            let filterGreaterThan1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":13,"comparison":1,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}]}`;

            let filterGreaterThanOrEqual1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":13,"comparison":2,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}]}`;

            let filterIs1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":13,"comparison":0,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}]}`;

            let filterIsBlank1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":13,"comparison":0,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":0,"category":null},"value":null,"typeEncodedValue":"null"}}}]}`;

            let filterIsNot1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":16,"arg":{"_kind":13,"comparison":0,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},` +
                `"ref":"Year"},"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}}]}`;

            let filterIsNotBlank1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":16,"arg":{"_kind":13,"comparison":0,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},` +
                `"ref":"Year"},"right":{"_kind":17,"type":{"underlyingType":0,"category":null},"value":null,"typeEncodedValue":"null"}}}}]}`;

            let filterLessThan1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":13,"comparison":3,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}]}`;

            let filterLessThanOrEqual1000: string =
                `{"fromValue":{"items":{"a":{"entity":"Annual Revenue"}}},` +
                `"whereItems":[{"condition":{"_kind":13,"comparison":4,"left":{"_kind":2,"source":{"_kind":0,"entity":"Annual Revenue","variable":"a"},"ref":"Year"},` +
                `"right":{"_kind":17,"type":{"underlyingType":259,"category":null},"value":1000,"typeEncodedValue":"1000D"}}}]}`;

            it("restore 'Contains' operator filter", (done) => {
                let filter = JSON.parse(filterContaints1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("Contains");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'DoesNotContain' operator filter", (done) => {
                let filter = JSON.parse(filterDoesNotContain1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("DoesNotContain");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'DoesNotStartWith' operator filter", (done) => {
                let filter = JSON.parse(filterDoesNotStartWith1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("DoesNotStartWith");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'GreaterThan' operator filter", (done) => {
                let filter = JSON.parse(filterGreaterThan1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("GreaterThan");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'GreaterThanOrEqual' operator filter", (done) => {
                let filter = JSON.parse(filterGreaterThanOrEqual1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("GreaterThanOrEqual");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'Is' operator filter", (done) => {
                let filter = JSON.parse(filterIs1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("Is");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'IsNot' operator filter", (done) => {
                let filter = JSON.parse(filterIsNot1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("IsNot");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'IsBlank' operator filter", (done) => {
                let filter = JSON.parse(filterIsBlank1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("Is");
                expect(restoredFilter.conditions[0].value).toBeNull();
                done();
            });

            it("restore 'IsNotBlank' operator filter", (done) => {
                let filter = JSON.parse(filterIsNotBlank1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("IsNotBlank");
                expect(restoredFilter.conditions[0].value).toBeNull();
                done();
            });

            it("restore 'LessThan' operator filter", (done) => {
                let filter = JSON.parse(filterLessThan1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("LessThan");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });

            it("restore 'LessThanOrEqual' operator filter", (done) => {
                let filter = JSON.parse(filterLessThanOrEqual1000);
                let restoredFilter = FilterManager.restoreFilter(filter) as IAdvancedFilter;

                expect(restoredFilter.logicalOperator).toBe("And");
                expect(restoredFilter.conditions.length).toBe(1);
                expect(restoredFilter.filterType).toBe(0 /* FilterType.Advanced*/);
                expect(restoredFilter.conditions[0].operator).toBe("LessThanOrEqual");
                expect(restoredFilter.conditions[0].value).toBe(1000);
                done();
            });
        });
    });
}
