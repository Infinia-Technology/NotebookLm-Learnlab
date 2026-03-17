#!/bin/bash

#
# App Generation Script
#
# Generates a new application module from templates.
# Creates backend API, frontend pages, and navigation entries.
#
# Usage:
#   ./generate-app.sh
#
# The script will interactively prompt for:
#   - App Name (e.g., "Invoice Manager")
#   - App Slug (e.g., "invoice-manager")
#   - Description
#   - Template Type
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Paths
TEMPLATES_DIR="$SCRIPT_DIR/templates"
REGISTRY_FILE="$TEMPLATES_DIR/registry.json"
GENERATED_APPS_FILE="$TEMPLATES_DIR/generated-apps.json"
BACKEND_DIR="$SCRIPT_DIR/backend/app"
FRONTEND_DIR="$SCRIPT_DIR/frontend/src"

# Ensure templates exist
if [[ ! -f "$REGISTRY_FILE" ]]; then
    echo -e "${RED}Error: Template registry not found at $REGISTRY_FILE${NC}"
    exit 1
fi

# ============================================
# Helper Functions
# ============================================

# Convert to PascalCase (e.g., "invoice-manager" -> "InvoiceManager")
to_pascal_case() {
    echo "$1" | sed -E 's/(^|[-_ ])([a-z])/\U\2/g' | sed 's/[-_ ]//g'
}

# Convert to snake_case (e.g., "invoice-manager" -> "invoice_manager")
to_snake_case() {
    echo "$1" | sed 's/-/_/g' | tr '[:upper:]' '[:lower:]'
}

# Convert to kebab-case (e.g., "Invoice Manager" -> "invoice-manager")
to_kebab_case() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/_/-/g'
}

# Process template file with variable substitution
process_template() {
    local template_file="$1"
    local output_file="$2"

    if [[ ! -f "$template_file" ]]; then
        echo -e "${RED}Template not found: $template_file${NC}"
        return 1
    fi

    # Create output directory if needed
    mkdir -p "$(dirname "$output_file")"

    # Perform substitutions
    sed -e "s|{{APP_NAME}}|$APP_NAME|g" \
        -e "s|{{MODEL_NAME}}|$MODEL_NAME|g" \
        -e "s|{{SLUG}}|$SLUG|g" \
        -e "s|{{SLUG_SNAKE}}|$SLUG_SNAKE|g" \
        -e "s|{{SLUG_KEBAB}}|$SLUG_KEBAB|g" \
        -e "s|{{DESCRIPTION}}|$DESCRIPTION|g" \
        -e "s|{{TEMPLATE_TYPE}}|$TEMPLATE_TYPE|g" \
        -e "s|{{GENERATED_AT}}|$GENERATED_AT|g" \
        "$template_file" > "$output_file"
}

# Banner
show_banner() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║           APP GENERATION SCRIPT                      ║"
    echo "║       Create new app modules from templates          ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show available templates
show_templates() {
    echo -e "${BOLD}Available Templates:${NC}\n"

    if command -v jq &> /dev/null; then
        jq -r '.templates | to_entries[] | "  \(.key|@sh) - \(.value.name): \(.value.description)"' "$REGISTRY_FILE" | tr -d "'"
    else
        echo "  saas-dashboard    - SaaS Dashboard"
        echo "  marketplace       - Marketplace"
        echo "  ocr-engine        - OCR Engine"
        echo "  analytics-platform - Analytics Platform"
        echo "  legal-ai          - Legal AI"
        echo "  fraud-detector    - Fraud Detector"
        echo "  automation-suite  - Automation Suite"
        echo "  ai-assistant      - AI Assistant"
    fi
    echo ""
}

# Validate template type
validate_template() {
    local type="$1"
    local valid_types="saas-dashboard marketplace ocr-engine analytics-platform legal-ai fraud-detector automation-suite ai-assistant"

    for t in $valid_types; do
        if [[ "$type" == "$t" ]]; then
            return 0
        fi
    done
    return 1
}

# ============================================
# Main Script
# ============================================

show_banner
show_templates

# Prompt for App Name
echo -e "${BOLD}App Name${NC} ${DIM}(e.g., Invoice Manager)${NC}"
read -p "> " APP_NAME

if [[ -z "$APP_NAME" ]]; then
    echo -e "${RED}Error: App name is required${NC}"
    exit 1
fi

# Generate default slug from name
DEFAULT_SLUG=$(to_kebab_case "$APP_NAME")

# Prompt for Slug
echo -e "\n${BOLD}App Slug${NC} ${DIM}(URL-friendly identifier)${NC}"
read -p "[$DEFAULT_SLUG] > " SLUG
SLUG="${SLUG:-$DEFAULT_SLUG}"
SLUG=$(to_kebab_case "$SLUG")

# Check if slug already exists
if [[ -d "$BACKEND_DIR/modules/$SLUG_SNAKE" ]] || grep -q "\"slug\": \"$SLUG\"" "$GENERATED_APPS_FILE" 2>/dev/null; then
    echo -e "${RED}Error: An app with slug '$SLUG' already exists${NC}"
    exit 1
fi

# Prompt for Description
echo -e "\n${BOLD}Description${NC} ${DIM}(one-line description)${NC}"
read -p "> " DESCRIPTION

if [[ -z "$DESCRIPTION" ]]; then
    DESCRIPTION="$APP_NAME application"
fi

# Prompt for Template Type
echo -e "\n${BOLD}Template Type${NC} ${DIM}(choose from list above)${NC}"
read -p "[saas-dashboard] > " TEMPLATE_TYPE
TEMPLATE_TYPE="${TEMPLATE_TYPE:-saas-dashboard}"

if ! validate_template "$TEMPLATE_TYPE"; then
    echo -e "${RED}Error: Invalid template type '$TEMPLATE_TYPE'${NC}"
    exit 1
fi

# Derive naming conventions
MODEL_NAME=$(to_pascal_case "$SLUG")
SLUG_SNAKE=$(to_snake_case "$SLUG")
SLUG_KEBAB=$(to_kebab_case "$SLUG")
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get template metadata
if command -v jq &> /dev/null; then
    TEMPLATE_ICON=$(jq -r ".templates[\"$TEMPLATE_TYPE\"].icon // \"Folder\"" "$REGISTRY_FILE")
    TEMPLATE_COLOR=$(jq -r ".templates[\"$TEMPLATE_TYPE\"].color // \"blue\"" "$REGISTRY_FILE")
else
    TEMPLATE_ICON="Folder"
    TEMPLATE_COLOR="blue"
fi

# ============================================
# Confirmation
# ============================================

echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Summary${NC}\n"
echo -e "  ${BOLD}App Name:${NC}     $APP_NAME"
echo -e "  ${BOLD}Slug:${NC}         $SLUG_KEBAB"
echo -e "  ${BOLD}Model Name:${NC}   $MODEL_NAME"
echo -e "  ${BOLD}Snake Case:${NC}   $SLUG_SNAKE"
echo -e "  ${BOLD}Description:${NC}  $DESCRIPTION"
echo -e "  ${BOLD}Template:${NC}     $TEMPLATE_TYPE"
echo -e "\n${BOLD}Files to be created:${NC}\n"
echo -e "  ${GREEN}Backend:${NC}"
echo -e "    backend/app/modules/$SLUG_SNAKE/"
echo -e "      ├── __init__.py"
echo -e "      ├── router.py"
echo -e "      ├── schemas.py"
echo -e "      ├── service.py"
echo -e "      └── README.md"
echo -e "    backend/app/odm/generated/$SLUG_SNAKE.py"
echo -e ""
echo -e "  ${BLUE}Frontend:${NC}"
echo -e "    frontend/src/pages/generated/$SLUG_KEBAB/index.tsx"
echo -e "    frontend/src/pages/landing/$SLUG_KEBAB.tsx"
echo -e "    frontend/src/modules/$SLUG_KEBAB/types.ts"
echo -e "    frontend/src/modules/$SLUG_KEBAB/schema.ts"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

read -p "Proceed with generation? [Y/n] " CONFIRM
CONFIRM="${CONFIRM:-Y}"

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Generation cancelled.${NC}"
    exit 0
fi

# ============================================
# Generate Files
# ============================================

echo -e "\n${BOLD}Generating files...${NC}\n"

# Backend module directory
BACKEND_MODULE_DIR="$BACKEND_DIR/modules/$SLUG_SNAKE"
mkdir -p "$BACKEND_MODULE_DIR"

# Process backend templates
echo -e "  ${GREEN}✓${NC} Creating backend/app/modules/$SLUG_SNAKE/__init__.py"
process_template "$TEMPLATES_DIR/backend/_base/__init__.py.tpl" "$BACKEND_MODULE_DIR/__init__.py"

echo -e "  ${GREEN}✓${NC} Creating backend/app/modules/$SLUG_SNAKE/router.py"
process_template "$TEMPLATES_DIR/backend/_base/router.py.tpl" "$BACKEND_MODULE_DIR/router.py"

echo -e "  ${GREEN}✓${NC} Creating backend/app/modules/$SLUG_SNAKE/schemas.py"
process_template "$TEMPLATES_DIR/backend/_base/schemas.py.tpl" "$BACKEND_MODULE_DIR/schemas.py"

echo -e "  ${GREEN}✓${NC} Creating backend/app/modules/$SLUG_SNAKE/service.py"
process_template "$TEMPLATES_DIR/backend/_base/service.py.tpl" "$BACKEND_MODULE_DIR/service.py"

echo -e "  ${GREEN}✓${NC} Creating backend/app/modules/$SLUG_SNAKE/README.md"
process_template "$TEMPLATES_DIR/backend/_base/README.md.tpl" "$BACKEND_MODULE_DIR/README.md"

# ODM directory
ODM_GENERATED_DIR="$BACKEND_DIR/odm/generated"
mkdir -p "$ODM_GENERATED_DIR"

# Create __init__.py for odm/generated if it doesn't exist
if [[ ! -f "$ODM_GENERATED_DIR/__init__.py" ]]; then
    echo '"""Generated ODM models."""' > "$ODM_GENERATED_DIR/__init__.py"
fi

echo -e "  ${GREEN}✓${NC} Creating backend/app/odm/generated/$SLUG_SNAKE.py"
process_template "$TEMPLATES_DIR/backend/_base/odm.py.tpl" "$ODM_GENERATED_DIR/$SLUG_SNAKE.py"

# Frontend directories
FRONTEND_PAGE_DIR="$FRONTEND_DIR/pages/generated/$SLUG_KEBAB"
FRONTEND_LANDING_DIR="$FRONTEND_DIR/pages/landing"
FRONTEND_MODULE_DIR="$FRONTEND_DIR/modules/$SLUG_KEBAB"

mkdir -p "$FRONTEND_PAGE_DIR"
mkdir -p "$FRONTEND_LANDING_DIR"
mkdir -p "$FRONTEND_MODULE_DIR"

echo -e "  ${BLUE}✓${NC} Creating frontend/src/pages/generated/$SLUG_KEBAB/index.tsx"
process_template "$TEMPLATES_DIR/frontend/_base/page.tsx.tpl" "$FRONTEND_PAGE_DIR/index.tsx"

echo -e "  ${BLUE}✓${NC} Creating frontend/src/pages/landing/$SLUG_KEBAB.tsx"
process_template "$TEMPLATES_DIR/frontend/_base/landing.tsx.tpl" "$FRONTEND_LANDING_DIR/$SLUG_KEBAB.tsx"

echo -e "  ${BLUE}✓${NC} Creating frontend/src/modules/$SLUG_KEBAB/types.ts"
process_template "$TEMPLATES_DIR/frontend/_base/types.ts.tpl" "$FRONTEND_MODULE_DIR/types.ts"

echo -e "  ${BLUE}✓${NC} Creating frontend/src/modules/$SLUG_KEBAB/schema.ts"
process_template "$TEMPLATES_DIR/frontend/_base/schema.ts.tpl" "$FRONTEND_MODULE_DIR/schema.ts"

# ============================================
# Update generated-apps.json
# ============================================

echo -e "\n${BOLD}Updating registry...${NC}\n"

# Create new app entry
NEW_APP_JSON=$(cat <<EOF
{
  "name": "$APP_NAME",
  "slug": "$SLUG_KEBAB",
  "description": "$DESCRIPTION",
  "template": "$TEMPLATE_TYPE",
  "icon": "$TEMPLATE_ICON",
  "color": "$TEMPLATE_COLOR",
  "generatedAt": "$GENERATED_AT",
  "paths": {
    "backend": "backend/app/modules/$SLUG_SNAKE",
    "odm": "backend/app/odm/generated/$SLUG_SNAKE.py",
    "frontendPage": "frontend/src/pages/generated/$SLUG_KEBAB",
    "frontendLanding": "frontend/src/pages/landing/$SLUG_KEBAB.tsx",
    "frontendModule": "frontend/src/modules/$SLUG_KEBAB"
  }
}
EOF
)

# Update generated-apps.json
if command -v jq &> /dev/null; then
    jq --argjson newApp "$NEW_APP_JSON" '.apps += [$newApp]' "$GENERATED_APPS_FILE" > "$GENERATED_APPS_FILE.tmp"
    mv "$GENERATED_APPS_FILE.tmp" "$GENERATED_APPS_FILE"
else
    # Fallback: Simple append (not ideal but works for basic cases)
    # Read current content, remove closing brackets, add new entry
    CURRENT_CONTENT=$(cat "$GENERATED_APPS_FILE")
    if [[ "$CURRENT_CONTENT" == *'"apps": []'* ]]; then
        # Empty array - replace with new entry
        echo "{
  \"version\": \"1.0.0\",
  \"apps\": [
    $NEW_APP_JSON
  ]
}" > "$GENERATED_APPS_FILE"
    else
        echo -e "${YELLOW}Warning: jq not installed. Please manually update generated-apps.json${NC}"
    fi
fi

echo -e "  ${GREEN}✓${NC} Updated templates/generated-apps.json"

# Copy to frontend/public for runtime access
mkdir -p "$SCRIPT_DIR/frontend/public"
cp "$GENERATED_APPS_FILE" "$SCRIPT_DIR/frontend/public/generated-apps.json"
echo -e "  ${GREEN}✓${NC} Copied to frontend/public/generated-apps.json"

# ============================================
# Manual Integration Steps
# ============================================

echo -e "\n${BOLD}${MAGENTA}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${MAGENTA}Manual Integration Steps${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${BOLD}1. Export the router in backend/app/modules/__init__.py:${NC}"
echo -e "${DIM}   Add:${NC}"
echo -e "   ${CYAN}from app.modules.${SLUG_SNAKE}.router import router as ${SLUG_SNAKE}_router${NC}"
echo -e "   ${CYAN}__all__ = [..., \"${SLUG_SNAKE}_router\"]${NC}"
echo ""

echo -e "${BOLD}2. Register the router in backend/app/api/api.py:${NC}"
echo -e "${DIM}   Import:${NC}"
echo -e "   ${CYAN}from app.modules import ${SLUG_SNAKE}_router${NC}"
echo -e "${DIM}   Add:${NC}"
echo -e "   ${CYAN}api_router.include_router(${NC}"
echo -e "   ${CYAN}    ${SLUG_SNAKE}_router,${NC}"
echo -e "   ${CYAN}    prefix=\"/${SLUG_KEBAB}\",${NC}"
echo -e "   ${CYAN}    tags=[\"${SLUG_KEBAB}\"],${NC}"
echo -e "   ${CYAN}    dependencies=auth_required${NC}"
echo -e "   ${CYAN})${NC}"
echo ""

echo -e "${BOLD}3. Add frontend route in frontend/src/App.tsx:${NC}"
echo -e "${DIM}   Import:${NC}"
echo -e "   ${CYAN}import ${MODEL_NAME}Page from './pages/generated/${SLUG_KEBAB}';${NC}"
echo -e "   ${CYAN}import ${MODEL_NAME}LandingPage from './pages/landing/${SLUG_KEBAB}';${NC}"
echo -e "${DIM}   Add routes:${NC}"
echo -e "   ${CYAN}<Route path=\"/${SLUG_KEBAB}\" element={<${MODEL_NAME}LandingPage />} />${NC}"
echo -e "   ${CYAN}<Route path=\"/dashboard/${SLUG_KEBAB}\" element={<AuthGuard><${MODEL_NAME}Page /></AuthGuard>} />${NC}"
echo ""

echo -e "${BOLD}4. (Optional) Install Zod for frontend validation:${NC}"
echo -e "   ${CYAN}cd frontend && npm install zod @hookform/resolvers${NC}"
echo ""

echo -e "${MAGENTA}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}${BOLD}App generation complete!${NC}\n"
echo -e "Run ${CYAN}./verify-project.sh${NC} to verify the configuration.\n"
