#!/bin/bash

# OpenAI API Worker Deployment Script
# This script handles deployment to different environments with proper validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT="development"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
VERBOSE=false

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy the OpenAI API Worker to Cloudflare Workers

OPTIONS:
    -e, --environment ENV    Target environment (development|staging|production) [default: development]
    -s, --skip-tests        Skip running tests before deployment
    -b, --skip-build        Skip building the worker (use existing build)
    -d, --dry-run           Show what would be deployed without actually deploying
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0                                    # Deploy to development
    $0 -e staging                         # Deploy to staging
    $0 -e production --dry-run            # Preview production deployment
    $0 -e staging --skip-tests            # Deploy to staging without tests

ENVIRONMENT VARIABLES:
    CLOUDFLARE_API_TOKEN    Cloudflare API token (required)
    CLOUDFLARE_ACCOUNT_ID   Cloudflare account ID (required)
    SKIP_HEALTH_CHECK       Skip post-deployment health check

EOF
}

# Function to validate environment
validate_environment() {
    case "$ENVIRONMENT" in
        development|staging|production)
            print_info "Deploying to environment: $ENVIRONMENT"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            print_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if we're in the correct directory
    if [[ ! -f "$WORKER_DIR/wrangler.toml" ]]; then
        print_error "wrangler.toml not found. Please run this script from the worker directory."
        exit 1
    fi
    
    # Check for required tools
    local missing_tools=()
    
    if ! command -v bun &> /dev/null; then
        missing_tools+=("bun")
    fi
    
    if ! command -v wrangler &> /dev/null; then
        missing_tools+=("wrangler")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check for required environment variables
    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        print_error "CLOUDFLARE_API_TOKEN environment variable is required"
        exit 1
    fi
    
    if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
        print_error "CLOUDFLARE_ACCOUNT_ID environment variable is required"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    cd "$WORKER_DIR"
    
    if [[ "$VERBOSE" == "true" ]]; then
        bun install
    else
        bun install --silent
    fi
    
    print_success "Dependencies installed"
}

# Function to run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests as requested"
        return 0
    fi
    
    print_info "Running tests..."
    
    cd "$WORKER_DIR"
    
    # Run linting
    print_info "Running ESLint..."
    if [[ "$VERBOSE" == "true" ]]; then
        bun run lint
    else
        bun run lint --silent
    fi
    
    # Run type checking
    print_info "Running TypeScript type check..."
    if [[ "$VERBOSE" == "true" ]]; then
        bun run type-check
    else
        bun run type-check --silent
    fi
    
    # Run unit tests
    print_info "Running unit tests..."
    if [[ "$VERBOSE" == "true" ]]; then
        bun run test
    else
        bun run test --silent
    fi
    
    print_success "All tests passed"
}

# Function to build the worker
build_worker() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping build as requested"
        return 0
    fi
    
    print_info "Building worker..."
    
    cd "$WORKER_DIR"
    
    if [[ "$VERBOSE" == "true" ]]; then
        bun run build
    else
        bun run build --silent
    fi
    
    print_success "Worker built successfully"
}

# Function to deploy the worker
deploy_worker() {
    print_info "Deploying worker to $ENVIRONMENT..."
    
    cd "$WORKER_DIR"
    
    local deploy_cmd="wrangler deploy"
    
    # Add environment flag if not development
    if [[ "$ENVIRONMENT" != "development" ]]; then
        deploy_cmd="$deploy_cmd --env $ENVIRONMENT"
    fi
    
    # Add dry-run flag if requested
    if [[ "$DRY_RUN" == "true" ]]; then
        deploy_cmd="$deploy_cmd --dry-run"
        print_warning "DRY RUN: Would execute: $deploy_cmd"
    fi
    
    # Execute deployment
    if [[ "$VERBOSE" == "true" ]]; then
        eval "$deploy_cmd"
    else
        eval "$deploy_cmd" > /dev/null
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_success "Dry run completed successfully"
    else
        print_success "Worker deployed successfully to $ENVIRONMENT"
    fi
}

# Function to run health check
run_health_check() {
    if [[ "$DRY_RUN" == "true" ]] || [[ "${SKIP_HEALTH_CHECK:-}" == "true" ]]; then
        return 0
    fi
    
    print_info "Running post-deployment health check..."
    
    local health_url
    case "$ENVIRONMENT" in
        production)
            health_url="https://api.wemake.dev/health"
            ;;
        staging)
            health_url="https://staging-api.wemake.dev/health"
            ;;
        development)
            health_url="https://dev-api.wemake.dev/health"
            ;;
    esac
    
    # Wait for deployment to propagate
    print_info "Waiting for deployment to propagate..."
    sleep 10
    
    # Perform health check with retries
    local max_retries=5
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s "$health_url" > /dev/null; then
            print_success "Health check passed: $health_url"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        print_warning "Health check failed (attempt $retry_count/$max_retries). Retrying in 5 seconds..."
        sleep 5
    done
    
    print_error "Health check failed after $max_retries attempts"
    print_error "Please check the deployment manually: $health_url"
    exit 1
}

# Function to show deployment summary
show_summary() {
    print_info "Deployment Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Tests: $([ "$SKIP_TESTS" == "true" ] && echo "Skipped" || echo "Passed")"
    echo "  Build: $([ "$SKIP_BUILD" == "true" ] && echo "Skipped" || echo "Completed")"
    echo "  Deployment: $([ "$DRY_RUN" == "true" ] && echo "Dry Run" || echo "Completed")"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        case "$ENVIRONMENT" in
            production)
                echo "  URL: https://api.wemake.dev"
                ;;
            staging)
                echo "  URL: https://staging-api.wemake.dev"
                ;;
            development)
                echo "  URL: https://dev-api.wemake.dev"
                ;;
        esac
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_info "Starting OpenAI API Worker deployment..."
    
    validate_environment
    check_prerequisites
    install_dependencies
    run_tests
    build_worker
    deploy_worker
    run_health_check
    show_summary
    
    print_success "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"