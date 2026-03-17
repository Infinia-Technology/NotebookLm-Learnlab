#!/usr/bin/env python3
"""
Project Initialization Script

This script initializes a new project from the core platform template.
It collects app information via interactive prompts, updates configuration
files, and prepares the environment for development.

Usage:
    ./init-project.py          # Interactive mode
    python init-project.py     # Interactive mode
"""

import json
import os
import re
import secrets
import sys
from pathlib import Path


# ANSI colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'


def print_header(text: str) -> None:
    """Print a styled header."""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")


def print_step(text: str) -> None:
    """Print a step message."""
    print(f"  {Colors.GREEN}>{Colors.RESET} {text}")


def print_warning(text: str) -> None:
    """Print a warning message."""
    print(f"  {Colors.YELLOW}!{Colors.RESET} {text}")


def print_error(text: str) -> None:
    """Print an error message."""
    print(f"  {Colors.RED}x{Colors.RESET} {text}")


def generate_secret_key(length: int = 32) -> str:
    """Generate a secure random hex key."""
    return secrets.token_hex(length)


def slugify(text: str) -> str:
    """Convert text to a URL/Docker-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


def validate_slug(slug: str) -> bool:
    """Validate that a slug is properly formatted."""
    return bool(re.match(r'^[a-z][a-z0-9-]*$', slug))


def prompt_input(prompt: str, default: str = None, validator=None) -> str:
    """Get input from user with optional default and validation."""
    if default:
        display_prompt = f"{Colors.BOLD}{prompt}{Colors.RESET} [{Colors.DIM}{default}{Colors.RESET}]: "
    else:
        display_prompt = f"{Colors.BOLD}{prompt}{Colors.RESET}: "

    while True:
        value = input(display_prompt).strip()
        if not value and default:
            value = default

        if not value:
            print_error("This field is required")
            continue

        if validator and not validator(value):
            continue

        return value


def prompt_choice(prompt: str, options: list[tuple[str, str]], default: int = 1) -> str:
    """Display a numbered choice menu and return the selected value."""
    print(f"\n{Colors.BOLD}{prompt}{Colors.RESET}")
    for i, (value, label) in enumerate(options, 1):
        marker = f"{Colors.CYAN}>{Colors.RESET}" if i == default else " "
        print(f"  {marker} {i}. {label}")

    while True:
        try:
            choice = input(f"\n  Enter choice [{default}]: ").strip()
            if not choice:
                choice = default
            else:
                choice = int(choice)

            if 1 <= choice <= len(options):
                return options[choice - 1][0]
            print_error(f"Please enter a number between 1 and {len(options)}")
        except ValueError:
            print_error("Please enter a valid number")


def prompt_color(prompt: str, default: str = "blue") -> str:
    """Prompt for a color with validation."""
    valid_colors = [
        'slate', 'gray', 'zinc', 'neutral', 'stone',
        'red', 'orange', 'amber', 'yellow', 'lime',
        'green', 'emerald', 'teal', 'cyan', 'sky',
        'blue', 'indigo', 'violet', 'purple', 'fuchsia',
        'pink', 'rose'
    ]

    print(f"\n{Colors.BOLD}{prompt}{Colors.RESET}")
    print(f"  {Colors.DIM}Available: {', '.join(valid_colors)}{Colors.RESET}")
    print(f"  {Colors.DIM}Or enter a hex color (e.g., #3b82f6){Colors.RESET}")

    while True:
        value = input(f"  Color [{default}]: ").strip().lower()
        if not value:
            value = default

        # Check if it's a valid Tailwind color name
        if value in valid_colors:
            return value

        # Check if it's a valid hex color
        if re.match(r'^#[0-9a-f]{6}$', value, re.IGNORECASE):
            return value

        print_error(f"Invalid color. Use a Tailwind color name or hex code (e.g., #3b82f6)")


def collect_app_info() -> dict:
    """Collect app information via interactive prompts."""
    print(f"""
{Colors.BOLD}{Colors.CYAN}
   _____ ____  ____  ______   ____  __    ___  ______ ______ ____  ____   ____  ___
  / ___// __ \\/ __ \\/ ____/  / __ \\/ /   /   |/_  __// ____// __ \\/ __ \\ / __ \\/   |
  \\__ \\/ / / / /_/ / __/    / /_/ / /   / /| | / /  / /_   / / / / /_/ // /_/ / /| |
 ___/ / /_/ / _, _/ /___   / ____/ /___/ ___ |/ /  / __/  / /_/ / _, _// _, _/ ___ |
/____/\\____/_/ |_/_____/  /_/   /_____/_/  |_/_/  /_/     \\____/_/ |_|/_/ |_/_/  |_|
{Colors.RESET}
{Colors.DIM}Create your personalized app from the SAIL Starter Kit Template{Colors.RESET}
""")

    print_header("App Information")

    # App Name
    app_name = prompt_input(
        "App Name (e.g., 'My Awesome App')"
    )

    # App Slug
    suggested_slug = slugify(app_name)

    def validate_slug_input(value):
        if not validate_slug(value):
            print_error("Slug must start with a letter and contain only lowercase letters, numbers, and hyphens")
            return False
        return True

    app_slug = prompt_input(
        "App Slug (URL-friendly, lowercase)",
        default=suggested_slug,
        validator=validate_slug_input
    )

    # Primary Color
    primary_color = prompt_color(
        "Primary Color (Tailwind name or hex)",
        default="indigo"
    )

    # App Description
    app_description = prompt_input(
        "App Description (one sentence)",
        default=f"{app_name} - Built with SAIL Starter Kit"
    )

    # App Type
    app_type = prompt_choice(
        "What type of app is this?",
        [
            ("saas-dashboard", "SaaS Dashboard"),
            ("marketplace", "Marketplace"),
            ("internal-tool", "Internal Tool"),
            ("ai-chat-app", "AI Chat App"),
            ("other", "Other"),
        ],
        default=1
    )

    return {
        "app_name": app_name,
        "app_slug": app_slug,
        "primary_color": primary_color,
        "app_description": app_description,
        "app_type": app_type,
    }


def replace_in_file(file_path: Path, replacements: dict[str, str]) -> bool:
    """Replace text patterns in a file."""
    try:
        content = file_path.read_text()
        original = content
        for old, new in replacements.items():
            content = content.replace(old, new)
        if content != original:
            file_path.write_text(content)
            return True
        return False
    except Exception as e:
        print_warning(f"Could not process {file_path}: {e}")
        return False


def create_app_config(project_root: Path, config: dict) -> None:
    """Create app.config.json with collected information."""
    config_file = project_root / "app.config.json"

    full_config = {
        "app": {
            "name": config["app_name"],
            "slug": config["app_slug"],
            "description": config["app_description"],
            "type": config["app_type"],
        },
        "theme": {
            "primaryColor": config["primary_color"],
        },
        "created_at": __import__('datetime').datetime.now().isoformat(),
    }

    config_json = json.dumps(full_config, indent=2)

    # Write to project root
    config_file.write_text(config_json)
    print_step(f"Created app.config.json")

    # Also copy to frontend/public for frontend access
    public_config = project_root / "frontend" / "public" / "app.config.json"
    public_config.write_text(config_json)
    print_step(f"Created frontend/public/app.config.json")


def create_env_file(project_root: Path, config: dict) -> None:
    """Create .env file from .env.example with generated values."""
    env_example = project_root / ".env.example"
    env_file = project_root / ".env"

    if env_file.exists():
        print_warning(".env file already exists, skipping...")
        return

    if not env_example.exists():
        print_warning(".env.example not found")
        return

    content = env_example.read_text()
    slug = config["app_slug"]

    # Generate secure values
    jwt_secret = generate_secret_key(32)
    mongo_password = generate_secret_key(16)

    replacements = {
        'APP_NAME="SAIL Starter Kit"': f'APP_NAME="{config["app_name"]}"',
        'JWT_SECRET=your-32-character-secret-key-here': f'JWT_SECRET={jwt_secret}',
        'MONGO_PASSWORD=app_secure_pass': f'MONGO_PASSWORD={mongo_password}',
        f'app_secure_pass@app-mongo': f'{mongo_password}@{slug}-mongo',
        'app_secure_pass@localhost': f'{mongo_password}@localhost',
        '@app-mongo:': f'@{slug}-mongo:',
        'redis://app-redis': f'redis://{slug}-redis',
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    env_file.write_text(content)
    print_step(f"Created .env with generated secrets")


def update_docker_compose(project_root: Path, config: dict) -> None:
    """Update docker-compose.yml with project-specific names."""
    docker_compose = project_root / "docker-compose.yml"
    slug = config["app_slug"]

    if not docker_compose.exists():
        print_warning("docker-compose.yml not found")
        return

    replacements = {
        "app-mongo": f"{slug}-mongo",
        "app-redis": f"{slug}-redis",
        "app-backend": f"{slug}-backend",
        "app-frontend": f"{slug}-frontend",
        "app_mongo_data": f"{slug}_mongo_data",
        "app_redis_data": f"{slug}_redis_data",
    }

    if replace_in_file(docker_compose, replacements):
        print_step(f"Updated docker-compose.yml with {slug}-* service names")


def update_nginx_config(project_root: Path, config: dict) -> None:
    """Update nginx.conf with project-specific backend name."""
    nginx_conf = project_root / "frontend" / "nginx.conf"
    slug = config["app_slug"]

    if not nginx_conf.exists():
        print_warning("frontend/nginx.conf not found")
        return

    replacements = {
        "app-backend": f"{slug}-backend",
    }

    if replace_in_file(nginx_conf, replacements):
        print_step(f"Updated nginx.conf with {slug}-backend")


def update_frontend_index(project_root: Path, config: dict) -> None:
    """Update frontend/index.html with app title."""
    index_html = project_root / "frontend" / "index.html"

    if not index_html.exists():
        print_warning("frontend/index.html not found")
        return

    replacements = {
        "<title>SAIL Starter Kit</title>": f"<title>{config['app_name']}</title>",
    }

    if replace_in_file(index_html, replacements):
        print_step(f"Updated frontend/index.html with app title")


def update_design_tokens(project_root: Path, config: dict) -> None:
    """Update design tokens with the chosen primary color."""
    tokens_file = project_root / "frontend" / "src" / "design-system" / "design-tokens.css"

    if not tokens_file.exists():
        print_warning("design-tokens.css not found")
        return

    primary_color = config["primary_color"]

    # If it's a Tailwind color name, we map to CSS custom properties
    # If it's a hex color, we use it directly
    if primary_color.startswith("#"):
        # For hex colors, we set --color-app-primary directly
        content = tokens_file.read_text()
        content = content.replace("--color-app-primary: var(--color-indigo-600);", f"--color-app-primary: {primary_color};")
        tokens_file.write_text(content)
    else:
        # For Tailwind color names, update the reference
        content = tokens_file.read_text()
        content = content.replace("var(--color-indigo-", f"var(--color-{primary_color}-")
        tokens_file.write_text(content)

    print_step(f"Updated design tokens with {primary_color} color")


def update_readme(project_root: Path, config: dict) -> None:
    """Update README.md with project name."""
    readme = project_root / "README.md"

    if not readme.exists():
        print_warning("README.md not found")
        return

    replacements = {
        "# SAIL Starter Kit Template": f"# {config['app_name']}",
        "core-platform": config["app_slug"],
    }

    if replace_in_file(readme, replacements):
        print_step(f"Updated README.md with project name")


def cleanup_template_files(project_root: Path) -> None:
    """Remove template-specific files that aren't needed in new projects."""
    files_to_remove = [
        "init-project.py",  # This script itself
    ]

    for file_name in files_to_remove:
        file_path = project_root / file_name
        if file_path.exists():
            file_path.unlink()
            print_step(f"Removed {file_name}")


def main():
    project_root = Path(__file__).parent.resolve()

    # Check if already initialized
    config_file = project_root / "app.config.json"
    if config_file.exists():
        print_warning("Project already initialized (app.config.json exists)")
        response = input("Do you want to re-initialize? This will overwrite existing config [y/N]: ").strip().lower()
        if response != 'y':
            print("Aborted.")
            sys.exit(0)

    # Collect app information
    config = collect_app_info()

    # Confirm
    print_header("Configuration Summary")
    print(f"  App Name:     {Colors.CYAN}{config['app_name']}{Colors.RESET}")
    print(f"  Slug:         {Colors.CYAN}{config['app_slug']}{Colors.RESET}")
    print(f"  Color:        {Colors.CYAN}{config['primary_color']}{Colors.RESET}")
    print(f"  Description:  {Colors.CYAN}{config['app_description']}{Colors.RESET}")
    print(f"  Type:         {Colors.CYAN}{config['app_type']}{Colors.RESET}")

    confirm = input(f"\n{Colors.BOLD}Proceed with initialization?{Colors.RESET} [Y/n]: ").strip().lower()
    if confirm == 'n':
        print("Aborted.")
        sys.exit(0)

    # Initialize
    print_header("Initializing Project")

    print("\n  Creating configuration files...")
    create_app_config(project_root, config)
    create_env_file(project_root, config)

    print("\n  Updating Docker configuration...")
    update_docker_compose(project_root, config)
    update_nginx_config(project_root, config)

    print("\n  Updating frontend...")
    update_frontend_index(project_root, config)
    update_design_tokens(project_root, config)

    print("\n  Updating documentation...")
    update_readme(project_root, config)

    # Print success message
    print(f"""
{Colors.GREEN}{Colors.BOLD}
Project initialized successfully!
{Colors.RESET}

{Colors.BOLD}Next steps:{Colors.RESET}

  1. Review the generated .env file:
     {Colors.CYAN}cat .env{Colors.RESET}

  2. Start the development servers:
     {Colors.CYAN}docker compose up --build{Colors.RESET}

  3. Access your app:
     {Colors.CYAN}http://localhost:3100{Colors.RESET}

  4. Login with admin credentials from .env:
     - Email: ADMIN_EMAIL
     - Password: ADMIN_PASSWORD

{Colors.DIM}Configuration saved to app.config.json{Colors.RESET}
""")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nAborted.")
        sys.exit(1)
