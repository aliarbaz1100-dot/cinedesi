QA restoration checkpoint (2026-09-19).
The experimental iOS installed-app startup overlay introduced regressions, so index.html was restored to the earlier stable QA implementation.
Keep the accepted episode navigation, catalog, UI and media sources unchanged.
Do not merge this branch into live cinedesi.online. The physical iOS Home Screen startup animation is not verified and remains a release blocker.

QA icon intro review (2026-09-19): Browser/preview animation and native iOS PWA have different startup lifecycles. Updated only the installed QA icon splash to start a clearly visible logo reveal after native launch, then crossfade into the approved Home page. Preserve production and do not merge until the user's real iPhone 13 approves it.
