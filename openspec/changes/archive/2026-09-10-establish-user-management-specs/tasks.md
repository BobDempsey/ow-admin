## 1. Review

- [ ] 1.1 Review the six new capability specs (`admin-navigation`,
  `user-list`, `user-management`, `password-reset`, `user-api-client`,
  `accessibility`) against `SPEC.md` and verify no requirement from
  `SPEC.md` was dropped
- [ ] 1.2 Run `openspec validate establish-user-management-specs --strict`
  and verify it passes with no errors

## 2. Archive

- [ ] 2.1 Run `/opsx:archive establish-user-management-specs` and verify
  the six spec files land under `openspec/specs/`
- [ ] 2.2 Delete `SPEC.md` and verify `openspec/specs/` is the only
  remaining source of requirements
