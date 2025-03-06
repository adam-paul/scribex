# Claude Optimized Repository Layer for ScribeX

This directory contains a Claude-optimized metadata layer to help AI assistants like Claude work more efficiently with this codebase. The structure provides machine-readable information about the application's architecture, common error patterns, component relationships, and more.

## Directory Structure

```
.claude/
├── metadata/                # Normalized information about the codebase
│   ├── component_dependencies.json   # Component dependency graph
│   ├── file_classification.json      # File categorization and purpose
│   ├── error_patterns.json           # Common error patterns and solutions
│   └── model_docs/                   # Model-friendly documentation
│       └── progress-store.md         # Documentation for key modules
│
├── code_index/              # Pre-analyzed semantic relationships
│   ├── function_call_graph.json      # Function-to-function call relationships
│   ├── type_relationships.json       # Type definitions and relationships
│   └── intent_classification.json    # Purpose/intent of code sections
│
├── debug_history/           # Log of debugging sessions and solutions
│   ├── auth_signout_bug.md           # Authentication signout issue
│   └── api_rate_limit_bug.md         # OpenAI API rate limiting fix
│
├── patterns/                # Implementation patterns with examples
│   └── error_handling.json           # Error handling patterns
│
├── cheatsheets/             # Quick reference guides for components
│   └── components/
│       └── WritingEditor.md          # WritingEditor component reference
│
├── qa/                      # Queries and answers database
│   └── auth_persistent_login_issue.md # Authentication persistence Q&A
│
└── delta/                   # Change summaries between versions
    └── minimize_branch_changes.md    # Changes in the minimize branch
```

## Using This Directory

As an AI assistant, you should:

1. **First and foremost**, review the relevant sections of this directory when working with the codebase
2. Consult the pattern libraries when implementing new features
3. Check error patterns when debugging issues
4. Reference the component dependency graph when modifying components
5. Use the cheatsheets for quick information on specific components
6. Check the debug history for previously solved issues
7. Use the model docs for in-depth understanding of key modules

## Key Memory Anchors

The codebase includes specially formatted comments that serve as memory anchors with unique UUIDs:

### AI Service
`CLAUDE-ANCHOR::e9f42d6a-bc61-48d5-a7c3-f37c18e9b4e0` - AI integration service

### Authentication Context
`CLAUDE-ANCHOR::b3d8f45c-724e-4aa2-95c3-167dce05f1d9` - Authentication state management

### Lesson Store
`CLAUDE-ANCHOR::c72a1e6d-9874-4125-8d33-d5f46a034823` - Exercise data management

## Maintenance

This directory structure should be maintained and expanded as the codebase evolves. When making significant changes to the repository, please:

1. Update the relevant metadata files
2. Add new memory anchors for key sections
3. Document debugging sessions in the debug_history directory
4. Add new pattern examples as they emerge

## Benefits

This Claude-optimized layer provides:

1. Faster context loading for AI assistants
2. More accurate code understanding
3. Better debugging assistance
4. Consistent patterns for common tasks
5. Preservation of institutional knowledge about the codebase