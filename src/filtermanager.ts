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
    }
}