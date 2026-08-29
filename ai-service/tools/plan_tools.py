PLAN_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_plans",
            "description": "Fetch all execution plans and their steps created by the current user.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "display_plans",
            "description": (
                "Display specific plans to the user as visual cards. Call this whenever you want "
                "to show one or more plans (e.g. 'show my plans', 'show the deployment one', "
                "'show plans with unfinished steps'). Pass the plan_ids of the plans to display — "
                "you must already know these IDs from an earlier get_plans call in this conversation. "
                "If you don't have plan IDs yet, call get_plans first."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "IDs of the plans to display as cards",
                    },
                },
                "required": ["plan_ids"],
            },
        },
    },
   
    {
        "type": "function",
        "function": {
            "name": "delete_plan",
            "description": "Delete an entire plan and its associated steps by plan ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_id": {"type": "integer", "description": "Plan ID to delete"},
                },
                "required": ["plan_id"],
            },
        },
    },
]