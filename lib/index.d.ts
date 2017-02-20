/// <reference types="d3" />
declare module powerbi.extensibility.utils.interactivity {
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;
    import ExtensibilityISelectionId = powerbi.extensibility.ISelectionId;
    import ISelectionId = powerbi.visuals.ISelectionId;
    import BoundingRect = powerbi.extensibility.utils.svg.shapes.BoundingRect;
    interface SelectableDataPoint {
        selected: boolean;
        /** Identity for identifying the selectable data point for selection purposes */
        identity: ISelectionId | ExtensibilityISelectionId;
        /**
         * A specific identity for when data points exist at a finer granularity than
         * selection is performed.  For example, if your data points should select based
         * only on series even if they exist as category/series intersections.
         */
        specificIdentity?: ISelectionId | ExtensibilityISelectionId;
    }
    /**
     * Factory method to create an IInteractivityService instance.
     */
    function createInteractivityService(hostServices: IVisualHost): IInteractivityService;
    /**
    * Creates a clear an svg rect to catch clear clicks.
    */
    function appendClearCatcher(selection: d3.Selection<any>): d3.Selection<any>;
    function dataHasSelection(data: SelectableDataPoint[]): boolean;
    interface IInteractiveBehavior {
        bindEvents(behaviorOptions: any, selectionHandler: ISelectionHandler): void;
        renderSelection(hasSelection: boolean): void;
        hoverLassoRegion?(e: MouseEvent, rect: BoundingRect): void;
        lassoSelect?(e: MouseEvent, rect: BoundingRect): void;
    }
    /**
     * An optional options bag for binding to the interactivityService
     */
    interface InteractivityServiceOptions {
        isLegend?: boolean;
        isLabels?: boolean;
        overrideSelectionFromData?: boolean;
        hasSelectionOverride?: boolean;
    }
    /**
     * Responsible for managing interactivity between the hosting visual and its peers
     */
    interface IInteractivityService {
        /** Binds the visual to the interactivityService */
        bind(dataPoints: SelectableDataPoint[], behavior: IInteractiveBehavior, behaviorOptions: any, iteractivityServiceOptions?: InteractivityServiceOptions): any;
        /** Clears the selection */
        clearSelection(): void;
        /** Sets the selected state on the given data points. */
        applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean;
        /** Checks whether there is at least one item selected */
        hasSelection(): boolean;
        /** Checks whether there is at least one item selected within the legend */
        legendHasSelection(): boolean;
        /** Checks whether the selection mode is inverted or normal */
        isSelectionModeInverted(): boolean;
    }
    interface ISelectionHandler {
        /**
         * Handles a selection event by selecting the given data point.  If the data point's
         * identity is undefined, the selection state is cleared. In this case, if specificIdentity
         * exists, it will still be sent to the host.
         */
        handleSelection(dataPoint: SelectableDataPoint, multiSelect: boolean): void;
        /** Handles a selection clear, clearing all selection state */
        handleClearSelection(): void;
        /**
         * Sends the selection state to the host
         */
        applySelectionFilter(): void;
    }
    class InteractivityService implements IInteractivityService, ISelectionHandler {
        private selectionManager;
        private hostService;
        private renderSelectionInVisual;
        private renderSelectionInLegend;
        private renderSelectionInLabels;
        private selectedIds;
        private isInvertedSelectionMode;
        private hasSelectionOverride;
        private behavior;
        selectableDataPoints: SelectableDataPoint[];
        selectableLegendDataPoints: SelectableDataPoint[];
        selectableLabelsDataPoints: SelectableDataPoint[];
        private dataPointObjectName;
        constructor(hostServices: IVisualHost);
        /** Binds the vsiual to the interactivityService */
        bind(dataPoints: SelectableDataPoint[], behavior: IInteractiveBehavior, behaviorOptions: any, options?: InteractivityServiceOptions): void;
        /**
         * Sets the selected state of all selectable data points to false and invokes the behavior's select command.
         */
        clearSelection(): void;
        applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean;
        /**
         * Checks whether there is at least one item selected.
         */
        hasSelection(): boolean;
        legendHasSelection(): boolean;
        labelsHasSelection(): boolean;
        isSelectionModeInverted(): boolean;
        applySelectionFilter(): void;
        handleSelection(dataPoint: SelectableDataPoint, multiSelect: boolean): void;
        handleClearSelection(): void;
        private renderAll();
        /** Marks a data point as selected and syncs selection with the host. */
        private select(d, multiSelect);
        private removeId(toRemove);
        private sendSelectionToHost(dataPoint?, multiSelection?);
        private takeSelectionStateFromDataPoints(dataPoints);
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
        private syncSelectionState(didThePreviousStateHaveSelectedIds?);
        private applyToAllSelectableDataPoints(action);
        private static updateSelectableDataPointsBySelectedIds(selectableDataPoints, selectedIds);
        private static checkDatapointAgainstSelectedIds(datapoint, selectedIds);
        private removeSelectionIdsWithOnlyMeasures();
        private removeSelectionIdsExceptOnlyMeasures();
    }
}
declare module powerbi.extensibility.utils.interactivity {
    import IPoint = powerbi.extensibility.utils.svg.shapes.IPoint;
    module interactivityUtils {
        function getPositionOfLastInputEvent(): IPoint;
        function registerStandardSelectionHandler(selection: d3.Selection<any>, selectionHandler: ISelectionHandler): void;
        function registerGroupSelectionHandler(group: d3.Selection<any>, selectionHandler: ISelectionHandler): void;
    }
}
