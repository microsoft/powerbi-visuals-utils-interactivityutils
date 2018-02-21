module powerbi.extensibility.utils.filter {

    export class FilterManager {
        /*
            Restore SelectionID's from filter
        */
        public static restoreSelectionIds(filter: AppliedFilter): visuals.ISelectionId[] {
            let selectionIds: visuals.ISelectionId[] = [];
            try {
                if (filter
                    && filter.whereItems
                    && filter.whereItems.length > 0
                    && filter.whereItems[0]
                    && filter.whereItems[0].condition
                    && filter.whereItems[0].condition.values
                ) {
                    filter.whereItems.forEach( whereItem => {
                        if (!whereItem.condition || !whereItem.condition.values) {
                            return;
                        }

                        const condition: { values: any[], args: any[] } = whereItem.condition;

                        let selectionId: visuals.ISelectionId[] = condition.values.map((valueArray: any[]) => {
                            const sqlExpr = condition.args
                                .map((arg, argIndex) => {
                                    return new powerbi["data"].SQCompareExpr(
                                        QueryComparisonKind.Equal,
                                        arg,
                                        valueArray[argIndex]
                                    );
                                })
                                .reduce((prExp, curExpr) => {
                                    if (!prExp) {
                                        return curExpr;
                                    }

                                    return powerbi["data"].SQExprBuilder.and(prExp, curExpr);
                                }, undefined);

                            const identity: DataViewScopeIdentity = powerbi["data"].createDataViewScopeIdentity(sqlExpr);
                            return powerbi["visuals"].SelectionId.createWithId(identity);
                        });

                        selectionIds = selectionIds.concat(selectionId);
                    });
                }
            }
            catch (ex) {}
            return selectionIds;
        }

        static restoreFilter(filter: AppliedFilter): IFilter {
            if (!filter
                || !filter.whereItems
                || !filter.whereItems[0]
                || !filter.whereItems[0].condition
            ) {
                return undefined;
            }

            return FilterManager.restoreAdvancedFilter(filter.whereItems[0].condition);
        }

        /**
         * TODO: Some condictions might be out of scope
         * We must check it against all of possible Advanced Filters
         */
        private static restoreAdvancedFilter(expr): IAdvancedFilter {
            if (!expr) {
                return undefined;
            }

            let logicalOperator: AdvancedFilterLogicalOperators = FilterManager.getLogicalOperatorNameByKind(expr.kind);
            let conditions: IAdvancedFilterCondition[];
            if (logicalOperator === "And" || logicalOperator === "Or") {
                conditions = FilterManager.getConditions([expr.left, expr.right]);
            } else {
                logicalOperator = "And";
                conditions = FilterManager.getConditions([expr]);
            }
            let filter: AdvancedFilter = new window["powerbi-models"].AdvancedFilter(null, logicalOperator, conditions) as AdvancedFilter;

            return filter.toJSON();
        }

        private static restoreBasicFilter(expr): IAdvancedFilter {
            if (!expr) {
                return undefined;
            }

            let conditions: IAdvancedFilterCondition[] = FilterManager.getConditions([expr.left, expr.right]);
            let logicalOperator: BasicFilterOperators = FilterManager.getBasicFilterOperator(expr.kind);
            let filter: BasicFilter = new window["powerbi-models"].AdvancedFilter(null, logicalOperator, conditions.map(cond => cond.value)) as BasicFilter;

            return {
                $schema: null,
                target: null,
                filterType: FilterType.Basic,
                logicalOperator: FilterManager.getLogicalOperatorNameByKind(expr.kind),
                conditions: FilterManager.getConditions([expr.left, expr.right]),
            };
        }

        private static getConditions(exprs: any[]): IAdvancedFilterCondition[] {
            let conditions: IAdvancedFilterCondition[] = [];

            exprs.forEach((expr) => {
                if (expr) {
                    if (
                        (expr.left && expr.right || expr.arg) &&
                        typeof expr.comparison === "undefined" &&
                        (
                            expr.kind === QueryComparisonKind.Contains ||
                            expr.kind === QueryComparisonKind.Is ||
                            expr.kind === QueryComparisonKind.DoesNotContain ||
                            expr.kind === QueryComparisonKind.StartsWith
                        )
                    ) {
                        let internal = FilterManager
                            .getConditions([expr.left, expr.right, expr.arg]
                            .filter(expr => expr))
                            .filter(con => typeof con.value !== "undefined" ); // null must be considered as value
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
                            if (internal.every(con => con.operator === "StartsWith") && expr.kind === QueryComparisonKind.DoesNotContain ) {
                                internal.forEach(con => {
                                    con.operator = "DoesNotStartWith";
                                });
                            }
                            if (internal.every(con => con.operator === "Contains") && expr.kind === QueryComparisonKind.DoesNotContain ) {
                                internal.forEach(con => {
                                    con.operator = "DoesNotContain";
                                });
                            }
                            conditions = conditions.concat(internal);
                            return;
                    }

                    conditions.push(FilterManager.getCondiction(expr));
                }
            });

            return conditions;
        }

        private static getValue(expr) {
            if (!expr) {
                return undefined;
            }

            if (expr.kind === SQExprKind.Constant) {
                return expr.value;
            }

            if (expr.kind === SQExprKind.Contains) {
                ​return expr.value;
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

        public static getCondiction(expr): IAdvancedFilterCondition {
            return {
                value: FilterManager.getValue(expr),
                operator: FilterManager.getCondictionOperatorByComparison(expr.comparison),
            };
        }

        private static getBasicFilterOperator(kind: SQExprKind): BasicFilterOperators {
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
                    return "In";
            }
        }

        private static getLogicalOperatorNameByKind(kind: SQExprKind): AdvancedFilterLogicalOperators {
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

        private static getCondictionOperatorByComparison(comparison: QueryComparisonKind): AdvancedFilterConditionOperators {
            switch (comparison) {
                case QueryComparisonKind.Is: {
                    return "Is";
                }
                // case QueryComparisonKind.IsNot: {
                //     return "IsNot";
                // }
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
                // case QueryComparisonKind.DoesNotStartWith: {
                //     return "DoesNotStartWith";
                // }
                // case QueryComparisonKind.IsBlank: {
                //     return "IsBlank";
                // }
                // case QueryComparisonKind.IsNotBlank: {
                //     return "IsNotBlank";
                // }
            }

            return "None";
        }
    }
}