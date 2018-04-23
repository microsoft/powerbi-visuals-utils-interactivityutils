/// <reference types="powerbi-visuals-tools" />
import { AppliedFilter } from "./interfaces";
import { IFilter, IAdvancedFilterCondition } from "powerbi-models";
import ISelectionId = powerbi.visuals.ISelectionId;
export declare class FilterManager {
    static restoreSelectionIds(filter: AppliedFilter): ISelectionId[];
    static restoreFilter(filter: AppliedFilter): IFilter;
    private static restoreAdvancedFilter(expr);
    private static restoreBasicFilter(expr);
    private static getConditions(exprs);
    private static getValue(expr);
    static getCondition(expr: any): IAdvancedFilterCondition;
    private static getBasicFilterOperator(kind);
    private static getLogicalOperatorNameByKind(kind);
    private static getCondictionOperatorByComparison(comparison);
}
