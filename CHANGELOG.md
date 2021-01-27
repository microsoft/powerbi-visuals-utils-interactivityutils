## 5.7.1
* Packages update
* Vulnerabilities fixes

# 5.7.0
* Packages updates
* Github actions
* Jquery and jasmine-jquery removed

# 5.6.0 (webpack)
* Add basic implementataion of `behaviour` for the visual as `BaseBehavior` class
* Add `contextmenu` support by default for visuals.

## 5.5.3 (webpack)
* libraries update

## 5.5.2 (webpack)
* extractFilterColumnTarget method was corrected to extract table and column name from correct properties for *non* hierarchical data

## 5.5.1 (webpack)
* extractFilterColumnTarget method was corrected to extract table and column name from correct properties for hierarchical data

## 5.5.0 (webpack)
* Update packages to fix vulnerabilities
* Update powerbi-visual-api to 2.6

## 5.4.2 (webpack)
* extractFilterColumnTarget method was corrected to extract table and column name from correct properties

## 5.4.1 (webpack)
* Add jsnext:main
* Remove internal selectedIds
* Update testutils, typeutils and svgutils 

## 4.4.0 / 5.4.0 (webpack)
* Rename SelectableDataPoint to BaseDataPoint.
* Rename SelectionDataPoint to SelectableDataPoint 

## 4.3.0 / 5.2.0 (webpack)
* REM: filterManager.ts
* REM: interactivityservice.ts
* ADD: interactivityBaseService.ts that contains basic and abstract methods for selection and filtering
* ADD: interactivitySelectionService.ts that extends interactivityBaseService.ts to support selection as before but some old methods were removed
* ADD: interactivityFilterService.ts that extends interactivityBaseService.ts to support JSON filtering from last APIs

## 4.2.0 / 5.2.0 (webpack)
* Update packages to fix vulnerabilities

## 4.1.1
* UPD: function checkDatapointAgainstSelectedIds was refactored

## 4.1.0
* REM: function restoreSelectionIds from filter manager because it's unsupportable anymore with API 2.1
* REM: function applySelectionFromFilter from service because it's unsupportable anymore with API 2.1
* REM: function isDataPointSelected from service because it's incompatible with API 2.1 for a while
* ADD: exportable function checkDatapointAgainstSelectedIds to provide compatibility with API 2.1

## 3.2.0
* UPD: ability to select multiple data points via `handleSelection` method

## 3.1.0 (webpack)
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
