## Purpose

Tells a visitor, in a short landing-page style, what the admin app does, how its data behaves, how to try its edit conflict flow, and how it was built.

## ADDED Requirements

### Requirement: About screen reachable from the nav

The system SHALL provide an About screen at `/about`, reachable from an About entry in the top navigation bar placed after the placeholder entries. Its document title SHALL be `About | Orbweaver Admin` and it SHALL have one level 1 heading.

#### Scenario: Open About from the nav
- **WHEN** an admin activates the About nav entry
- **THEN** the URL becomes `/about`, the document title is `About | Orbweaver Admin`, and focus moves to the screen's level 1 heading

#### Scenario: Open About by URL
- **WHEN** an admin opens `/about` directly
- **THEN** the About screen loads instead of redirecting to the user list

### Requirement: About screen content

The About screen SHALL have a section, each with a level 2 heading, for what the app does, how its data works, how to try an edit conflict, accessibility, and development. The development section SHALL list the tooling used to build the app, naming OpenSpec and the AI tools used.

#### Scenario: Sections present
- **WHEN** the About screen loads
- **THEN** it shows five level 2 headings covering what the app does, how the data works, trying an edit conflict, accessibility, and development

#### Scenario: Data behavior explained
- **WHEN** an admin reads the data section
- **THEN** it says the API runs in the browser over an in-memory store of 500,000 users, that saves use ETags and can conflict, and that data resets on reload

#### Scenario: Conflict flow steps
- **WHEN** an admin reads the edit conflict section
- **THEN** it gives steps that start from a user's detail screen, use "Simulate an edit by another admin", then Save, and name the dialog's choices

#### Scenario: Development tooling listed
- **WHEN** an admin reads the development section
- **THEN** it lists the framework, styling, test and formatting tools, OpenSpec, and the AI tools used to build the app

#### Scenario: Links to user screens
- **WHEN** an admin activates a link to the user list or to creating a user on the About screen
- **THEN** the matching screen loads

### Requirement: Concise About copy

Each About section SHALL be short: at most two sentences of body text, or one list with one short line per item.

#### Scenario: Section length
- **WHEN** a reviewer reads any About section
- **THEN** it has no more than two sentences of body text, or a single list of short items
