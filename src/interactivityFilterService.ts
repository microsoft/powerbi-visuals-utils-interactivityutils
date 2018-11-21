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
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;
    // powerbi.extensibility.utils.type
    import ArrayExtensions = powerbi.extensibility.utils.type.ArrayExtensions;

    export interface FilterDataPoint extends SelectableDataPoint {
        category: PrimitiveValue;
    }

    export interface IFilterBehaviorOptions extends IBehaviorOptions<FilterDataPoint> {
        dataView: DataView;
        category: DataViewCategoryColumn;
        jsonFilters: IFilter[];
    }

    export function extractFilterColumnTarget(categoryColumn: DataViewCategoryColumn): IFilterColumnTarget {
        const categoryExpr: any = categoryColumn.source && categoryColumn.source.expr ? categoryColumn.source.expr as any : null;
        const filterTargetTable: string = categoryExpr && categoryExpr.source && categoryExpr.source.entity ? categoryExpr.source.entity : categoryColumn.source.queryName.substr(0, categoryColumn.source.queryName.indexOf("."));
        const filterTargetColumn: string = categoryExpr && categoryExpr.arg && categoryExpr.arg.arg && categoryExpr.arg.arg.property ? categoryExpr.arg.arg.property : categoryColumn.source.displayName;

        return {
            table: filterTargetTable,
            column: filterTargetColumn
        };

    }

    export class InteractivityFilterService
        extends InteractivityBaseService<FilterDataPoint, IFilterBehaviorOptions>
        implements IInteractivityService<FilterDataPoint>, ISelectionHandler {

        private selectedCategories: PrimitiveValue[] = [];
        private filterColumnTarget: IFilterColumnTarget = null;

        private filterObjectProperty: { objectName: string, propertyName: string } = {
            objectName: "general",
            propertyName: "filter"
        };

        constructor(private hostServices: IVisualHost) {
            super();
        }

        public bind(options: IFilterBehaviorOptions): void {
            this.filterColumnTarget = powerbi.extensibility.utils.interactivity.extractFilterColumnTarget(options.category);

            const jsonFilters = options.jsonFilters;
            ArrayExtensions.clear(this.selectedCategories);
            if (jsonFilters && jsonFilters.length > 0) {
                jsonFilters.forEach((filter: IBasicFilter) => {
                    if (filter.values && filter.values.length > 0) {
                        filter.values.forEach((value: PrimitiveValue) => {
                            this.selectedCategories.push(value);
                        });
                    }
                });
            }

            super.bind(options);
        }

        public applySelectionStateToData(dataPoints: FilterDataPoint[], hasHighlights?: boolean): boolean {
            if (hasHighlights && this.hasSelection()) {
                ArrayExtensions.clear(this.selectedCategories);
            }

            for (let dataPoint of dataPoints) {
                dataPoint.selected = this.isDataPointSelected(dataPoint, this.selectedCategories);
            }

            return this.hasSelection();
        }

        /**
         * Checks whether there is at least one item selected.
         */
        public hasSelection(): boolean {
            return this.selectedCategories.length > 0;
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
                this.updateSelectableDataPointsBySelectedCategories(this.selectableDataPoints, this.selectedCategories);
            }

            if (this.selectableLegendDataPoints) {
                this.updateSelectableDataPointsBySelectedCategories(this.selectableLegendDataPoints, this.selectedCategories);
            }

            if (this.selectableLabelsDataPoints) {
                for (let labelsDataPoint of this.selectableLabelsDataPoints) {
                    labelsDataPoint.selected = this.selectedCategories.some((value: PrimitiveValue) => {
                        return value === labelsDataPoint.category as PrimitiveValue;
                    });
                }
            }
        }

        /** Marks a data point as selected and syncs selection with the host. */
        protected select(dataPoints: FilterDataPoint | FilterDataPoint[], multiSelect: boolean): void {
            const filterDataPoints: FilterDataPoint[] = [].concat(dataPoints);
            const originalSelectedIds = [...this.selectedCategories];

            if (!multiSelect || !filterDataPoints.length) {
                ArrayExtensions.clear(this.selectedCategories);
            }

            filterDataPoints.forEach((dataPoint: FilterDataPoint) => {
                const shouldDataPointBeSelected: boolean = !this.isDataPointSelected(dataPoint, originalSelectedIds);
                this.selectSingleDataPoint(dataPoint, shouldDataPointBeSelected);
            });

            this.syncSelectionState();
        }

        protected takeSelectionStateFromDataPoints(dataPoints: FilterDataPoint[]): void {
            let selectedCategories: PrimitiveValue[] = this.selectedCategories;

            // Replace the existing selecteCategories rather than merging.
            ArrayExtensions.clear(selectedCategories);

            for (let dataPoint of dataPoints) {
                if (dataPoint.selected) {
                    selectedCategories.push(dataPoint.category as PrimitiveValue);
                }
            }
        }

        protected sendSelectionToHost(): void {
            const filter: IBasicFilter = new window["powerbi-models"].BasicFilter(
                this.filterColumnTarget,
                "In",
                this.selectedCategories as any[]
            );

            if (this.selectedCategories && this.selectedCategories.length) {
                this.hostServices.applyJsonFilter(
                    filter,
                    this.filterObjectProperty.objectName,
                    this.filterObjectProperty.propertyName,
                    FilterAction.merge
                );
            } else {
                this.hostServices.applyJsonFilter(
                    filter,
                    this.filterObjectProperty.objectName,
                    this.filterObjectProperty.propertyName,
                    FilterAction.remove
                );
            }
        }

        private syncSelectionStateInverted(): void {
            let selectedCategories = this.selectedCategories;
            let selectableDataPoints = this.selectableDataPoints;
            if (!selectableDataPoints) {
                return;
            }

            if (selectedCategories.length === 0) {
                for (let dataPoint of selectableDataPoints) {
                    dataPoint.selected = false;
                }
            }
            else {
                for (let dataPoint of selectableDataPoints) {
                    if (selectedCategories.some((value: PrimitiveValue) => value === dataPoint.category as PrimitiveValue)) {
                        dataPoint.selected = true;
                    }
                    else if (dataPoint.selected) {
                        dataPoint.selected = false;
                    }
                }
            }
        }

        private selectSingleDataPoint(dataPoint: FilterDataPoint, shouldDataPointBeSelected: boolean): void {
            if (!dataPoint || dataPoint.category == null || typeof dataPoint.category === "undefined") {
                return;
            }

            const category: PrimitiveValue = dataPoint.category;

            if (shouldDataPointBeSelected) {
                dataPoint.selected = true;
                this.selectedCategories.push(category);
            }
            else {
                dataPoint.selected = false;
                this.removeCategory(category);
            }
        }

        private removeCategory(removingCategory: PrimitiveValue): void {
            let selectedCategories = this.selectedCategories;
            for (let i = selectedCategories.length - 1; i > -1; i--) {
                let currentCategory = selectedCategories[i];

                if (removingCategory === currentCategory)
                    selectedCategories.splice(i, 1);
            }
        }

        private updateSelectableDataPointsBySelectedCategories(selectableDataPoints: FilterDataPoint[], selectedCategories: PrimitiveValue[]): boolean {
            let foundMatchingId = false;

            for (let dataPoint of selectableDataPoints) {
                dataPoint.selected = this.isDataPointSelected(dataPoint, selectedCategories);

                if (dataPoint.selected)
                    foundMatchingId = true;
            }

            return foundMatchingId;
        }

        private isDataPointSelected(dataPoint: FilterDataPoint, selectedCategories: PrimitiveValue[]): boolean {
            return selectedCategories.some((value: PrimitiveValue) => value === dataPoint.category);
        }
    }

    /**
     * Factory method to create an IInteractivityService instance.
     */
    export function createInteractivityFilterService(hostServices: IVisualHost): IInteractivityService<FilterDataPoint> {
        return new InteractivityFilterService(hostServices);
    }
}