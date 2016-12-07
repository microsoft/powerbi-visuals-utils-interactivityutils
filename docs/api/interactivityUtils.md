# interactivityUtils
> The ```interactivityUtils``` module provides additional utils for visuals interaction.

The ```powerbi.extensibility.utils.interactivity.interactivityUtils``` module provides the following functions and interfaces:

* [getPositionOfLastInputEvent](#getpositionoflastinputevent)
* [registerStandardSelectionHandler](#registerstandardselectionhandler)
* [registerGroupSelectionHandler](#registergroupselectionhandler)

## getPositionOfLastInputEvent
This function returns position of the last input event

```typescript
function getPositionOfLastInputEvent(): IPoint
```

### Example

```typescript
import getPositionOfLastInputEvent = powerbi.extensibility.utils.interactivity.interactivityUtils.getPositionOfLastInputEvent;

let selection: d3.Selection<any> = ...;

selection.on("click", () => {
    getPositionOfLastInputEvent(); // returns position of the mouse event
});
```

## registerStandardSelectionHandler
This function registers the click event to the current selection.

```typescript
function registerStandardSelectionHandler(selection: d3.Selection<any>, selectionHandler: ISelectionHandler): void
```

### Example

```typescript
import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
import registerStandardSelectionHandler = powerbi.extensibility.utils.interactivity.interactivityUtils.registerStandardSelectionHandler;

export interface YourBehaviorOptions {
    selection: d3.Selection<SelectableDataPoint>;
}

export class YourBehavior implements IInteractiveBehavior {
    // Implementation of IInteractiveBehavior

    public bindEvents(
        behaviorOptions: YourBehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        registerStandardSelectionHandler(behaviorOption.selection, selectionHandler); // registers the click event
    }
}
```

## registerGroupSelectionHandler
This function registers the click event to the current grouped selection.

```typescript
function registerGroupSelectionHandler(group: d3.Selection<any>, selectionHandler: ISelectionHandler): void
```

```typescript
import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
import registerGroupSelectionHandler = powerbi.extensibility.utils.interactivity.interactivityUtils.registerGroupSelectionHandler;

export interface YourBehaviorOptions {
    selection: d3.Selection<SelectableDataPoint>;
}

export class YourBehavior implements IInteractiveBehavior {
    // Implementation of IInteractiveBehavior

    public bindEvents(
        behaviorOptions: YourBehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        registerGroupSelectionHandler(behaviorOption.selection, selectionHandler); // registers the click event
    }
}
```
