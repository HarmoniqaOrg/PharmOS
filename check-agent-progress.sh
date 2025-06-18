#!/bin/bash
# Script to check and commit agent progress

echo "🔍 Checking Agent Progress..."
echo "============================="

# Check for changes
git status --short

# Show what each agent has modified
echo -e "\n📊 Files Modified:"
git diff --name-only

# Show summary of changes
echo -e "\n📈 Change Summary:"
git diff --stat

# Count agent markers
echo -e "\n🤖 Agent Activity:"
echo "ML-Agent: $(grep -r "ML-Agent:" --include="*.py" . 2>/dev/null | wc -l) markers"
echo "Frontend-Agent: $(grep -r "Frontend-Agent:" --include="*.tsx" --include="*.ts" . 2>/dev/null | wc -l) markers"
echo "Testing-Agent: $(grep -r "Testing-Agent:" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | wc -l) markers"
echo "API-Agent: $(grep -r "API-Agent:" --include="*.js" src/api/ 2>/dev/null | wc -l) markers"
echo "DevOps-Agent: $(grep -r "DevOps-Agent:" --include="*.yml" --include="*.yaml" . 2>/dev/null | wc -l) markers"

echo -e "\n✅ Ready to commit? Run:"
echo "git add -A && git commit -m '🤖 Agent progress: [describe changes]' && git push"