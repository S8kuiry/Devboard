# tools/read_only_tool_handler.py

from services.task_client import get_tasks_by_owner, get_assigned_tasks, _trim_tasks
from services.plan_client import get_plans_by_owner, _trim_plans

def _handle_get_tasks(user_email: str, args: dict):
    return get_tasks_by_owner(user_email)

def _handle_get_assigned_tasks(user_email: str, args: dict):
    return get_assigned_tasks(user_email)

def _handle_display_tasks(user_email: str, args: dict):
    requested_ids = set(args.get("task_ids") or [])
    all_tasks = get_tasks_by_owner(user_email)
    return [
        t for t in all_tasks
        if (t.get("id") if isinstance(t, dict) else getattr(t, "id", None)) in requested_ids
    ]



# --- NEW: PLAN HANDLERS ---
def _handle_get_plans(user_email: str, args: dict):
    return get_plans_by_owner(user_email)

def _handle_display_plans(user_email: str, args: dict):
    requested_ids = set(args.get("plan_ids") or [])
    all_plans = get_plans_by_owner(user_email)
    return [
        p for p in all_plans
        if (p.get("id") if isinstance(p, dict) else getattr(p, "id", None)) in requested_ids
    ]
READ_ONLY_TOOL_HANDLERS = {
    # Task tools
    "get_tasks": _handle_get_tasks,
    "get_assigned_tasks": _handle_get_assigned_tasks,
    "display_tasks": _handle_display_tasks,
    
    # Plan tools
    "get_plans": _handle_get_plans,
    "display_plans": _handle_display_plans,
}

# tool_name -> (data_type label, trim function)
TOOL_DISPLAY_CONFIG = {
    "get_tasks":          ("TASK_LIST", _trim_tasks),
    "get_assigned_tasks": ("TASK_LIST", _trim_tasks),
    "display_tasks":      ("TASK_LIST", _trim_tasks),
    "get_plans":          ("PLAN_LIST", _trim_plans),
    "display_plans":      ("PLAN_LIST", _trim_plans),
}