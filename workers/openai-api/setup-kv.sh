#!/bin/bash
set -e

echo "🚀 Setting up KV namespaces for WeMake OpenAI API..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating KV namespaces...${NC}"

# Development environment
echo -e "${YELLOW}Development environment...${NC}"
dev_cache=$(wrangler kv:namespace create "CACHE" --env development 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
dev_rate_limit=$(wrangler kv:namespace create "RATE_LIMIT" --env development 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
dev_cache_preview=$(wrangler kv:namespace create "CACHE" --env development --preview 2>/dev/null | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)
dev_rate_limit_preview=$(wrangler kv:namespace create "RATE_LIMIT" --env development --preview 2>/dev/null | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

# Staging environment
echo -e "${YELLOW}Staging environment...${NC}"
staging_cache=$(wrangler kv:namespace create "CACHE" --env staging 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
staging_rate_limit=$(wrangler kv:namespace create "RATE_LIMIT" --env staging 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
staging_cache_preview=$(wrangler kv:namespace create "CACHE" --env staging --preview 2>/dev/null | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)
staging_rate_limit_preview=$(wrangler kv:namespace create "RATE_LIMIT" --env staging --preview 2>/dev/null | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

# Production environment
echo -e "${YELLOW}Production environment...${NC}"
prod_cache=$(wrangler kv:namespace create "CACHE" --env production 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
prod_rate_limit=$(wrangler kv:namespace create "RATE_LIMIT" --env production 2>/dev/null | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
prod_cache_preview=$(wrangler kv:namespace create "CACHE" --env production --preview 2>/dev/null | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)
prod_rate_limit_preview=$(wrangler kv:namespace create "RATE_LIMIT" --env production --preview 2>/dev/null | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

echo -e "${GREEN}✅ KV namespaces created successfully!${NC}"

# Create a backup of original wrangler.toml
cp wrangler.toml wrangler.toml.backup

echo -e "${YELLOW}Updating wrangler.toml with KV namespace IDs...${NC}"

# Function to update wrangler.toml with actual IDs
update_wrangler_toml() {
    local env=$1
    local cache_id=$2
    local rate_limit_id=$3
    local cache_preview=$4
    local rate_limit_preview=$5

    if [[ -n "$cache_id" ]]; then
        sed -i.tmp "s/your-$env-cache-id/$cache_id/g" wrangler.toml
    fi
    if [[ -n "$rate_limit_id" ]]; then
        sed -i.tmp "s/your-$env-rate-limit-kv-id/$rate_limit_id/g" wrangler.toml
    fi
    if [[ -n "$cache_preview" ]]; then
        sed -i.tmp "s/your-$env-cache-preview-id/$cache_preview/g" wrangler.toml
    fi
    if [[ -n "$rate_limit_preview" ]]; then
        sed -i.tmp "s/your-$env-rate-limit-preview-id/$rate_limit_preview/g" wrangler.toml
    fi
}

# Update all environments
update_wrangler_toml "dev" "$dev_cache" "$dev_rate_limit" "$dev_cache_preview" "$dev_rate_limit_preview"
update_wrangler_toml "staging" "$staging_cache" "$staging_rate_limit" "$staging_cache_preview" "$staging_rate_limit_preview"
update_wrangler_toml "prod" "$prod_cache" "$prod_rate_limit" "$prod_cache_preview" "$prod_rate_limit_preview"

# Clean up temporary files
rm -f wrangler.toml.tmp

echo -e "${GREEN}✅ wrangler.toml updated with actual KV namespace IDs!${NC}"

# Display summary
echo -e "${GREEN}Summary of created KV namespaces:${NC}"
echo "Development:"
echo "  CACHE: $dev_cache"
echo "  RATE_LIMIT: $dev_rate_limit"
echo "  CACHE_PREVIEW: $dev_cache_preview"
echo "  RATE_LIMIT_PREVIEW: $dev_rate_limit_preview"
echo ""
echo "Staging:"
echo "  CACHE: $staging_cache"
echo "  RATE_LIMIT: $staging_rate_limit"
echo "  CACHE_PREVIEW: $staging_cache_preview"
echo "  RATE_LIMIT_PREVIEW: $staging_rate_limit_preview"
echo ""
echo "Production:"
echo "  CACHE: $prod_cache"
echo "  RATE_LIMIT: $prod_rate_limit"
echo "  CACHE_PREVIEW: $prod_cache_preview"
echo "  RATE_LIMIT_PREVIEW: $prod_rate_limit_preview"
echo ""
echo -e "${GREEN}🎉 KV namespace setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the updated wrangler.toml file"
echo "2. Set up D1 databases (see D1 setup guide)"
echo "3. Configure environment variables"
echo "4. Deploy your worker"