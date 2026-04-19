#!/bin/bash

# clone_starter.sh - Clone all 6 testomniac projects from GitHub to a new app
#
# Usage:
#   ./clone_starter.sh
#   ./clone_starter.sh "Cravings"
#
# This script clones the 6 testomniac repos from GitHub (latest main branch),
# renames them to the new app name, and updates all package names, imports,
# and references accordingly.
#
# Prerequisites:
#   - git must be installed

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

GITHUB_ORG="johnqh"
SUFFIXES=("types" "api" "client" "lib" "app" "app_rn")

# ============================================================================
# Functions
# ============================================================================

prompt_app_name() {
    if [ -n "${1:-}" ]; then
        APP_NAME="$1"
    else
        read -rp "Enter the app name (e.g., Cravings): " APP_NAME
    fi

    if [ -z "$APP_NAME" ]; then
        echo "Error: App name cannot be empty."
        exit 1
    fi

    # Derive lowercase name: lowercase + remove non-alphanumeric
    APP_LOWER=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]')

    if [ -z "$APP_LOWER" ]; then
        echo "Error: App name must contain at least one alphanumeric character."
        exit 1
    fi
}

prompt_target_dir() {
    read -rp "Target directory [$(pwd)]: " TARGET_DIR
    TARGET_DIR="${TARGET_DIR:-$(pwd)}"

    # Expand ~ if used
    TARGET_DIR="${TARGET_DIR/#\~/$HOME}"

    if [ ! -d "$TARGET_DIR" ]; then
        echo "Error: Directory $TARGET_DIR does not exist."
        exit 1
    fi

    TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
}

confirm() {
    echo ""
    echo "=== Clone Configuration ==="
    echo "  App Name:     $APP_NAME"
    echo "  Project Name: $APP_LOWER"
    echo "  Target Dir:   $TARGET_DIR"
    echo ""
    echo "  Will clone from GitHub and create:"
    for suffix in "${SUFFIXES[@]}"; do
        echo "    ${TARGET_DIR}/${APP_LOWER}_${suffix}/"
    done
    echo ""
    echo "  Source repos:"
    for suffix in "${SUFFIXES[@]}"; do
        echo "    git@github.com:${GITHUB_ORG}/testomniac_${suffix}.git"
    done
    echo ""
    read -rp "Proceed? [y/N] " answer
    if [[ ! "$answer" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
}

clone_project() {
    local suffix="$1"
    local repo="git@github.com:${GITHUB_ORG}/testomniac_${suffix}.git"
    local dst="${TARGET_DIR}/${APP_LOWER}_${suffix}"

    if [ -d "$dst" ]; then
        read -rp "⚠️  Directory $dst already exists. Overwrite? [y/N] " overwrite
        if [[ "$overwrite" =~ ^[Yy]$ ]]; then
            rm -rf "$dst"
        else
            echo "  Skipping ${APP_LOWER}_${suffix}"
            return 1
        fi
    fi

    echo "📥 Cloning testomniac_${suffix} → ${APP_LOWER}_${suffix}"
    git clone --depth 1 --branch main "$repo" "$dst" -q

    # Remove the .git directory and reinitialize fresh
    rm -rf "$dst/.git"
}

rename_in_file() {
    local file="$1"
    local old="$2"
    local new="$3"

    if [ -f "$file" ]; then
        # Use different sed syntax for macOS vs Linux
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|${old}|${new}|g" "$file"
        else
            sed -i "s|${old}|${new}|g" "$file"
        fi
    fi
}

rename_in_all_sources() {
    local dir="$1"
    local old="$2"
    local new="$3"

    # Find all .ts, .tsx, .js, .jsx files in src/
    if [ -d "$dir/src" ]; then
        find "$dir/src" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
            rename_in_file "$file" "$old" "$new"
        done
    fi
}

process_project() {
    local suffix="$1"
    local dst="${TARGET_DIR}/${APP_LOWER}_${suffix}"

    if [ ! -d "$dst" ]; then
        return
    fi

    echo "🔧 Processing ${APP_LOWER}_${suffix}"

    # --- package.json ---
    if [ -f "$dst/package.json" ]; then
        # Rename package name
        rename_in_file "$dst/package.json" "@sudobility/testomniac_${suffix}" "@sudobility/${APP_LOWER}_${suffix}"
        rename_in_file "$dst/package.json" "\"testomniac_${suffix}\"" "\"${APP_LOWER}_${suffix}\""

        # Rename all testomniac dependencies
        for dep_suffix in "${SUFFIXES[@]}"; do
            rename_in_file "$dst/package.json" "@sudobility/testomniac_${dep_suffix}" "@sudobility/${APP_LOWER}_${dep_suffix}"
        done

        # Rename keywords
        rename_in_file "$dst/package.json" "\"testomniac\"" "\"${APP_LOWER}\""
    fi

    # --- Source code imports ---
    for dep_suffix in "${SUFFIXES[@]}"; do
        rename_in_all_sources "$dst" "@sudobility/testomniac_${dep_suffix}" "@sudobility/${APP_LOWER}_${dep_suffix}"
    done

    # --- CLAUDE.md ---
    if [ -f "$dst/CLAUDE.md" ]; then
        # Replace package references
        for dep_suffix in "${SUFFIXES[@]}"; do
            rename_in_file "$dst/CLAUDE.md" "testomniac_${dep_suffix}" "${APP_LOWER}_${dep_suffix}"
        done
        # Replace display name references (Testomniac → AppName)
        rename_in_file "$dst/CLAUDE.md" "Testomniac" "$APP_NAME"
        rename_in_file "$dst/CLAUDE.md" "testomniac" "$APP_LOWER"
    fi
}

process_api_specific() {
    local dst="${TARGET_DIR}/${APP_LOWER}_api"

    if [ ! -d "$dst" ]; then
        return
    fi

    echo "🔧 Processing API-specific files in ${APP_LOWER}_api"

    # Rename PostgreSQL schema name
    if [ -f "$dst/src/db/schema.ts" ]; then
        rename_in_file "$dst/src/db/schema.ts" "pgSchema(\"testomniac\")" "pgSchema(\"${APP_LOWER}\")"
        rename_in_file "$dst/src/db/schema.ts" "testomniac_histories" "${APP_LOWER}_histories"
        rename_in_file "$dst/src/db/schema.ts" "\"testomniac\"" "\"${APP_LOWER}\""
    fi

    # Rename schema name in test
    if [ -f "$dst/src/db/schema.test.ts" ]; then
        rename_in_file "$dst/src/db/schema.test.ts" "\"testomniac\"" "\"${APP_LOWER}\""
        rename_in_file "$dst/src/db/schema.test.ts" "'testomniac'" "'${APP_LOWER}'"
    fi

    # Rename schema name in db/index.ts
    if [ -f "$dst/src/db/index.ts" ]; then
        rename_in_file "$dst/src/db/index.ts" "testomniac" "${APP_LOWER}"
    fi

    # Rename env var references in .env.example
    if [ -f "$dst/.env.example" ]; then
        rename_in_file "$dst/.env.example" "Testomniac API" "${APP_NAME} API"
        rename_in_file "$dst/.env.example" "testomniac" "${APP_LOWER}"
    fi

    # Generate blank .env from .env.example
    generate_blank_env "$dst"
}

process_app_specific() {
    local dst="${TARGET_DIR}/${APP_LOWER}_app"

    if [ ! -d "$dst" ]; then
        return
    fi

    echo "🔧 Processing App-specific files in ${APP_LOWER}_app"

    # Update push_all.sh
    if [ -f "$dst/scripts/push_all.sh" ]; then
        for dep_suffix in "${SUFFIXES[@]}"; do
            rename_in_file "$dst/scripts/push_all.sh" "testomniac_${dep_suffix}" "${APP_LOWER}_${dep_suffix}"
        done
    fi

    # Update clone_starter.sh
    if [ -f "$dst/scripts/clone_starter.sh" ]; then
        rename_in_file "$dst/scripts/clone_starter.sh" "testomniac" "${APP_LOWER}"
        rename_in_file "$dst/scripts/clone_starter.sh" "Testomniac" "${APP_NAME}"
    fi

    # Update localStorage key in WorkspacesPage
    if [ -f "$dst/src/pages/WorkspacesPage.tsx" ]; then
        rename_in_file "$dst/src/pages/WorkspacesPage.tsx" "testomniac_last_entity" "${APP_LOWER}_last_entity"
    fi

    # Generate blank .env from .env.example
    generate_blank_env "$dst"
}

process_app_rn_specific() {
    local dst="${TARGET_DIR}/${APP_LOWER}_app_rn"

    if [ ! -d "$dst" ]; then
        return
    fi

    echo "🔧 Processing React Native-specific files in ${APP_LOWER}_app_rn"

    # Update app.json
    if [ -f "$dst/app.json" ]; then
        rename_in_file "$dst/app.json" "Testomniac" "${APP_NAME}"
        rename_in_file "$dst/app.json" "testomniac-app" "${APP_LOWER}-app"
        rename_in_file "$dst/app.json" "com.sudobility.testomniac" "com.sudobility.${APP_LOWER}"
    fi
}

generate_blank_env() {
    local dir="$1"

    if [ ! -f "$dir/.env.example" ]; then
        echo "  ⚠️  No .env.example found in $dir"
        return
    fi

    echo "  📝 Generating blank .env from .env.example"

    # Copy .env.example to .env, blanking out values but keeping comments and structure
    # Keep lines that are comments (#) or empty, blank out KEY=VALUE lines
    # Exception: keep default values for PORT, NODE_ENV, BUN_ENV, VITE_DEV_MODE, VITE_SHOW_PERFORMANCE_MONITOR
    while IFS= read -r line; do
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
            # Comment or empty line - keep as-is
            echo "$line"
        elif [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*) ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            # Keep defaults for certain keys
            case "$key" in
                PORT|NODE_ENV|BUN_ENV|VITE_DEV_MODE|VITE_SHOW_PERFORMANCE_MONITOR|VITE_API_URL)
                    echo "${key}=${value}"
                    ;;
                *)
                    echo "${key}="
                    ;;
            esac
        else
            echo "$line"
        fi
    done < "$dir/.env.example" > "$dir/.env"

    # Ensure .env is in .gitignore
    if [ -f "$dir/.gitignore" ]; then
        if ! grep -q "^\.env$" "$dir/.gitignore"; then
            echo "" >> "$dir/.gitignore"
            echo "# Environment variables" >> "$dir/.gitignore"
            echo ".env" >> "$dir/.gitignore"
            echo ".env.local" >> "$dir/.gitignore"
        fi
    fi
}

init_git_repo() {
    local dst="$1"

    if [ ! -d "$dst" ]; then
        return
    fi

    echo "  🔀 Initializing git repo in $(basename "$dst")"
    (
        cd "$dst"
        git init -q
        git add -A
        git commit -q -m "Initial commit: cloned from testomniac"
    )
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo "🚀 Entity Starter Project Cloner"
    echo "================================="

    # Get app name
    prompt_app_name "${1:-}"

    # Get target directory
    prompt_target_dir

    # Confirm
    confirm

    echo ""
    echo "=== Step 1: Cloning from GitHub ==="
    for suffix in "${SUFFIXES[@]}"; do
        clone_project "$suffix"
    done

    echo ""
    echo "=== Step 2: Renaming packages and imports ==="
    for suffix in "${SUFFIXES[@]}"; do
        process_project "$suffix"
    done

    echo ""
    echo "=== Step 3: Project-specific processing ==="
    process_api_specific
    process_app_specific
    process_app_rn_specific

    echo ""
    echo "=== Step 4: Initializing git repos ==="
    for suffix in "${SUFFIXES[@]}"; do
        init_git_repo "${TARGET_DIR}/${APP_LOWER}_${suffix}"
    done

    echo ""
    echo "✨ Done! Created ${#SUFFIXES[@]} projects in ${TARGET_DIR}:"
    for suffix in "${SUFFIXES[@]}"; do
        echo "  ✅ ${APP_LOWER}_${suffix}/"
    done

    echo ""
    echo "Next steps:"
    echo "  1. Create GitHub repos for each project"
    echo "  2. Set git remotes: git remote add origin <url>"
    echo "  3. Fill in .env files in ${APP_LOWER}_api and ${APP_LOWER}_app"
    echo "  4. Run 'bun install' in each project"
    echo "  5. Update app-specific content (icons, descriptions, etc.)"
}

main "$@"
