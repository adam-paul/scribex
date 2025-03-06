# WritingEditor Component Cheatsheet

## 1. Component Purpose and Responsibilities

The `WritingEditor` component is a cross-platform (web/mobile) rich text editor that provides a distraction-free writing environment for the ScribeX application. Its primary responsibilities include:

- Providing a dedicated writing interface with project genre-specific placeholders
- Supporting distraction-free "focus mode" for concentrated writing
- Managing text input with customizable font sizes
- Calculating and displaying word counts for writing progress
- Handling platform-specific differences between web and mobile
- Managing toolbar visibility based on keyboard state (mobile only)
- Supporting save operations with visual feedback

## 2. Props API

```typescript
interface WritingEditorProps {
  project: WritingProject;         // The current writing project with genre and metadata
  content: string;                 // The current content to display
  onContentChange: (content: string) => void;  // Handler when content changes
  onSave: () => void;              // Handler when save button is pressed
  focusMode?: boolean;             // Whether focus mode is enabled (hides UI)
  onToggleFocusMode?: () => void;  // Handler to toggle focus mode
}
```

### WritingProject Type

```typescript
interface WritingProject {
  id: string;              // Unique identifier
  title: string;           // Project title
  content: string;         // Writing content
  genre: WritingGenre;     // Essay, story, poetry, journalism, letter, speech, just-write
  wordCount: number;       // Number of words in content
  targetWordCount?: number; // Optional target word count
  dateCreated: string;     // ISO timestamp
  dateModified: string;    // ISO timestamp
  tags?: string[];         // Optional tags
  isCompleted: boolean;    // Whether project is marked complete
}
```

## 3. Internal State Management

The component manages several internal state variables:

- `fontSize` (number): Controls text display size (12-24px range)
- `keyboardVisible` (boolean): Tracks keyboard visibility on mobile
- `showToolbar` (boolean): Controls toolbar visibility
- `toolbarOpacity` (Animated.Value): Animation value for toolbar fade in/out

### Key State-Related Functions:

- `fadeOutToolbar()`: Animates toolbar disappearance when keyboard appears
- `fadeInToolbar()`: Animates toolbar appearance when keyboard is dismissed
- `increaseFontSize()`: Increases font size in 2px increments (max 24px)
- `decreaseFontSize()`: Decreases font size in 2px increments (min 12px)

## 4. Common Operations and Code Examples

### Initializing the Editor

```tsx
<WritingEditor
  project={currentProject}
  content={currentProject.content}
  onContentChange={handleContentChange}
  onSave={handleSave}
  focusMode={focusMode}
  onToggleFocusMode={toggleFocusMode}
/>
```

### Creating a Temporary Project Object

```tsx
const tempProject = {
  id: 'temp',
  title: 'Just Write',
  content: tempContent,
  genre: 'just-write',
  wordCount: tempContent.trim().split(/\s+/).filter(Boolean).length || 0,
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  isCompleted: false
};
```

### Handling Content Changes

```tsx
const handleContentChange = (content: string) => {
  if (currentProject) {
    updateContent(content); // Update via store
  } else {
    setTempContent(content); // Store temporarily
  }
};
```

### Calculating Word Count

```tsx
const wordCount = content.trim().split(/\s+/).filter(Boolean).length || 0;
```

## 5. Known Edge Cases or Pitfalls

- **Persistence Logic**: The component itself doesn't handle content persistence; this must be implemented by the parent component using `onSave`.
- **Platform Differences**: Mobile and web versions render differently and have different behaviors.
- **Focus Mode**: The mobile version has focus mode UI that hides when typing starts, which is not needed on web.
- **Keyboard Handling**: On mobile, keyboard events require special handling for UI adjustments.
- **Content State**: The editor treats content as a controlled component, so state must be maintained externally.
- **Empty Projects**: The component needs special handling for empty "Just Write" sessions before they're saved as projects.
- **Word Count Calculation**: The current implementation of word counting doesn't account for complex Unicode text properly.

## 6. Interaction with Other Components

- **Parent Component**: Typically used within `write.tsx` tab, which manages project state and handles save operations.
- **State Management**: Interacts with the `useWritingStore` Zustand store for content persistence and project data.
- **Navigation**: Doesn't handle navigation directly; the parent component must manage navigation between projects and editor views.

### State Flow Diagram

```
┌───────────────┐         ┌─────────────────┐         ┌──────────────┐
│ writing-store │◄────────┤ write.tsx       │◄────────┤ WritingEditor │
│ (Zustand)     │         │ (Parent)        │         │ (Component)   │
└───────┬───────┘         └────────┬────────┘         └──────┬───────┘
        │                          │                         │
        ├──────────────────────────┘                         │
        │           projects, currentProject                 │
        │                                                    │
        └────────────────────────────────────────────────────┘
                    content, onContentChange
```

## 7. Performance Considerations

- **Text Input Handling**: Large documents can cause performance issues with React Native's TextInput.
- **Animations**: Toolbar animations should use `useNativeDriver: true` for better performance.
- **Render Optimization**: 
  - Separate rendering paths for web and mobile reduce unnecessary code execution
  - Component uses conditional rendering based on platform
- **Word Count Calculation**: Performed on every render; could be optimized for very large documents.
- **Keyboard Handling**: Mobile keyboard event listeners are properly cleaned up to prevent memory leaks.
- **Style Calculations**: Font size is dynamically applied to style arrays rather than creating new objects.

## 8. Recommended Changes/Improvements

1. **Rich Text Support**: Add basic formatting options (bold, italic, headings).
2. **Auto-save**: Implement automatic saving with debounce instead of relying on manual saves.
3. **Undo/Redo**: Add undo/redo functionality for better editing experience.
4. **Markdown Support**: Add markdown previewing or syntax highlighting.
5. **Selection Tools**: Add text selection tools (cut, copy, paste, select all).
6. **Custom Keyboards**: Add a custom keyboard for common writing functions on mobile.
7. **Accessibility**: Improve screen reader support and keyboard navigation.
8. **Performance Optimization**: Memoize components and functions to prevent unnecessary re-renders.
9. **Error Handling**: Add error boundary for handling TextInput crashes.
10. **Font Options**: Allow users to select different fonts in addition to font sizes.
11. **Theme Support**: Connect the component to the app's theme context for dark mode support.
12. **Internationalization**: Improve word count for non-Latin scripts and languages.