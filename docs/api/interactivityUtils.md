# interactivityUtils
> The ```interactivityUtils``` module provides additional utils for visuals interaction.

The ```powerbi.extensibility.utils.interactivity.interactivityUtils``` module provides the following functions and interfaces:

* [getPositionOfLastInputEvent](#getpositionoflastinputevent)
* [registerStandardSelectionHandler](#registerstandardselectionhandler)
* [registerGroupSelectionHandler](#registergroupselectionhandler)

## getPositionOfLastInputEvent
Returns position of the last input event

```typescript
function getPositionOfLastInputEvent(): IPoint
```

## registerStandardSelectionHandler
Returns position of the last input event

```typescript
function registerStandardSelectionHandler(selection: d3.Selection<any>, selectionHandler: ISelectionHandler): void
```

## registerGroupSelectionHandler
Returns position of the last input event

```typescript
function registerGroupSelectionHandler(group: d3.Selection<any>, selectionHandler: ISelectionHandler): void
```

## handleSelection
Sends selection based on dataPoint identity to the service

```typescript
function handleSelection(d: SelectableDataPoint, selectionHandler: ISelectionHandler): void
```
