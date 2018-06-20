export interface AppliedFilter {
    whereItems: {
        condition: any;
    }[];
}
export interface Expression {
    left: Expression;
    right: Expression;
}
export declare type BasicFilterOperators = "In" | "NotIn" | "All";
export declare enum SQExprKind {
    Entity = 0,
    SubqueryRef = 1,
    ColumnRef = 2,
    MeasureRef = 3,
    Aggregation = 4,
    PropertyVariationSource = 5,
    Hierarchy = 6,
    HierarchyLevel = 7,
    And = 8,
    Between = 9,
    In = 10,
    Or = 11,
    Contains = 12,
    Compare = 13,
    StartsWith = 14,
    Exists = 15,
    Not = 16,
    Constant = 17,
    DateSpan = 18,
    DateAdd = 19,
    Now = 20,
    AnyValue = 21,
    DefaultValue = 22,
    Arithmetic = 23,
    FillRule = 24,
    ResourcePackageItem = 25,
    ScopedEval = 26,
    WithRef = 27,
    Percentile = 28,
    SelectRef = 29,
    TransformTableRef = 30,
    TransformOutputRoleRef = 31,
    ThemeDataColor = 32,
    GroupRef = 33,
    Floor = 34,
    RoleRef = 35,
    Discretize = 36,
    NamedQueryRef = 37,
    Member = 38,
    FilteredEval = 39,
    Conditional = 40
}
export declare enum QueryComparisonKind {
    Equal = 0,
    GreaterThan = 1,
    GreaterThanOrEqual = 2,
    LessThan = 3,
    LessThanOrEqual = 4,
    Contains = 12,
    Is = 13,
    StartsWith = 14,
    DoesNotContain = 16
}
export interface AppliedFilter {
    whereItems: {
        condition: any;
    }[];
}
