# Write API Key Rotation Log

Track all LOCATION_MAPPINGS_WRITE_API_KEY rotations.

## Rotation Template

- Date (UTC):
- Operator:
- Trigger:
- Old key revoked at:
- New key deployed at:
- Clients updated:
  - [ ] Backend service env updated
  - [ ] CI/CD secrets updated
  - [ ] External callers updated
- Validation:
  - [ ] Authenticated writes succeed with new key
  - [ ] Old key returns 401
  - [ ] No unexpected 401 spikes after cutover
- Notes:

## Rotation History

- YYYY-MM-DD: (fill with the template above)
