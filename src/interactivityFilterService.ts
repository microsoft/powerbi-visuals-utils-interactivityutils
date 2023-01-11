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
import {
    IBasicFilter,
    IFilterColumnTarget,
    IFilter,
    FilterType,
    BasicFilter
} from "powerbi-models";

import IVisualHost = powerbi.extensibility.visual.IVisualHost;
// powerbi.extensibility.utils.type
import { arrayExtensions } from "powerbi-visuals-utils-typeutils";

import {
    IBehaviorOptions,
    BaseDataPoint,
    InteractivityBaseService,
    IInteractivityService,
    ISelectionHandler,
    FilterAction
} from "./interactivityBaseService";

import {
    SQExprKind
} from "./interfaces";

export interface FilterDataPoint extends BaseDataPoint {
    category: powerbi.PrimitiveValue;
}

export interface IFilterBehaviorOptions extends IBehaviorOptions<FilterDataPoint> {
    dataView: DataView;
    category: powerbi.DataViewCategoryColumn;
    jsonFilters: powerbi.IFilter[];
}

export function extractFilterColumnTarget(categoryColumn: powerbi.DataViewCategoryColumn | powerbi.DataViewMetadataColumn): IFilterColumnTarget {
    // take an expression from source or column metadata
    const expr: any = categoryColumn && (<any>categoryColumn).source && (<any>categoryColumn).source.expr
        ? <any>(<any>categoryColumn).source.expr
        : <any>(<any>categoryColumn).expr;

    // take table name from source.entity if column definition is simple
    let filterTargetTable: string = expr && expr.source && expr.source.entity
        ? expr.source.entity
        : null;

    // take expr.ref as column name if column definition is simple
    let filterTargetColumn: string = expr && expr.ref
        ? expr.ref
        : null;

    // special cases
    // when data structure is hierarchical
    if (expr && expr.kind === SQExprKind.HierarchyLevel && (<any>categoryColumn).identityExprs) {
        filterTargetColumn = expr.level;

        // Only if we have hierarchical structure with virtual table, take table name from identityExprs
        // Power BI creates hierarchy for date type of data (Year, Quater, Month, Days)
        // For it, Power BI creates a virtual table and gives it generated name as... 'LocalDateTable_bcfa94c1-7c12-4317-9a5f-204f8a9724ca'
        // Visuals have to use a virtual table name as a target of JSON to filter date hierarchy properly
        if (expr.arg && expr.arg.kind === SQExprKind.Hierarchy && expr.arg && expr.arg.arg &&
            expr.arg.arg.kind === SQExprKind.PropertyVariationSource) {
            if ((<any>categoryColumn).identityExprs && (<any>categoryColumn).identityExprs.length) {
                filterTargetTable = (<any>(<any>categoryColumn).identityExprs[(<any>categoryColumn).identityExprs.length - 1]).source.entity;
            }
        } else {
            // otherwise take column name from expr
            filterTargetTable = expr.arg && expr.arg.arg && expr.arg.arg.entity;
        }
    }

    return {
        table: filterTargetTable,
        column: filterTargetColumn
    };
}

export class InteractivityFilterService
    extends InteractivityBaseService<FilterDataPoint, IFilterBehaviorOptions>
    implements IInteractivityService<FilterDataPoint>, ISelectionHandler {

    private selectedCategories: powerbi.PrimitiveValue[] = [];
    private filterColumnTarget: IFilterColumnTarget = null;

    private filterObjectProperty: { objectName: string, propertyName: string } = {
        objectName: "general",
        propertyName: "filter"
    };

    constructor(private hostServices: IVisualHost) {
        super();
    }

    public bind(options: IFilterBehaviorOptions): void {
        this.filterColumnTarget = extractFilterColumnTarget(options.category);

        const jsonFilters = options.jsonFilters;
        arrayExtensions.clear(this.selectedCategories);
        if (jsonFilters && jsonFilters.length > 0) {
            jsonFilters.forEach((filter: IFilter) => {
                if (filter.filterType === FilterType.Basic) {
                    const basicFilter = <IBasicFilter>filter;
                    if (basicFilter.values && basicFilter.values.length > 0) {
                        basicFilter.values.forEach((value: powerbi.PrimitiveValue) => {
                            this.selectedCategories.push(value);
                        });
                    }
                }
            });
        }

        super.bind(options);
    }

    public applySelectionStateToData(dataPoints: FilterDataPoint[], hasHighlights?: boolean): boolean {
        if (hasHighlights && this.hasSelection()) {
            arrayExtensions.clear(this.selectedCategories);
        }

        for (const dataPoint of dataPoints) {
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
            for (const labelsDataPoint of this.selectableLabelsDataPoints) {
                labelsDataPoint.selected = this.selectedCategories.some((value: powerbi.PrimitiveValue) => {
                    return value === <powerbi.PrimitiveValue>labelsDataPoint.category;
                });
            }
        }
    }

    // Marks a data point as selected and syncs selection with the host.
    protected select(dataPoints: FilterDataPoint | FilterDataPoint[], multiSelect: boolean): void {
        const filterDataPoints: FilterDataPoint[] = [].concat(dataPoints);
        const originalSelectedIds = [...this.selectedCategories];

        if (!multiSelect || !filterDataPoints.length) {
            arrayExtensions.clear(this.selectedCategories);
        }

        filterDataPoints.forEach((dataPoint: FilterDataPoint) => {
            const shouldDataPointBeSelected: boolean = !this.isDataPointSelected(dataPoint, originalSelectedIds);
            this.selectSingleDataPoint(dataPoint, shouldDataPointBeSelected);
        });

        this.syncSelectionState();
    }

    protected takeSelectionStateFromDataPoints(dataPoints: FilterDataPoint[]): void {
        const selectedCategories: powerbi.PrimitiveValue[] = this.selectedCategories;

        // Replace the existing selecteCategories rather than merging.
        arrayExtensions.clear(selectedCategories);

        for (const dataPoint of dataPoints) {
            if (dataPoint.selected) {
                selectedCategories.push(<powerbi.PrimitiveValue>dataPoint.category);
            }
        }
    }

    protected sendSelectionToHost(): void {
        const filter: IBasicFilter = new BasicFilter(
            this.filterColumnTarget,
            "In",
            <any[]>this.selectedCategories
        ).toJSON();

        if (this.selectedCategories && this.selectedCategories.length) {
            this.hostServices.applyJsonFilter(
                filter,
                this.filterObjectProperty.objectName,
                this.filterObjectProperty.propertyName,
                <any>FilterAction.merge
            );
        } else {
            this.hostServices.applyJsonFilter(
                filter,
                this.filterObjectProperty.objectName,
                this.filterObjectProperty.propertyName,
                <any>FilterAction.remove
            );
        }
    }

    private syncSelectionStateInverted(): void {
        const selectedCategories = this.selectedCategories;
        const selectableDataPoints = this.selectableDataPoints;
        if (!selectableDataPoints) {
            return;
        }

        if (selectedCategories.length === 0) {
            for (const dataPoint of selectableDataPoints) {
                dataPoint.selected = false;
            }
        }
        else {
            for (const dataPoint of selectableDataPoints) {
                if (selectedCategories.some((value: powerbi.PrimitiveValue) => value === <powerbi.PrimitiveValue>dataPoint.category)) {
                    dataPoint.selected = true;
                }
                else if (dataPoint.selected) {
                    dataPoint.selected = false;
                }
            }
        }
    }

    private selectSingleDataPoint(dataPoint: FilterDataPoint, shouldDataPointBeSelected: boolean): void {
        if (!dataPoint || dataPoint.category == null || dataPoint.category === undefined) {
            return;
        }

        const category: powerbi.PrimitiveValue = dataPoint.category;

        if (shouldDataPointBeSelected) {
            dataPoint.selected = true;
            this.selectedCategories.push(category);
        }
        else {
            dataPoint.selected = false;
            this.removeCategory(category);
        }
    }

    private removeCategory(removingCategory: powerbi.PrimitiveValue): void {
        const selectedCategories = this.selectedCategories;
        for (let i = selectedCategories.length - 1; i > -1; i--) {
            const currentCategory = selectedCategories[i];

            if (removingCategory === currentCategory)
                selectedCategories.splice(i, 1);
        }
    }

    private updateSelectableDataPointsBySelectedCategories(selectableDataPoints: FilterDataPoint[], selectedCategories: powerbi.PrimitiveValue[]): boolean {
        let foundMatchingId = false;

        for (const dataPoint of selectableDataPoints) {
            dataPoint.selected = this.isDataPointSelected(dataPoint, selectedCategories);

            if (dataPoint.selected)
                foundMatchingId = true;
        }

        return foundMatchingId;
    }

    private isDataPointSelected(dataPoint: FilterDataPoint, selectedCategories: powerbi.PrimitiveValue[]): boolean {
        return selectedCategories.some((value: powerbi.PrimitiveValue) => value === dataPoint.category);
    }
}

/**
 * Factory method to create an IInteractivityService instance.
 */
export function createInteractivityFilterService(hostServices: IVisualHost): IInteractivityService<FilterDataPoint> {
    return new InteractivityFilterService(hostServices);
}