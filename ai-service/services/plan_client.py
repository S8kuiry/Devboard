import os
import time
import requests
from typing import Any, Dict, List, Optional
from fastapi import HTTPException

SPRINGBOOT_URL = os.getenv("SPRINGBOOT_URL", "http://localhost:8081")

# Independent cache for Plans (separate from the task cache in task_client.py)
_PLAN_CACHE: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 45


def _handle_response(response: requests.Response, error_message: str):
    if response.status_code in (200, 201):
        return response.json() if response.content else {"message": "Success"}
    elif response.status_code == 404:
        raise HTTPException(status_code=404, detail="Plan or Step not found")
    else:
        print(f"{error_message}: {response.status_code} - {response.text}")
        raise HTTPException(
            status_code=response.status_code if response.status_code < 500 else 500,
            detail=error_message,
        )


def invalidate_plan_cache(owner_email: str):
    """Purge cached plans whenever a user creates, updates, toggles, or deletes a plan/step."""
    _PLAN_CACHE.pop(f"plans:{owner_email}", None)


def get_plans_by_owner(owner_email: str) -> List[Dict[str, Any]]:
    """Fetch all plans (with steps) for an owner, 45s cached."""
    cache_key = f"plans:{owner_email}"
    now = time.time()
    if cache_key in _PLAN_CACHE:
        timestamp, cached_data = _PLAN_CACHE[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            return cached_data

    try:
        res = requests.get(f"{SPRINGBOOT_URL}/plans", params={"ownerEmail": owner_email}, timeout=5)
        data = _handle_response(res, f"Failed to fetch plans for {owner_email}")
        _PLAN_CACHE[cache_key] = (now, data)
        return data
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Plan service unavailable")


def delete_plan(plan_id: int, user_email: str) -> Dict[str, Any]:
    """Delete a plan (and its steps, cascaded server-side) by ID."""
    try:
        res = requests.delete(f"{SPRINGBOOT_URL}/plans/{plan_id}", timeout=5)
        result = _handle_response(res, f"Failed to delete plan #{plan_id}")
        invalidate_plan_cache(user_email)
        return result
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Plan service unavailable")

def sync_step_in_cache(owner_email: str, plan_id: int, step_id: int, is_completed: bool) -> bool:
    """
    Patches one step's isCompleted directly inside the cached plan list,
    instead of evicting the whole cache. Returns False (no-op) on a cache
    miss — the next get_plans_by_owner call will fetch fresh data anyway.
    """
    cache_key = f"plans:{owner_email}"
    cached = _PLAN_CACHE.get(cache_key)
    if cached is None:
        return False

    timestamp, cached_data = cached
    for plan in cached_data:
        if plan.get("id") == plan_id:
            for step in (plan.get("steps") or []):
                if step.get("id") == step_id:
                    step["isCompleted"] = is_completed
                    _PLAN_CACHE[cache_key] = (timestamp, cached_data)  # same TTL window, patched in place
                    return True
            break
    return False



def _trim_plans(plans: list[dict]) -> tuple[list[dict], list[dict]]:
    if not isinstance(plans, list):
        return [], []

    full_data = []
    llm_data = []

    for p in plans:
        if not isinstance(p, dict):
            continue

        full_data.append(p)

        steps = p.get("steps") or []
        completed = sum(1 for s in steps if isinstance(s, dict) and s.get("isCompleted"))

        llm_data.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "step_count": len(steps),
            "completed_count": completed,
            # only incomplete steps, only a preview of content — enough for
            # "what's next" reasoning without echoing the whole plan
            "next_steps": [
                {
                    "id": s.get("id"),
                    "content": (s.get("content") or "")[:85] + ("..." if len(s.get("content") or "") > 85 else ""),
                }
                for s in steps
                if isinstance(s, dict) and not s.get("isCompleted")
            ][:5],  # cap how many incomplete steps get echoed
        })

    return full_data, llm_data