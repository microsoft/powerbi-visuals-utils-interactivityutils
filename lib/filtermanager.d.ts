import { AppliedFilter } from "./interfaces";
import { IFilter, IAdvancedFilterCondition } from "powerbi-models";
import powerbi from "powerbi-visuals-tools";
import ISelectionId = powerbi.visuals.ISelectionId;
export declare class FilterManager {
    static restoreSelectionIds(filter: AppliedFilter): ISelectionId[];
    static restoreFilter(filter: AppliedFilter): IFilter;
    private static restoreAdvancedFilter;
    private static restoreBasicFilter;
    private static getConditions;
    private static getValue;
    static getCondition(expr: any): IAdvancedFilterCondition;
    private static getBasicFilterOperator;
    private static getLogicalOperatorNameByKind;
    private static getCondictionOperatorByComparison;
}
