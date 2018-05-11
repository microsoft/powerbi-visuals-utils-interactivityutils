import { QueryComparisonKind, SQExprKind } from "./interfaces";
// powerbi.visuals
import powerbi from "powerbi-visuals-tools";
export class FilterManager {
    /*
        Restore SelectionID's from filter
    */
    static restoreSelectionIds(filter) {
        let selectionIds = [];
        try {
            if (filter
                && filter.whereItems
                && filter.whereItems.length > 0
                && filter.whereItems[0]
                && filter.whereItems[0].condition
                && filter.whereItems[0].condition.values) {
                filter.whereItems.forEach(whereItem => {
                    if (!whereItem.condition || !whereItem.condition.values) {
                        return;
                    }
                    const condition = whereItem.condition;
                    let selectionId = condition.values.map((valueArray) => {
                        const sqlExpr = condition.args
                            .map((arg, argIndex) => {
                            return new powerbi["data"].SQCompareExpr(QueryComparisonKind.Equal, arg, valueArray[argIndex]);
                        })
                            .reduce((prExp, curExpr) => {
                            if (!prExp) {
                                return curExpr;
                            }
                            return powerbi["data"].SQExprBuilder.and(prExp, curExpr);
                        }, undefined);
                        const identity = powerbi["data"].createDataViewScopeIdentity(sqlExpr);
                        return powerbi["visuals"].SelectionId.createWithId(identity);
                    });
                    selectionIds = selectionIds.concat(selectionId);
                });
            }
        }
        catch (ex) { }
        return selectionIds;
    }
    static restoreFilter(filter) {
        if (!filter
            || !filter.whereItems
            || !filter.whereItems[0]
            || !filter.whereItems[0].condition) {
            return undefined;
        }
        let expr = filter.whereItems[0].condition;
        let basicFilterOperator = FilterManager.getBasicFilterOperator(expr._kind);
        if ((expr.values || expr.arg && expr.arg.values) &&
            (basicFilterOperator === "In" ||
                basicFilterOperator === "All" ||
                basicFilterOperator === "NotIn")) {
            return FilterManager.restoreBasicFilter(expr);
        }
        return FilterManager.restoreAdvancedFilter(expr);
    }
    /*
        Restores AdvancedFilter instance from filter
    */
    static restoreAdvancedFilter(expr) {
        let logicalOperator = FilterManager.getLogicalOperatorNameByKind(expr._kind);
        let conditions;
        if (logicalOperator === "And" || logicalOperator === "Or") {
            conditions = FilterManager.getConditions([expr.left, expr.right]);
        }
        else {
            logicalOperator = "And";
            conditions = FilterManager.getConditions([expr]);
        }
        let advancedFilter = new window["powerbi-models"].AdvancedFilter(null, logicalOperator, conditions);
        return advancedFilter.toJSON();
    }
    /*
        Restores BasicFilter instance from filter
    */
    static restoreBasicFilter(expr) {
        let basicFilterOperator = FilterManager.getBasicFilterOperator(expr._kind);
        let basicFilter = new window["powerbi-models"].BasicFilter(null, basicFilterOperator, expr.values || expr.arg && expr.arg.values);
        return basicFilter.toJSON();
    }
    static getConditions(exprs) {
        let conditions = [];
        exprs.forEach((expr) => {
            if (expr) {
                if ((expr.left && expr.right || expr.arg) &&
                    typeof expr.comparison === "undefined" &&
                    (expr._kind === QueryComparisonKind.Contains ||
                        expr._kind === QueryComparisonKind.Is ||
                        expr._kind === QueryComparisonKind.DoesNotContain ||
                        expr._kind === QueryComparisonKind.StartsWith)) {
                    let internal = FilterManager
                        .getConditions([expr.left, expr.right, expr.arg]
                        .filter(expr => expr))
                        .filter(con => typeof con.value !== "undefined"); // null must be considered as value
                    internal.forEach(con => {
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
                    if (internal.every(con => con.operator === "StartsWith") && expr._kind === QueryComparisonKind.DoesNotContain) {
                        internal.forEach(con => {
                            con.operator = "DoesNotStartWith";
                        });
                    }
                    if (internal.every(con => con.operator === "Contains") && expr._kind === QueryComparisonKind.DoesNotContain) {
                        internal.forEach(con => {
                            con.operator = "DoesNotContain";
                        });
                    }
                    if (internal.every(con => con.operator === "Is") && expr._kind === QueryComparisonKind.DoesNotContain) {
                        internal.forEach(con => {
                            con.operator = "IsNot";
                        });
                    }
                    if (internal.every(con => con.operator === "IsBlank") && expr._kind === QueryComparisonKind.DoesNotContain) {
                        internal.forEach(con => {
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
    }
    static getValue(expr) {
        if (!expr) {
            return undefined;
        }
        if (expr._kind === SQExprKind.Constant) {
            return expr.value;
        }
        if (expr._kind === SQExprKind.Contains) {
            return expr.value;
        }
        const exprs = [
            expr.left,
            expr.right,
            expr.arg,
        ];
        for (let currentExpr of exprs) {
            const value = FilterManager.getValue(currentExpr);
            if (value !== undefined) {
                return value;
            }
        }
    }
    static getCondition(expr) {
        return {
            value: FilterManager.getValue(expr),
            operator: FilterManager.getCondictionOperatorByComparison(expr.comparison),
        };
    }
    static getBasicFilterOperator(kind) {
        switch (kind) {
            case SQExprKind.In: {
                return "In";
            }
            case SQExprKind.And: {
                return "All";
            }
            case SQExprKind.Not: {
                return "NotIn";
            }
            default:
                return null;
        }
    }
    static getLogicalOperatorNameByKind(kind) {
        switch (kind) {
            case SQExprKind.And: {
                return "And";
            }
            case SQExprKind.Or: {
                return "Or";
            }
            default:
                return null;
        }
    }
    static getCondictionOperatorByComparison(comparison) {
        switch (comparison) {
            case QueryComparisonKind.Equal: {
                return "Is";
            }
            case QueryComparisonKind.Is: {
                return "Is";
            }
            case QueryComparisonKind.GreaterThan: {
                return "GreaterThan";
            }
            case QueryComparisonKind.GreaterThanOrEqual: {
                return "GreaterThanOrEqual";
            }
            case QueryComparisonKind.LessThan: {
                return "LessThan";
            }
            case QueryComparisonKind.LessThanOrEqual: {
                return "LessThanOrEqual";
            }
            case QueryComparisonKind.Contains: {
                return "Contains";
            }
            case QueryComparisonKind.DoesNotContain: {
                return "DoesNotContain";
            }
            case QueryComparisonKind.StartsWith: {
                return "StartsWith";
            }
        }
        return "None";
    }
}
//# sourceMappingURL=filtermanager.js.map