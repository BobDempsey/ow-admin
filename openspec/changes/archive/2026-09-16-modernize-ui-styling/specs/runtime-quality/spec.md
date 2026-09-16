## MODIFIED Requirements

### Requirement: No console errors or warnings

The admin UI SHALL log no console errors and no console warnings, and SHALL throw no uncaught errors or unhandled promise rejections, on any screen or flow, in the light and dark themes, at 1280 and 320 CSS pixels wide. This covers the user list (paging, page size, sorting, search, the Role and Status filters, removing filter chips, Clear all, Clear filters in the empty state, the row Actions menu, a password reset sent from a row, and Table settings), the create screen (a rejected and a successful submit), the user detail screen (save, cancel, the save bar, the simulated edit, every edit conflict choice, and the password reset), the not-found user, the About screen, the Theme menu, and the navigation drawer.

#### Scenario: Browsing every screen logs nothing
- **WHEN** an admin opens `/users`, `/users/new`, an existing user, a missing user and `/about`, in either theme, at 1280 or 320 px
- **THEN** the browser console shows no error or warning and the page throws no uncaught error

#### Scenario: Operating the list logs nothing
- **WHEN** an admin pages the list, changes the page size, sorts a column, searches, picks a role or a status, removes a filter chip, uses Clear all and Clear filters, opens a row's Actions menu and follows View, and toggles each Table setting
- **THEN** the browser console shows no error or warning

#### Scenario: Forms and dialogs log nothing
- **WHEN** an admin submits the empty create form, creates a user, saves a user, resolves an edit conflict with Keep editing, Reload or Overwrite, and sends or cancels a password reset from the detail screen or from a row's Actions menu
- **THEN** the browser console shows no error or warning

#### Scenario: Header controls log nothing
- **WHEN** an admin picks each choice in the Theme menu, or opens the navigation drawer at 320 px and follows an entry
- **THEN** the browser console shows no error or warning

#### Scenario: A forced failure logs only what the app expects
- **WHEN** a browser check forces a list load, detail load, save or password reset to fail
- **THEN** the screen shows its alert and the browser console shows no error or warning
