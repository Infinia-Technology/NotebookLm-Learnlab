#!/bin/bash

#
# Project Verification Script
#
# This script verifies the project configuration and structure.
# Run after initialization or before deployment.
#
# Usage:
#   ./verify-project.sh
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Counters
PASSED=0
WARNINGS=0
FAILED=0

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Helper functions
pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASSED++)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; ((WARNINGS++)); }
fail() { echo -e "  ${RED}✗${NC} $1"; ((FAILED++)); }
check() { echo -e "  ${BLUE}→${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}$1${NC}\n${DIM}$(printf '=%.0s' {1..50})${NC}"; }

# Banner
echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║           PROJECT VERIFICATION SCRIPT                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# Configuration Files
# ============================================
header "Configuration Files"

check "Checking system.config.json..."
if [[ -f "system.config.json" ]]; then
    pass "system.config.json exists"

    # Extract slug
    if command -v jq &> /dev/null; then
        APP_SLUG=$(jq -r '.app.slug // "unknown"' system.config.json)
        APP_NAME=$(jq -r '.app.name // "unknown"' system.config.json)
    else
        APP_SLUG=$(grep -o '"slug":\s*"[^"]*"' system.config.json | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
        APP_NAME=$(grep -o '"name":\s*"[^"]*"' system.config.json | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    fi
    echo -e "    ${DIM}App: $APP_NAME ($APP_SLUG)${NC}"
else
    fail "system.config.json not found - run ./init-project.sh"
    APP_SLUG=""
fi

check "Checking frontend config..."
if [[ -f "frontend/public/system.config.json" ]]; then
    pass "frontend/public/system.config.json exists"
else
    warn "frontend/public/system.config.json not found"
fi

# ============================================
# Docker Configuration
# ============================================
header "Docker Configuration"

check "Checking docker-compose.yml..."
if [[ -f "docker-compose.yml" ]]; then
    pass "docker-compose.yml exists"
else
    fail "docker-compose.yml not found"
fi

# ============================================
# Layout Components
# ============================================
header "Layout Components"

check "Checking Sidebar..."
[[ -f "frontend/src/components/layout/Sidebar.tsx" ]] && pass "Sidebar.tsx exists" || warn "Sidebar.tsx not found"

check "Checking AppShell..."
[[ -f "frontend/src/components/layout/AppShell.tsx" ]] && pass "AppShell.tsx exists" || warn "AppShell.tsx not found"

check "Checking HeaderBar..."
[[ -f "frontend/src/components/layout/HeaderBar.tsx" ]] && pass "HeaderBar.tsx exists" || warn "HeaderBar.tsx not found"

# ============================================
# Design System
# ============================================
header "Design System"

check "Checking design-tokens.css..."
if [[ -f "frontend/src/design-system/design-tokens.css" ]]; then
    pass "design-tokens.css exists"
else
    fail "design-tokens.css not found"
fi

# Quick scan for raw HTML elements (pages only)
check "Scanning pages for raw form elements..."
RAW_ELEMENTS=0
for pattern in '<input' '<button' '<select' '<textarea'; do
    count=$(grep -r "$pattern" frontend/src/pages 2>/dev/null | wc -l | tr -d ' ')
    RAW_ELEMENTS=$((RAW_ELEMENTS + count))
done

if [[ "$RAW_ELEMENTS" -gt 0 ]]; then
    warn "Found $RAW_ELEMENTS raw HTML form elements in pages/"
    echo -e "    ${DIM}Consider using design system components${NC}"
else
    pass "No raw HTML form elements in pages/"
fi

# ============================================
# Guardrail Files
# ============================================
header "Guardrail Files"

check "Checking .cursorrules..."
[[ -f ".cursorrules" ]] && pass ".cursorrules exists" || warn ".cursorrules not found"

check "Checking ai-guidelines.md..."
[[ -f "ai-guidelines.md" ]] && pass "ai-guidelines.md exists" || warn "ai-guidelines.md not found"

# ============================================
# YAML Validation
# ============================================
header "YAML Validation"

check "Validating docker-compose.yml..."
if [[ -f "docker-compose.yml" ]]; then
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" 2>/dev/null; then
            pass "docker-compose.yml is valid YAML"
        else
            fail "docker-compose.yml has invalid YAML"
        fi
    else
        warn "No YAML validator available"
    fi
fi

# ============================================
# App Generation System
# ============================================
header "App Generation System"

check "Checking template registry..."
if [[ -f "templates/registry.json" ]]; then
    pass "templates/registry.json exists"

    # Validate JSON
    if command -v jq &> /dev/null; then
        if jq . templates/registry.json > /dev/null 2>&1; then
            TEMPLATE_COUNT=$(jq '.templates | length' templates/registry.json)
            echo -e "    ${DIM}$TEMPLATE_COUNT templates defined${NC}"
        else
            fail "templates/registry.json has invalid JSON"
        fi
    fi
else
    warn "templates/registry.json not found"
fi

check "Checking generated apps registry..."
if [[ -f "templates/generated-apps.json" ]]; then
    pass "templates/generated-apps.json exists"

    # Count generated apps
    if command -v jq &> /dev/null; then
        if jq . templates/generated-apps.json > /dev/null 2>&1; then
            APP_COUNT=$(jq '.apps | length' templates/generated-apps.json)
            echo -e "    ${DIM}$APP_COUNT apps generated${NC}"
        else
            fail "templates/generated-apps.json has invalid JSON"
        fi
    fi
else
    warn "templates/generated-apps.json not found"
fi

check "Checking frontend generated-apps.json..."
if [[ -f "frontend/public/generated-apps.json" ]]; then
    pass "frontend/public/generated-apps.json exists"
else
    warn "frontend/public/generated-apps.json not found - run generate-app.sh"
fi

# Verify generated apps have all required files
if [[ -f "templates/generated-apps.json" ]] && command -v jq &> /dev/null; then
    APP_COUNT=$(jq '.apps | length' templates/generated-apps.json)

    if [[ "$APP_COUNT" -gt 0 ]]; then
        check "Verifying generated app files..."

        APPS_VALID=0
        APPS_INVALID=0

        for i in $(seq 0 $((APP_COUNT - 1))); do
            APP_NAME=$(jq -r ".apps[$i].name" templates/generated-apps.json)
            APP_SLUG=$(jq -r ".apps[$i].slug" templates/generated-apps.json)
            SLUG_SNAKE=$(echo "$APP_SLUG" | tr '-' '_')

            MISSING=""

            # Check backend module
            [[ ! -d "backend/app/modules/$SLUG_SNAKE" ]] && MISSING+="backend module, "
            [[ ! -f "backend/app/modules/$SLUG_SNAKE/router.py" ]] && MISSING+="router.py, "
            [[ ! -f "backend/app/modules/$SLUG_SNAKE/service.py" ]] && MISSING+="service.py, "
            [[ ! -f "backend/app/modules/$SLUG_SNAKE/schemas.py" ]] && MISSING+="schemas.py, "

            # Check ODM
            [[ ! -f "backend/app/odm/generated/$SLUG_SNAKE.py" ]] && MISSING+="odm model, "

            # Check frontend
            [[ ! -f "frontend/src/pages/generated/$APP_SLUG/index.tsx" ]] && MISSING+="frontend page, "
            [[ ! -f "frontend/src/modules/$APP_SLUG/types.ts" ]] && MISSING+="types, "

            if [[ -z "$MISSING" ]]; then
                ((APPS_VALID++))
            else
                ((APPS_INVALID++))
                MISSING="${MISSING%, }"  # Remove trailing comma
                warn "App '$APP_NAME' missing: $MISSING"
            fi
        done

        if [[ "$APPS_INVALID" -eq 0 ]]; then
            pass "All $APPS_VALID generated apps have complete files"
        else
            warn "$APPS_INVALID of $APP_COUNT apps have missing files"
        fi

        # Check router registration
        check "Checking router registrations..."

        REGISTERED=0
        UNREGISTERED=0

        for i in $(seq 0 $((APP_COUNT - 1))); do
            APP_SLUG=$(jq -r ".apps[$i].slug" templates/generated-apps.json)
            SLUG_SNAKE=$(echo "$APP_SLUG" | tr '-' '_')

            # Check if exported in __init__.py
            if grep -q "${SLUG_SNAKE}_router" backend/app/modules/__init__.py 2>/dev/null; then
                # Check if registered in api.py
                if grep -q "${SLUG_SNAKE}_router" backend/app/api/api.py 2>/dev/null; then
                    ((REGISTERED++))
                else
                    ((UNREGISTERED++))
                    warn "Router '${SLUG_SNAKE}_router' exported but not registered in api.py"
                fi
            else
                ((UNREGISTERED++))
                warn "Router '${SLUG_SNAKE}_router' not exported in modules/__init__.py"
            fi
        done

        if [[ "$UNREGISTERED" -eq 0 ]] && [[ "$REGISTERED" -gt 0 ]]; then
            pass "All $REGISTERED app routers properly registered"
        elif [[ "$REGISTERED" -eq 0 ]] && [[ "$APP_COUNT" -gt 0 ]]; then
            warn "No app routers registered - complete manual integration steps"
        fi
    fi
fi

# ============================================
# Summary
# ============================================
header "Summary"

echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo ""

if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}${BOLD}Some critical checks failed!${NC}"
    exit 2
elif [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}${BOLD}Verification complete with warnings.${NC}"
    exit 1
else
    echo -e "${GREEN}${BOLD}All checks passed!${NC}"
    exit 0
fi
