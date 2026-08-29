
# tools/mutating_tool_handler.py

from services.task_client import (
    create_task,
    get_task_by_id,
    update_task,
    delete_task,
)

from services.plan_client import (
    delete_plan,
)


# ============================================================
# TASK HANDLERS
# ============================================================

def _handle_create_task(args: dict, user_email: str):
    payload = {
        "title": args.get("title"),
        "description": args.get("description", ""),
        "priority": args.get("priority", "MEDIUM"),
        "dueDate": args.get("dueDate"),
        "ownerEmail": user_email,
    }

    result = create_task(payload)

    return (
        f"Task '{result.get('title')}' "
        f"(ID: #{result.get('id')}) created successfully."
    )


def _handle_update_task(args: dict, user_email: str):
    task_id = args.get("task_id")

    # Fetch the existing task first so fields that were not
    # requested by the user are not accidentally overwritten.
    existing = get_task_by_id(task_id)

    if "status" in args:
        existing["status"] = args["status"]

    if "title" in args:
        existing["title"] = args["title"]

    update_task(task_id, existing)

    return f"Task #{task_id} updated successfully."


def _handle_delete_task(args: dict, user_email: str):
    task_id = args.get("task_id")

    delete_task(
        task_id,
        current_user_email=user_email,
    )

    return f"Task #{task_id} deleted successfully."


# ============================================================
# PLAN HANDLERS
# ============================================================




def _handle_delete_plan(args: dict, user_email: str):
    plan_id = args.get("plan_id")

    delete_plan(
        plan_id,
        user_email,
    )

    return f"Plan #{plan_id} deleted successfully."


# ============================================================
# MUTATING TOOL HANDLERS
# ============================================================

MUTATING_ACTION_HANDLERS = {

    # Task tools
    "create_task": _handle_create_task,
    "update_task": _handle_update_task,
    "delete_task": _handle_delete_task,

    # Plan tools
    "delete_plan": _handle_delete_plan,
}


# ============================================================
# OPTIONAL: ACTION RESPONSE CONFIG
# ============================================================

# tool_name -> success message prefix/type
#
# This is optional right now. You don't need to use it in
# /execute-action yet, but keeping this config here gives you
# one central place for future action-specific behavior.

MUTATING_TOOL_CONFIG = {
    "create_task": {
        "resource": "task",
        "action": "create",
    },

    "update_task": {
        "resource": "task",
        "action": "update",
    },

    "delete_task": {
        "resource": "task",
        "action": "delete",
    },

    "toggle_plan_step": {
        "resource": "plan_step",
        "action": "toggle",
    },

    "delete_plan": {
        "resource": "plan",
        "action": "delete",
    },
}

