TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_tasks",
            "description": "Fetch tasks that the current user owns/created themselves (not tasks assigned to them by others).",
            "parameters": {"type": "object", "properties": {}},
        },
    },
        {
        "type": "function",
        "function": {
            "name": "get_assigned_tasks",
            "description": "Fetch tasks that have been assigned to the current user by someone else (not tasks they created themselves).",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a task. Requires title and optional detailed description, priority, and due date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Task title"},
                    "description": {"type": "string", "description": "Detailed task description"},
                    "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"]},
                    "dueDate": {"type": "string", "description": "ISO date format (YYYY-MM-DD)"},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update existing task status, title, or details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "Task ID"},
                    "status": {"type": "string", "enum": ["TODO", "IN_PROGRESS", "DONE"]},
                    "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"]},

                    "title": {"type": "string"},
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "Task ID to delete"},
                },
                "required": ["task_id"],
            },
        },
    },
        {
        "type": "function",
        "function": {
            "name": "display_tasks",
            "description": (
                "Display specific tasks to the user as visual cards. Call this whenever you want "
                "to show one or more tasks (e.g. 'show my tasks', 'show the recent one', "
                "'show high-priority tasks', 'show the task you recommended'). "
                "Pass the task_ids of the tasks to display — you must already know these IDs "
                "from an earlier get_tasks or get_assigned_tasks call in this conversation. "
                "If you don't have task IDs yet, call get_tasks first."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "IDs of the tasks to display as cards",
                    },
                },
                "required": ["task_ids"],
            },
        },
    },
]