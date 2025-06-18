# PharmOS Autonomous Conflict Resolution Guide

## 🤖 Automated Conflict Resolution System

### Conflict Detection & Classification

| Conflict Type | Auto-Resolvable | Strategy | Human Needed |
|---------------|-----------------|----------|--------------|
| Import statements | ✅ Yes | Merge both | ❌ No |
| Package dependencies | ✅ Yes | Latest version | ❌ No |
| Whitespace/formatting | ✅ Yes | Prettier/Black | ❌ No |
| New files | ✅ Yes | Keep both | ❌ No |
| Documentation | ✅ Yes | Combine sections | ❌ No |
| Test files | ✅ Yes | Keep all tests | ❌ No |
| Config files | ⚠️ Partial | Agent precedence | Sometimes |
| API routes | ⚠️ Partial | Check uniqueness | Sometimes |
| Database schemas | ❌ No | Manual review | ✅ Yes |
| Security changes | ❌ No | Manual review | ✅ Yes |

## 🔧 Resolution Strategies by File Type

### 1. JavaScript/TypeScript Files
```yaml
strategy:
  imports: combine_unique
  exports: check_conflicts
  functions: 
    - if_different_names: keep_both
    - if_same_name: compare_logic
  types: merge_interfaces
```

### 2. Python Files
```yaml
strategy:
  imports: sort_and_merge
  classes:
    - if_different: keep_both
    - if_inherited: check_mro
  functions: namespace_by_agent
```

### 3. Configuration Files
```yaml
priority_order:
  1: devops-monitoring  # DevOps agent has priority
  2: testing-suite      # Testing config next
  3: api-graphql        # API config
  4: ml-enhancement     # ML config
  5: frontend-polish    # Frontend config
```

### 4. Package Files
```yaml
package.json:
  dependencies: merge_highest_version
  scripts: merge_unique_names
  devDependencies: merge_all

requirements.txt:
  strategy: highest_compatible_version
  conflict_resolution: pip_compile
```

## 🔄 Automated Resolution Workflow

### Step 1: Conflict Detection
```bash
# Automatically run on PR update
git merge-tree $(git merge-base HEAD main) HEAD main
```

### Step 2: Classification
```javascript
// Classify conflict type
const conflictType = classifyConflict(file, conflictMarkers);
const strategy = resolutionStrategies[conflictType];
```

### Step 3: Resolution Attempt
```javascript
// Apply resolution strategy
if (strategy.autoResolvable) {
  const resolved = applyStrategy(conflict, strategy);
  await commitResolution(resolved);
} else {
  await escalateToHuman(conflict);
}
```

## 📊 Conflict Patterns & Learning

### Common Conflict Patterns

1. **Import Order Conflicts**
   - Pattern: Different import orders
   - Solution: Sort imports alphabetically
   - Success Rate: 100%

2. **Route Conflicts**
   - Pattern: Same endpoint path
   - Solution: Namespace by feature
   - Success Rate: 85%

3. **Type Definition Conflicts**
   - Pattern: Same interface, different properties
   - Solution: Merge into union type
   - Success Rate: 90%

### Learning System
```yaml
conflict_history:
  - type: import_conflict
    occurrences: 0
    auto_resolved: 0
    resolution_time: 0s
    
  - type: merge_conflict
    occurrences: 0
    auto_resolved: 0
    resolution_time: 0s
```

## 🚨 Escalation Criteria

### Immediate Human Intervention
1. **Security files** modified
2. **Database migrations** conflict
3. **API breaking changes**
4. **License files** modified
5. **CI/CD pipeline** changes

### Delayed Escalation (2 attempts)
1. Complex merge conflicts
2. Test failures after resolution
3. Build failures post-merge
4. Performance regression >25%

## 🤝 Agent Cooperation Protocol

### Pre-Conflict Prevention
```yaml
agent_coordination:
  before_modify:
    - check: is_file_owned_by_other_agent
    - action: create_coordination_pr
    - wait: other_agent_approval
    
  shared_files:
    - notify: all_affected_agents
    - strategy: collaborative_edit
    - merge: sequential_by_priority
```

### Conflict Resolution Communication
```markdown
## 🤖 Auto-Resolution Report

**Conflict Type**: Import order mismatch
**Files Affected**: src/api/routes.js
**Resolution Applied**: Alphabetical sort
**Confidence**: 95%
**Tests Passed**: ✅ All passing

No human intervention required.
```

## 📈 Conflict Metrics & Improvement

### Current Metrics
```yaml
total_conflicts: 0
auto_resolved: 0
human_interventions: 0
avg_resolution_time: 0s
success_rate: 0%
```

### Improvement Goals
1. **Week 1**: 70% auto-resolution rate
2. **Week 2**: 85% auto-resolution rate
3. **Week 4**: 95% auto-resolution rate

## 🛠️ Manual Override Commands

For human intervention when needed:

```bash
# Override auto-resolution
git merge --abort
git checkout --ours <file>  # Keep current branch version
git checkout --theirs <file> # Keep incoming version

# Custom resolution
git add <resolved-file>
git commit -m "Manual conflict resolution: <reason>"
```

## 🔄 Continuous Learning

The system automatically:
1. Logs all conflict resolutions
2. Analyzes success patterns
3. Updates resolution strategies
4. Improves accuracy over time
5. Shares learnings between agents