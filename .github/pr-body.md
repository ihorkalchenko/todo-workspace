This pull request implements a priority badge feature for the todo application, allowing tasks to display their priority level with visual indicators and color-coded styling.

### Commits:
1. **TD-019: [web] add priority badge feature** - Initial implementation with all core features
2. **TD-019: [web] remove redundant comments** - Code cleanup and refinement
3. **TD-019: [web] add tasks store unit tests** - Comprehensive unit test coverage for the tasks store

### Key Changes:
**1. New Priority Badge Component (priority-badge)**

Reusable Angular component that displays priority levels with:
- Colorized badges (Highest → Red, High → Orange, Medium → Amber, Low → Slate, Lowest → Blue)
- Visual icons representing priority escalation (arrow directions)
- Optional label display
- Accessibility support (title attributes)
- Comprehensive unit tests

**2. Service Updates**

TasksDataService: 
- Enhanced createTask() to accept optional priority parameter

TasksService: 
- Migrated from basic Angular signals to NgRx Signal Store architecture for better state management:
- Centralized state with TaskState interface
- New methods: loadTasks(), createTask(), updateTask(), deleteTask(), moveTask()
- Optimistic UI updates for drag-and-drop operations
- Built-in loading state tracking
- Comprehensive unit test coverage

**3. UI Integration**

Task Card: 
- Added priority badge display next to task title

Task Details Page:
- New priority selector with 5-button grid (Lowest to Highest)
- Dynamic button styling based on selection state
- Priority field integrated into task form
