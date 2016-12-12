# interactivityService
> The ```interactivityService``` module provides some special methods for visuals interaction.

The ```powerbi.extensibility.utils.interactivity``` module provides the following functions and interfaces:

* [createInteractivityService](#createinteractivityservice)
* [appendClearCatcher](#appendclearcatcher)
* [applySelectionStateToData](#applyselectionstatetodata)
* [handleSelection](#handleselection)
* [hasSelection](#hasselection)
* [legendHasSelection](#legendhasselection)

## createInteractivityService
Creates an instance of IInteractivityService.

```typescript
function createInteractivityService(hostServices: IVisualHost): IInteractivityService
```

### Example

```typescript
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

export class YourVisual implements IVisual {
    // Implementation of IVisual

    constructor(options: VisualConstructorOptions) {
        createInteractivityService(options.host); // returns an instance of IInteractivityService
    }
}
```

You can take a look at the example code of the custom visual [here](https://github.com/Microsoft/powerbi-visuals-sankey/blob/4d544ea145b4e15006083a3610dfead3da5f61a4/src/visual.ts#L204).

## appendClearCatcher
Creates svg rect to catch clear clicks.

```typescript
function appendClearCatcher(selection: d3.Selection<any>): d3.Selection<any>
```

### Example

```typescript
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;

export class YourVisual implements IVisual {
    // Implementation of IVisual

    constructor(options: VisualConstructorOptions) {
        appendClearCatcher(d3.select(options.element)); // returns a DOM element
    }
}
```

You can take a look at the example code of the custom visual [here](https://github.com/Microsoft/powerbi-visuals-sankey/blob/4d544ea145b4e15006083a3610dfead3da5f61a4/src/visual.ts#L206).


## applySelectionStateToData
Changes selected state for each of your dataPoints based on current selection.

```typescript
public applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean
```

### Example

```typescript
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

export class YourVisual implements IVisual {
    // Implementation of IVisual

    private interactivityService: IInteractivityService;

    constructor(options: VisualConstructorOptions) {
        this.interactivityService = createInteractivityService(options.host);
    }

    public update(visualUpdateOptions: VisualUpdateOptions): void {
        let dataPoints: SelectableDataPoint[] = [...];

        this.interactivityService.applySelectionStateToData(dataPoints); // Applies current selection state to the dataPoints
    }
}
```

You can take a look at the example code of the custom visual [here](https://github.com/Microsoft/powerbi-visuals-sankey/blob/4d544ea145b4e15006083a3610dfead3da5f61a4/src/visual.ts#L878).

## handleSelection
Sends selection based on dataPoint identity to the service

```typescript
public handleSelection(dataPoint: SelectableDataPoint, multiSelect: boolean): void
```

### Example

```typescript
import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;

export interface YourBehaviorOptions {
    selection: d3.Selection<SelectableDataPoint>;
}

export class YourBehavior implements IInteractiveBehavior {
    // Implementation of IInteractiveBehavior

    public bindEvents(
        behaviorOptions: YourBehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        const multiSelect: boolean = true;

        behaviorOptions.selection.on("click", (dataPoint: SelectableDataPoint) => {
            selectionHandler.handleSelection(subDataPoint, multiSelect); // Selects the dataPoint
        });
    }
}
```

You can take a look at the example code of the custom visual [here](https://github.com/Microsoft/powerbi-visuals-sankey/blob/4d544ea145b4e15006083a3610dfead3da5f61a4/src/behavior.ts#L78).

## hasSelection
Checks whether there is at least one item selected.

```typescript
public hasSelection(): boolean
```

### Example

```typescript
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

export class YourVisual implements IVisual {
    // Implementation of IVisual

    private interactivityService: IInteractivityService;

    constructor(options: VisualConstructorOptions) {
        this.interactivityService = createInteractivityService(options.host);
    }

    public update(visualUpdateOptions: VisualUpdateOptions): void {
         this.interactivityService.hasSelection(); // returns true if any dataPoints are selected
    }
}
```

## legendHasSelection
Checks whether there is at least one legend item selected.
```typescript
public legendHasSelection(): boolean
```

### Example

```typescript
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

export class YourVisual implements IVisual {
    // Implementation of IVisual

    private interactivityService: IInteractivityService;

    constructor(options: VisualConstructorOptions) {
        this.interactivityService = createInteractivityService(options.host);
    }

    public update(visualUpdateOptions: VisualUpdateOptions): void {
         this.interactivityService.legendHasSelection(); // returns true if any dataPoints of the legend are selected
    }
}
```
