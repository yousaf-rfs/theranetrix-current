# Doctor Focus concept

The updated Current home-screen preview, delivered through the existing `current-preview` deployment branch. Forest Green remains a separate, unchanged version.

## Design hypothesis

A clinician should be able to scan the patient, recorded review concern, and change in reported scores before opening more information. This is a design hypothesis for client feedback, not a measured time-saving claim.

- Start on Needs review, with All patients and Side effects as compact filters.
- Keep the existing recorded-priority ordering and attention rules.
- Replace large patient cards with compact rows, small score bars, and numerical score changes.
- Put medication response, date of birth, supporting concerns, and plans in the selected patient's review panel.
- Keep full-record and Next patient actions near the top. Viewing does not complete a review.
- Use Current's navigation, Plex typography, neutral backgrounds, and green selection color.

This frontend-only concept uses the same sample patients and existing data helpers. Search, filters, selection, disclosure, and Next patient work locally. Other screens and saving remain explicitly outside the preview.

## Local preview

Run `npm run dev -- --hostname 127.0.0.1 --port 3044` with the repository Node runtime. This local development route is not password-gated. The inherited deployment packaging still protects the production export.
