# interactivityService
> The ```interactivityService``` module provides some special methods for visuals interaction.

The ```powerbi.extensibility.utils.interactivity``` module provides the following functions and interfaces:

* [createInteractivityService](#createInteractivityService)
* [appendClearCatcher](#appendClearCatcher)
* [applySelectionStateToData](#applySelectionStateToData)
* [hasSelection](#hasSelection)
* [legendHasSelection](#legendHasSelection)
* [handleSelection](#handleSelection)

## createInteractivityService
Method to create an IInteractivityService instance.

```typescript
function createInteractivityService(hostServices: IVisualHost): IInteractivityService
```

## appendClearCatcher
Creates svg rect to catch clear clicks.

```typescript
function appendClearCatcher(selection: d3.Selection<any>): d3.Selection<any>
```

## applySelectionStateToData
Changes selected state for each of your dataPoints based on current selection.

```typescript
public applySelectionStateToData(dataPoints: SelectableDataPoint[], hasHighlights?: boolean): boolean
```

## hasSelection
Checks whether there is at least one item selected.

```typescript
public hasSelection(): boolean
```

## legendHasSelection
Checks whether there is at least one legend item selected.
```typescript
public legendHasSelection(): boolean
```

## handleSelection
Sends selection based on dataPoint identity to the service

```typescript
public handleSelection(dataPoint: SelectableDataPoint, multiSelect: boolean): void
```