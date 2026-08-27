TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_tasks",
            "description": "Fetch tasks for the current user.",
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
]