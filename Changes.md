# Change Log
## 4.11.3
- Fix copy to clipboard

## 4.11.2
- Fix display of '</span>' for zhuyin

## 4.11.1
- Bug fixes for addon enabling

## 4.11
- Update CC-CEDICT dictionary to version 2017-12-10
- Disable yellowbridge support due to changes on their site

## 4.9.7
- Show wordlist context menu entry even if popup dictionary is not active, but
  only in the browser_action menu and not the page menu.

## 4.9.6
- Preserve addon activation status between browser restarts
- Show wordlist context menu entry even if popup dictionary is not active

## 4.9.5
- Fix wordlist saving and deletion
- Update jqgrid to 4.15.2

## 4.9.4
- Support 'Preferences' button for about:addons
  - Settings are synced between different computers
- Refactor background scripts to use more asynchronous operations

## Older
- Migration of deprecated Chrome (and for Firefox unimplemented) APIs.
- Code refactoring to pass Mozilla's QA
  - Remove unneeded permissions
  - Update 3rd party libraries
  - Use document fragments to construct popup content
