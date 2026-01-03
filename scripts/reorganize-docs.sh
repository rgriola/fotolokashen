#!/bin/bash

# Documentation Reorganization Script
# Created: 2026-01-03
# Purpose: Move 68 historical .md files from root to /docs/ subdirectories

echo "📚 Starting documentation reorganization..."
echo ""

# Ensure we're in the project root
cd "$(dirname "$0")/.." || exit 1

# Create backup of current state
echo "📦 Creating backup..."
mkdir -p .backup/docs-reorganization-$(date +%Y%m%d)
find . -maxdepth 1 -name "*.md" -type f -exec cp {} .backup/docs-reorganization-$(date +%Y%m%d)/ \;
echo "✅ Backup created in .backup/docs-reorganization-$(date +%Y%m%d)/"
echo ""

# Move files to archive
echo "📁 Moving completed feature docs to /docs/archive/..."
mv ADMIN_DELETE_USER_FEATURE.md docs/archive/
mv ADMIN_USER_MANAGEMENT_FEATURE_COMPLETE.md docs/archive/
mv DB_MIGRATION_DUPLICATES.md docs/archive/
mv DUPLICATE_LOCATION_CONSTRAINT_REMOVAL.md docs/archive/
mv ENV_CONSOLIDATION.md docs/archive/
mv GPS_HYBRID_IMPLEMENTATION_COMPLETE.md docs/archive/
mv HOME_LOCATION_IMPLEMENTATION_COMPLETE.md docs/archive/
mv HOME_LOCATION_PHASE2_COMPLETE.md docs/archive/
mv LOCATION_CONSTANTS_COMPLETE.md docs/archive/
mv MY_LOCATIONS_BUTTON_FEATURE.md docs/archive/
mv PHOTO_FLAT_DIRECTORY.md docs/archive/
mv USER_SPECIFIC_LOCATIONS_ARCHITECTURE.md docs/archive/
mv VERCEL_500_PRISMA_FIX.md docs/archive/
echo "✅ Archive complete"
echo ""

# Move files to troubleshooting
echo "🔧 Moving troubleshooting docs to /docs/troubleshooting/..."
mv AVATAR_ENVIRONMENT_ANALYSIS.md docs/troubleshooting/
mv DATABASE_INDEX_STRATEGY.md docs/troubleshooting/
mv FIX_500_ERROR_PRISMA_CLIENT.md docs/troubleshooting/
mv HOME_LOCATION_AUTH_FIX.md docs/troubleshooting/
mv HOME_LOCATION_FIXES.md docs/troubleshooting/
mv IMAGE_UPLOAD_ERROR_500.md docs/troubleshooting/
mv LOGOUT_REDIRECT_FIX.md docs/troubleshooting/
mv MAP_STATE_OPTIMIZATION.md docs/troubleshooting/
mv PHOTO_UPLOAD_ERROR.md docs/troubleshooting/
mv PRISMA_CLIENT_MODULE_ERROR.md docs/troubleshooting/
mv SAVE_PANEL_TYPE_FIXES.md docs/troubleshooting/
mv TURBOPACK_ERRORS_RESOLVED.md docs/troubleshooting/
echo "✅ Troubleshooting complete"
echo ""

# Move files to setup
echo "⚙️  Moving setup guides to /docs/setup/..."
mv ENVIRONMENT_VALIDATION.md docs/setup/
mv ESLINT_PRETTIER_SETUP.md docs/setup/
mv FIRST_DEPLOYMENT_SETUP.md docs/setup/
mv MIGRATION_READINESS.md docs/setup/
mv NEXTAUTH_EMAIL_CONFIG.md docs/setup/
mv NEXTAUTH_MIGRATION_COMPLETE.md docs/setup/
echo "✅ Setup complete"
echo ""

# Move files to features
echo "✨ Moving feature implementation logs to /docs/features/..."
mv AVATAR_LOADING_FIX.md docs/features/
mv GPS_PERMISSION_STRATEGY.md docs/features/
mv GPS_PERMISSION_TOGGLE.md docs/features/
mv GPS_TOGGLE_FEATURE.md docs/features/
mv HOME_LOCATION_FEATURE_ANALYSIS.md docs/features/
mv PHOTO_LOCATION_IMPLEMENTATION.md docs/features/
mv PHOTO_UPLOAD_ENHANCEMENT.md docs/features/
mv SEARCH_REFACTOR_PLAN.md docs/features/
echo "✅ Features complete"
echo ""

# Move files to planning
echo "📋 Moving planning docs to /docs/planning/..."
mv CODE_CLEANUP_PLAN.md docs/planning/
mv CONSTANTS_CENTRALIZATION.md docs/planning/
mv FORM_CONSOLIDATION.md docs/planning/
mv GITHUB_STRATEGY.md docs/planning/
mv LOGIN_LOGOUT_FLOW.md docs/planning/
mv PRISMA_REFACTOR_PLAN.md docs/planning/
mv REFACTOR_NOTES.md docs/planning/
mv REFACTOR_PHASES.md docs/planning/
mv REFACTOR_STATUS.md docs/planning/
mv STATE_MANAGEMENT_PLAN.md docs/planning/
mv TESTING_PLAN.md docs/planning/
echo "✅ Planning complete"
echo ""

# Move files to ui-ux
echo "🎨 Moving UI/UX docs to /docs/ui-ux/..."
mv EDIT_DIALOG_UPDATES.md docs/ui-ux/
mv LOGOUT_STYLING.md docs/ui-ux/
mv PREFERENCE_CHANGE_UX_OPTIONS.md docs/ui-ux/
mv TAILWIND_REFACTOR_PLAN.md docs/ui-ux/
mv UI_UX_PLAN.md docs/ui-ux/
echo "✅ UI/UX complete"
echo ""

# Move files to process
echo "⚙️  Moving process docs to /docs/process/..."
mv API_REFACTOR_PLAN.md docs/process/
mv AUTH_MIGRATION_PLAN.md docs/process/
mv CLEANUP_COMPLETE.md docs/process/
mv CLEANUP_NOTES.md docs/process/
mv DOCS_REORGANIZATION_SUMMARY.md docs/process/
mv DOCUMENTATION_INDEX.md docs/process/
mv NEXTAUTH_MIGRATION_STATUS.md docs/process/
mv PROGRESS_SUMMARY.md docs/process/
mv TYPESCRIPT_MIGRATION_PLAN.md docs/process/
echo "✅ Process complete"
echo ""

# Move files to notes
echo "📝 Moving miscellaneous notes to /docs/notes/..."
mv 00_NOTE_DB.md docs/notes/
mv IMAGEKIT_NOTES.md docs/notes/
mv IMPLEMENTATION_NOTES.md docs/notes/
mv MAP_STATE_NOTES.md docs/notes/
mv REFACTOR_CHECKLIST.md docs/notes/
mv SESSION_NOTES.md docs/notes/
echo "✅ Notes complete"
echo ""

# Count results
TOTAL_MOVED=$(find docs -type f -name "*.md" | wc -l | tr -d ' ')
REMAINING=$(find . -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Reorganization complete!"
echo ""
echo "📊 Results:"
echo "   • Files moved: $TOTAL_MOVED"
echo "   • Files remaining in root: $REMAINING"
echo ""
echo "📁 Files organized into:"
echo "   • /docs/archive/ (completed features)"
echo "   • /docs/troubleshooting/ (bug fixes)"
echo "   • /docs/setup/ (setup guides)"
echo "   • /docs/features/ (feature logs)"
echo "   • /docs/planning/ (planning docs)"
echo "   • /docs/ui-ux/ (UI/UX docs)"
echo "   • /docs/process/ (process docs)"
echo "   • /docs/notes/ (misc notes)"
echo ""
echo "📝 Remaining in root (active docs):"
find . -maxdepth 1 -name "*.md" -type f | sort
echo ""
echo "🎉 Done!"
