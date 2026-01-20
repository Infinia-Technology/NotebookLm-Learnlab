#!/bin/bash

#
# Project Initialization Script
#
# This script initializes a new project from the core platform template.
# It collects app information via interactive prompts, updates configuration
# files, and prepares the environment for development.
#
# Usage:
#   ./init-project.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Helper functions
print_header() {
    echo -e "\n${BOLD}${CYAN}$1${NC}"
}

print_step() {
    echo -e "  ${GREEN}>${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "  ${RED}x${NC} $1"
}

# Generate random hex string
generate_secret() {
    local length=${1:-32}
    if command -v openssl &> /dev/null; then
        openssl rand -hex "$length"
    elif command -v /dev/urandom &> /dev/null; then
        head -c "$length" /dev/urandom | od -An -tx1 | tr -d ' \n'
    else
        # Fallback: use date and process info
        echo "$(date +%s%N)$$" | sha256sum | head -c $((length * 2))
    fi
}

# Convert to slug (lowercase, replace spaces with hyphens)
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Validate slug format
validate_slug() {
    if [[ "$1" =~ ^[a-z][a-z0-9-]*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate color (Tailwind name or hex)
validate_color() {
    local color="$1"
    local valid_colors="slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose"

    # Check if it's a valid Tailwind color
    for valid in $valid_colors; do
        if [[ "$color" == "$valid" ]]; then
            return 0
        fi
    done

    # Check if it's a valid hex color
    if [[ "$color" =~ ^#[0-9a-fA-F]{6}$ ]]; then
        return 0
    fi

    return 1
}

# Replace text in file
replace_in_file() {
    local file="$1"
    local old="$2"
    local new="$3"

    if [[ -f "$file" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|$old|$new|g" "$file"
        else
            # Linux
            sed -i "s|$old|$new|g" "$file"
        fi
    fi
}

# Print banner
print_banner() {
    echo -e "${BOLD}${CYAN}"
    echo "   _____ ____  ____  ______   ____  __    ___  ______ ______ ____  ____   ____  ___"
    echo "  / ___// __ \\/ __ \\/ ____/  / __ \\/ /   /   |/_  __// ____// __ \\/ __ \\ / __ \\/   |"
    echo "  \\__ \\/ / / / /_/ / __/    / /_/ / /   / /| | / /  / /_   / / / / /_/ // /_/ / /| |"
    echo " ___/ / /_/ / _, _/ /___   / ____/ /___/ ___ |/ /  / __/  / /_/ / _, _// _, _/ ___ |"
    echo "/____/\\____/_/ |_/_____/  /_/   /_____/_/  |_/_/  /_/     \\____/_/ |_|/_/ |_/_/  |_|"
    echo -e "${NC}"
    echo -e "${DIM}Create your personalized app from the SAIL Starter Kit Template${NC}"
    echo ""
}

# Main function
main() {
    cd "$SCRIPT_DIR"

    # Check if already initialized (check for .env since system.config.json is in repo)
    if [[ -f ".env" ]]; then
        print_warning "Project was previously initialized. Re-running will update configuration."
        echo ""
    fi

    print_banner

    print_header "App Information"

    # App Name
    while true; do
        read -p "${BOLD}App Name (e.g., 'My Awesome App')${NC}: " APP_NAME
        if [[ -n "$APP_NAME" ]]; then
            break
        fi
        print_error "This field is required"
    done

    # App Slug
    SUGGESTED_SLUG=$(slugify "$APP_NAME")
    while true; do
        read -p "${BOLD}App Slug (URL-friendly, lowercase)${NC} [${DIM}${SUGGESTED_SLUG}${NC}]: " APP_SLUG
        APP_SLUG=${APP_SLUG:-$SUGGESTED_SLUG}

        if validate_slug "$APP_SLUG"; then
            break
        fi
        print_error "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens"
    done

    # Primary Color
    echo ""
    echo -e "${BOLD}Primary Color (Tailwind name or hex)${NC}"
    echo -e "  ${DIM}Available: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime,${NC}"
    echo -e "  ${DIM}green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose${NC}"
    echo -e "  ${DIM}Or enter a hex color (e.g., #3b82f6)${NC}"
    while true; do
        read -p "  Color [indigo]: " PRIMARY_COLOR
        PRIMARY_COLOR=${PRIMARY_COLOR:-indigo}
        PRIMARY_COLOR=$(echo "$PRIMARY_COLOR" | tr '[:upper:]' '[:lower:]')

        if validate_color "$PRIMARY_COLOR"; then
            break
        fi
        print_error "Invalid color. Use a Tailwind color name or hex code (e.g., #3b82f6)"
    done

    # App Description
    DEFAULT_DESC="$APP_NAME - Built with SAIL Starter Kit"
    read -p "${BOLD}App Description (one sentence)${NC} [${DIM}${DEFAULT_DESC}${NC}]: " APP_DESCRIPTION
    APP_DESCRIPTION=${APP_DESCRIPTION:-$DEFAULT_DESC}

    # App Type
    echo ""
    echo -e "${BOLD}What type of app is this?${NC}"
    echo -e "  ${CYAN}>${NC} 1. SaaS Dashboard"
    echo "    2. Marketplace"
    echo "    3. Internal Tool"
    echo "    4. AI Chat App"
    echo "    5. Other"
    while true; do
        read -p "  Enter choice [1]: " APP_TYPE_CHOICE
        APP_TYPE_CHOICE=${APP_TYPE_CHOICE:-1}

        case $APP_TYPE_CHOICE in
            1) APP_TYPE="saas-dashboard"; break;;
            2) APP_TYPE="marketplace"; break;;
            3) APP_TYPE="internal-tool"; break;;
            4) APP_TYPE="ai-chat-app"; break;;
            5) APP_TYPE="other"; break;;
            *) print_error "Please enter a number between 1 and 5";;
        esac
    done

    # Confirmation
    print_header "Configuration Summary"
    echo -e "  App Name:     ${CYAN}$APP_NAME${NC}"
    echo -e "  Slug:         ${CYAN}$APP_SLUG${NC}"
    echo -e "  Color:        ${CYAN}$PRIMARY_COLOR${NC}"
    echo -e "  Description:  ${CYAN}$APP_DESCRIPTION${NC}"
    echo -e "  Type:         ${CYAN}$APP_TYPE${NC}"

    read -p "
${BOLD}Proceed with initialization?${NC} [Y/n]: " CONFIRM
    if [[ "$CONFIRM" == "n" || "$CONFIRM" == "N" ]]; then
        echo "Aborted."
        exit 0
    fi

    print_header "Initializing Project"

    # Generate secrets
    JWT_SECRET=$(generate_secret 32)
    MONGO_PASSWORD=$(generate_secret 16)

    # Create system.config.json
    echo ""
    echo "  Creating configuration files..."

    CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat > system.config.json << EOF
{
  "app": {
    "name": "$APP_NAME",
    "slug": "$APP_SLUG",
    "description": "$APP_DESCRIPTION",
    "type": "$APP_TYPE"
  },
  "theme": {
    "primaryColor": "$PRIMARY_COLOR"
  },
  "layout": {
    "sidebarCollapsedByDefault": false
  },
  "created_at": "$CREATED_AT"
}
EOF
    print_step "Created system.config.json"

    # Copy to frontend/public
    cp system.config.json frontend/public/system.config.json
    print_step "Created frontend/public/system.config.json"

    # Create .env from .env.example
    if [[ -f ".env" ]]; then
        print_warning ".env file already exists, backing up to .env.backup"
        cp .env .env.backup
    fi

    if [[ -f ".env.example" ]]; then
        cp .env.example .env

        # Update .env values
        replace_in_file ".env" 'APP_NAME="SAIL Starter Kit"' "APP_NAME=\"$APP_NAME\""
        replace_in_file ".env" 'JWT_SECRET=your-32-character-secret-key-here' "JWT_SECRET=$JWT_SECRET"
        replace_in_file ".env" 'MONGO_PASSWORD=app_secure_pass' "MONGO_PASSWORD=$MONGO_PASSWORD"
        replace_in_file ".env" "app_secure_pass@app-mongo" "$MONGO_PASSWORD@$APP_SLUG-mongo"
        replace_in_file ".env" "app_secure_pass@localhost" "$MONGO_PASSWORD@localhost"
        replace_in_file ".env" "@app-mongo:" "@$APP_SLUG-mongo:"
        replace_in_file ".env" "redis://app-redis" "redis://$APP_SLUG-redis"

        print_step "Created .env with generated secrets"
    else
        print_warning ".env.example not found"
    fi

    # Update docker-compose.yml
    echo ""
    echo "  Updating Docker configuration..."

    if [[ -f "docker-compose.yml" ]]; then
        replace_in_file "docker-compose.yml" "app-mongo" "$APP_SLUG-mongo"
        replace_in_file "docker-compose.yml" "app-redis" "$APP_SLUG-redis"
        replace_in_file "docker-compose.yml" "app-backend" "$APP_SLUG-backend"
        replace_in_file "docker-compose.yml" "app-frontend" "$APP_SLUG-frontend"
        replace_in_file "docker-compose.yml" "app_mongo_data" "${APP_SLUG}_mongo_data"
        replace_in_file "docker-compose.yml" "app_redis_data" "${APP_SLUG}_redis_data"
        print_step "Updated docker-compose.yml with $APP_SLUG-* service names"
    fi

    # Update nginx.conf
    if [[ -f "frontend/nginx.conf" ]]; then
        replace_in_file "frontend/nginx.conf" "app-backend" "$APP_SLUG-backend"
        print_step "Updated nginx.conf with $APP_SLUG-backend"
    fi

    # Update frontend
    echo ""
    echo "  Updating frontend..."

    if [[ -f "frontend/index.html" ]]; then
        replace_in_file "frontend/index.html" "<title>SAIL Starter Kit</title>" "<title>$APP_NAME</title>"
        print_step "Updated frontend/index.html with app title"
    fi

    # Update design tokens with primary color
    TOKENS_FILE="frontend/src/design-system/design-tokens.css"
    if [[ -f "$TOKENS_FILE" ]]; then
        if [[ "$PRIMARY_COLOR" == \#* ]]; then
            # Hex color - replace the main variable
            replace_in_file "$TOKENS_FILE" "--color-app-primary: var(--color-indigo-600);" "--color-app-primary: $PRIMARY_COLOR;"
        else
            # Tailwind color name - replace all indigo references
            replace_in_file "$TOKENS_FILE" "var(--color-indigo-" "var(--color-$PRIMARY_COLOR-"
        fi
        print_step "Updated design tokens with $PRIMARY_COLOR color"
    fi

    # Update README
    echo ""
    echo "  Updating documentation..."

    if [[ -f "README.md" ]]; then
        replace_in_file "README.md" "# SAIL Starter Kit Template" "# $APP_NAME"
        replace_in_file "README.md" "core-platform" "$APP_SLUG"
        print_step "Updated README.md with project name"
    fi

    # Success message
    echo -e "
${GREEN}${BOLD}
Project initialized successfully!
${NC}

${BOLD}Next steps:${NC}

  1. Review the generated .env file:
     ${CYAN}cat .env${NC}

  2. Start the development servers:
     ${CYAN}docker compose up --build${NC}

  3. Access your app:
     ${CYAN}http://localhost:3100${NC}

  4. Login with admin credentials from .env:
     - Email: ADMIN_EMAIL
     - Password: ADMIN_PASSWORD

${DIM}Configuration saved to system.config.json${NC}
"
}

# Run main
main "$@"
