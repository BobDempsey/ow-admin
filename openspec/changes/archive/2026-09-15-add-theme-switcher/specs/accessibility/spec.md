## MODIFIED Requirements

### Requirement: Sufficient color contrast

Text and meaningful UI elements SHALL meet WCAG 2.2 contrast minimums in both the light and the dark theme.

#### Scenario: Text contrast check
- **WHEN** any body text or control label is rendered
- **THEN** its contrast ratio against its background meets WCAG 2.2 AA minimums

#### Scenario: Contrast in both themes
- **WHEN** any screen, state or the conflict dialog is rendered in the light theme and again in the dark theme
- **THEN** text meets 4.5:1 (3:1 for large text), and focus indicators, input borders and the selected theme and nav indicators meet 3:1 against their backgrounds, in each theme
