## 3.2.0
* UPD: ability to select multiple data points via `handleSelection` method

## 3.1.0
* ADD: ability to support Power BI bookmarks

## 3.0.1
* Rename `applySelectionFromFitler` to `applySelectionFromFilter`

## 3.0.0
* New restoreFilter method of FilterManager class for converting AppliedFilter to IFilter (Basic or Advanced filter)

## 2.0.2
* New FilterManager class with restoreSelectionIds method for converting AppliedFilter to ISelectionId

## 2.0.1
* UPD: syncSelectionState function declaration was added to ISelectionHandler interface

## 2.0.0
* UPD: handleSelection public function contains optional parameter for skipping of state synchronization action
* UPD: syncSelectionState function became public. It lets to run it separately after all data points were proceeded over handleSelection to significantly increase performance for selection events

## 1.0.0
* Update packages
* Unified dependencies versions
