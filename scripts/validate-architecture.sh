#!/bin/bash

# React Anchor-based Architecture Validation Script
# Ensures all architectural guardrails are maintained

echo "🏗️ Validating React Anchor-based Architecture..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED=1
    fi
}

# 1. ESLint Architecture Rules
echo -e "\n${YELLOW}1. Running ESLint architecture validation...${NC}"
npx eslint client/src --quiet
print_result $? "ESLint architecture rules passed"

# 2. Custom Architecture Validation
echo -e "\n${YELLOW}2. Running custom architecture validation...${NC}"
node scripts/lint-architecture.js
print_result $? "Custom architecture validation passed"

# 3. Jest No-Raw-Fetch Test
echo -e "\n${YELLOW}3. Running Jest no-raw-fetch validation...${NC}"
npx jest client/src/__tests__/noRawFetch.test.ts --silent
print_result $? "Jest no-raw-fetch validation passed"

# 4. TypeScript Compilation
echo -e "\n${YELLOW}4. Running TypeScript compilation check...${NC}"
npx tsc --noEmit
print_result $? "TypeScript compilation passed"

# 5. Anchor Test Validation
echo -e "\n${YELLOW}5. Running anchor slice validation...${NC}"
if [ -f "client/src/__tests__/anchor.test.ts" ]; then
    npx jest client/src/__tests__/anchor.test.ts --silent
    print_result $? "Anchor slice validation passed"
else
    echo -e "${YELLOW}⚠️  Anchor test not found - skipping${NC}"
fi

# 6. Bundle Size Check
echo -e "\n${YELLOW}6. Checking bundle size...${NC}"
npm run build > /dev/null 2>&1
if [ -f "dist/assets/index.js" ]; then
    SIZE=$(du -k dist/assets/index.js | cut -f1)
    if [ $SIZE -lt 2048 ]; then  # Less than 2MB
        print_result 0 "Bundle size check passed (${SIZE}KB)"
    else
        print_result 1 "Bundle size too large (${SIZE}KB > 2MB)"
    fi
else
    print_result 1 "Bundle build failed"
fi

# Final Result
echo -e "\n${YELLOW}Architecture Validation Summary:${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All architectural guardrails passed!${NC}"
    echo -e "${GREEN}   React anchor-based architecture is validated.${NC}"
    exit 0
else
    echo -e "${RED}💥 Architecture validation failed!${NC}"
    echo -e "${RED}   Please fix the issues above before proceeding.${NC}"
    exit 1
fi