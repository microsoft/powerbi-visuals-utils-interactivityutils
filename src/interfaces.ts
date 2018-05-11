export interface AppliedFilter {
    whereItems: {
        condition: any
    }[];
}

export interface Expression {
    left: Expression;
    right: Expression;
}

export type BasicFilterOperators = "In" | "NotIn" | "All";

export enum SQExprKind {
    Entity,
    SubqueryRef,
    ColumnRef,
    MeasureRef,
    Aggregation,
    PropertyVariationSource,
    Hierarchy,
    HierarchyLevel,
    And,
    Between,
    In,
    Or,
    Contains,
    Compare,
    StartsWith,
    Exists,
    Not,
    Constant,
    DateSpan,
    DateAdd,
    Now,
    AnyValue,
    DefaultValue,
    Arithmetic,
    FillRule,
    ResourcePackageItem,
    ScopedEval,
    WithRef,
    Percentile,
    SelectRef,
    TransformTableRef,
    TransformOutputRoleRef,
    ThemeDataColor,
    GroupRef,
    Floor,
    RoleRef,
    Discretize,
    NamedQueryRef,
    Member,
    FilteredEval,
    Conditional
}

export enum QueryComparisonKind {
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

// aka SematicFilter
export interface AppliedFilter {
    whereItems: {
        condition: any
    }[];
}