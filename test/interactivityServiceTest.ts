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
    import InteractivitySelectionService = powerbi.extensibility.utils.interactivity.InteractivitySelectionService;
    import SelectionDataPoint = powerbi.extensibility.utils.interactivity.SelectionDataPoint;
    import createInteractivitySelectionService = powerbi.extensibility.utils.interactivity.createInteractivitySelectionService;
    import IBehaviorOptions = powerbi.extensibility.utils.interactivity.IBehaviorOptions;
    import MockBehavior = powerbi.extensibility.utils.interactivity.test.mocks.MockBehavior;

    import createVisualHost = powerbi.extensibility.utils.test.mocks.createVisualHost;
    import createSelectionId = powerbi.extensibility.utils.test.mocks.createSelectionId;

    interface ChicletSlicerBehaviorOptions extends IBehaviorOptions<SelectionDataPoint> {
        some: string;
        collection: string;
        random: string;
    }

    describe("Interactivity service", () => {
        let host: IVisualHost,
            interactivityService: InteractivitySelectionService,
            identities: ISelectionId[],
            selectableDataPoints: SelectionDataPoint[],
            behavior: MockBehavior,
            incr: number = 0;

        const createSelectionIdWithCompareMeasure = () => {
            const selId: any = createSelectionId();
            selId.measures = [incr];
            incr++;
            selId.compareMeasures = (current, others) => {
                return current === others;
            };
            return selId;
        };

        beforeEach(() => {
            host = createVisualHost();

            interactivityService = createInteractivitySelectionService(host) as InteractivitySelectionService;

            identities = [
                createSelectionIdWithCompareMeasure(),
                createSelectionIdWithCompareMeasure(),
                createSelectionIdWithCompareMeasure(),
                createSelectionIdWithCompareMeasure(),
                createSelectionIdWithCompareMeasure(),
                createSelectionIdWithCompareMeasure()
            ];
            selectableDataPoints = <SelectionDataPoint[]>[
                { selected: false, identity: identities[0] },
                { selected: false, identity: identities[1] },
                { selected: false, identity: identities[2] },
                { selected: false, identity: identities[3] },
                { selected: false, identity: identities[4] },
                { selected: false, identity: identities[5] },
            ];

            behavior = new MockBehavior(selectableDataPoints);
        });

        describe("Binding", () => {

            it("Basic binding", () => {
                spyOn(behavior, "bindEvents");
                spyOn(behavior, "renderSelection");
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                expect(behavior.bindEvents).toHaveBeenCalled();
                expect(behavior.verifyCleared()).toBeTruthy();
                expect(behavior.renderSelection).not.toHaveBeenCalled();
                expect(interactivityService.hasSelection()).toBeFalsy();
            });

            it("Binding passes behaviorOptions", () => {
                spyOn(behavior, "bindEvents");
                const arbitraryBehaviorOptions: ChicletSlicerBehaviorOptions = {
                    dataPoints: selectableDataPoints,
                    behavior: behavior,
                    some: "random",
                    collection: "of",
                    random: "stuff",
                };
                interactivityService.bind(arbitraryBehaviorOptions);
                expect(behavior.bindEvents).toHaveBeenCalledWith(arbitraryBehaviorOptions, interactivityService);
            });
        });

        describe("Selection", () => {

            it("Basic selection", () => {
                spyOn(behavior, "renderSelection");
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                behavior.selectIndex(0, false);
                expect(behavior.verifySingleSelectedAt(0)).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(true);
                expect(interactivityService.hasSelection()).toBeTruthy();
            });

            it("Apply selection", () => {
                let newDataPoints = selectableDataPoints.map((selectableDataPoint: SelectionDataPoint) => {
                    return {
                        selected: false,
                        identity: selectableDataPoint.identity
                    } as SelectionDataPoint;
                });

                spyOn(behavior, "renderSelection");
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
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
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                behavior.selectIndex(0, false);
                behavior.clear();
                expect(behavior.verifyCleared()).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(false);
                expect(interactivityService.hasSelection()).toBeFalsy();
            });

            it("Clear selection through service", () => {
                spyOn(behavior, "renderSelection");
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                behavior.selectIndex(0, false);
                interactivityService.clearSelection();
                expect(behavior.verifyCleared()).toBeTruthy();
                expect(behavior.renderSelection).toHaveBeenCalledWith(false);
                expect(interactivityService.hasSelection()).toBeFalsy();
            });

            it("Multiple single selects", () => {
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                for (let i = 0, ilen = selectableDataPoints.length; i < ilen; i++) {
                    behavior.selectIndex(i, false);
                    expect(behavior.verifySingleSelectedAt(i)).toBeTruthy();
                }
            });

            describe("Multiple selects", () => {
                it("should select all of data points if multiSelect is false", () => {
                    interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                    interactivityService.handleSelection(selectableDataPoints, false);

                    for (let dataPointIndex = 0; dataPointIndex < selectableDataPoints.length; dataPointIndex++) {
                        expect(behavior.verifySingleSelectedAt(dataPointIndex)).toBeTruthy();
                    }
                });

                it("should select all of data point if multiSelect is true and dataPoints are applied by small groups", () => {
                    interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });

                    const amountOfDataPoints: number = selectableDataPoints.length;

                    const firstGroup: SelectionDataPoint[] = selectableDataPoints.slice(0, amountOfDataPoints / 2);
                    const secondGroup: SelectionDataPoint[] = selectableDataPoints.slice(amountOfDataPoints / 2, amountOfDataPoints);

                    interactivityService.handleSelection(firstGroup, true);
                    interactivityService.handleSelection(secondGroup, true);

                    for (let dataPointIndex = 0; dataPointIndex < selectableDataPoints.length; dataPointIndex++) {
                        expect(behavior.verifySingleSelectedAt(dataPointIndex)).toBeTruthy();
                    }
                });
            });

            it("should select nothing if dataPoints are empty", () => {
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });

                interactivityService.handleSelection(null, null);

                for (let dataPointIndex = 0; dataPointIndex < selectableDataPoints.length; dataPointIndex++) {
                    expect(behavior.verifySingleSelectedAt(dataPointIndex)).toBeFalsy();
                }
            });

            it("Single select clears", () => {
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                behavior.selectIndex(1, false);
                expect(behavior.verifySingleSelectedAt(1)).toBeTruthy();
                behavior.selectIndex(1, false);
                expect(behavior.verifyCleared()).toBeTruthy();
            });

            it("Single select null identity does not crash", () => {
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                behavior.select({
                    identity: createSelectionIdWithCompareMeasure(),
                    selected: false,
                });
                expect(behavior.verifyCleared()).toBeTruthy();
            });

            it("Basic multiselect", () => {
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                behavior.selectIndex(1, true);
                expect(behavior.verifySelectionState([false, true, false, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(2, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, false, false])).toBeTruthy();
                behavior.selectIndex(5, true);
                expect(behavior.verifySelectionState([false, true, true, false, false, true, false])).toBeTruthy();
            });

            it("Multiselect clears", () => {
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
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
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
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
                let nullIdentity: SelectionDataPoint = {
                    selected: false,
                    identity: null,
                    specificIdentity: createSelectionIdWithCompareMeasure(),
                };
                interactivityService.handleSelection(nullIdentity, false);
                expect(interactivityService.hasSelection()).toBe(false);
            });

            it("Null specific identity", () => {
                let nullIdentity: SelectionDataPoint = {
                    selected: false,
                    identity: createSelectionIdWithCompareMeasure(),
                    specificIdentity: null,
                };
                interactivityService.handleSelection(nullIdentity, false);
                expect(interactivityService.hasSelection()).toBe(true);
            });

            it("Null for identity and specific identity", () => {
                let nullIdentity: SelectionDataPoint = {
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
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                interactivityService.bind({ dataPoints: legendDataPoints, behavior: legendBehavior, interactivityServiceOptions: { isLegend: true } });

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
                    { selected: false, identity: createSelectionIdWithCompareMeasure() },
                    { selected: false, identity: createSelectionIdWithCompareMeasure() },
                ];
                behavior = new MockBehavior(selectableDataPoints);
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });

                // Legend datapoints
                let legendDataPoints = [
                    { selected: false, identity: selectableDataPoints[0].identity },
                    { selected: false, identity: selectableDataPoints[1].identity },
                ];
                let legendBehavior = new MockBehavior(legendDataPoints);
                interactivityService.bind({ dataPoints: legendDataPoints, behavior: legendBehavior, interactivityServiceOptions: { isLegend: true } });

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
                    { selected: false, identity: createSelectionIdWithCompareMeasure() },
                    { selected: false, identity: createSelectionIdWithCompareMeasure() },
                ];
                let legendBehavior = new MockBehavior(legendDataPoints);
                interactivityService.bind({ dataPoints: legendDataPoints, behavior: legendBehavior, interactivityServiceOptions: { isLegend: true } });

                // Select first legend item
                legendBehavior.selectIndex(0);
                expect(legendBehavior.verifySelectionState([true, false])).toBeTruthy();

                // New legend datapoints
                let newLegendDataPoints = [
                    { selected: false, identity: createSelectionIdWithCompareMeasure() },
                    { selected: false, identity: createSelectionIdWithCompareMeasure() },
                ];
                legendBehavior = new MockBehavior(newLegendDataPoints);
                interactivityService.bind({ dataPoints: newLegendDataPoints, behavior: legendBehavior, interactivityServiceOptions: { isLegend: true } });

                // Select a new legend item
                legendBehavior.selectIndex(0);
                expect(legendBehavior.verifySelectionState([true, false])).toBeTruthy();

                // Attempting to select an invalid legend item should clearSelection
                legendBehavior.select(legendDataPoints[1]);

                expect(legendBehavior.verifySelectionState([false, false])).toBeTruthy();
                expect(interactivityService.hasSelection()).toBeTruthy();
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
                interactivityService.bind({ dataPoints: selectableDataPoints, behavior: behavior });
                interactivityService.bind({ dataPoints: labelsDataPoints, behavior: labelBehavior, interactivityServiceOptions: { isLabels: true } });

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
}
