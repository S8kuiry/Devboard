import os
import time
import requests
from typing import Any, Dict, List
from fastapi import HTTPException

SPRINGBOOT_URL = os.getenv("SPRINGBOOT_URL", "http://localhost:8080")

# Cache storage: { cache_key: (timestamp, task_data) }
_TASK_CACHE: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 45  # 30-second TTL cache


def _handle_response(response: requests.Response, error_message: str):
    if response.status_code in (200, 201):
        return response.json() if response.content else {"message": "Success"}
    elif response.status_code == 404:
        raise HTTPException(status_code=404, detail="Task not found")
    else:
        print(f"{error_message}: {response.status_code} - {response.text}")
        raise HTTPException(
            status_code=response.status_code if response.status_code < 500 else 500,
            detail=error_message,
        )


def invalidate_user_cache(user_email: str):
    """Purge cached data whenever a user creates, updates, or deletes a task."""
    _TASK_CACHE.pop(f"owner:{user_email}", None)
    _TASK_CACHE.pop(f"assigned:{user_email}", None)


def get_tasks_by_owner(owner_email: str) -> List[Dict[str, Any]]:
    """Fetch tasks created by owner with 30-second caching."""
    cache_key = f"owner:{owner_email}"
    now = time.time()
    if cache_key in _TASK_CACHE:
        timestamp, cached_data = _TASK_CACHE[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            return cached_data

    try:
        res = requests.get(f"{SPRINGBOOT_URL}/tasks", params={"ownerEmail": owner_email}, timeout=5)
        data = _handle_response(res, f"Failed to fetch tasks for owner {owner_email}")
        _TASK_CACHE[cache_key] = (now, data)
        return data
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Task service unavailable")


def get_assigned_tasks(assigned_email: str) -> List[Dict[str, Any]]:
    """Fetch tasks assigned to a specific user with 30-second caching."""
    cache_key = f"assigned:{assigned_email}"
    now = time.time()
    if cache_key in _TASK_CACHE:
        timestamp, cached_data = _TASK_CACHE[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            return cached_data

    try:
        res = requests.get(f"{SPRINGBOOT_URL}/tasks", params={"assignedEmail": assigned_email}, timeout=5)
        data = _handle_response(res, f"Failed to fetch assigned tasks for {assigned_email}")
        _TASK_CACHE[cache_key] = (now, data)
        return data
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Task service unavailable")


def get_task_by_id(task_id: int) -> Dict[str, Any]:
    """Fetch single task by ID."""
    try:
        res = requests.get(f"{SPRINGBOOT_URL}/tasks/{task_id}", timeout=5)
        return _handle_response(res, f"Failed to fetch task #{task_id}")
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Task service unavailable")


def create_task(task_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        res = requests.post(f"{SPRINGBOOT_URL}/tasks", json=task_data, timeout=5)
        result = _handle_response(res, "Failed to create task")
        if owner := task_data.get("ownerEmail"):
            invalidate_user_cache(owner)
        return result
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Task service unavailable")


def update_task(task_id: int, task_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        res = requests.put(f"{SPRINGBOOT_URL}/tasks/{task_id}", json=task_data, timeout=5)
        result = _handle_response(res, f"Failed to update task #{task_id}")
        if owner := task_data.get("ownerEmail"):
            invalidate_user_cache(owner)
        return result
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Task service unavailable")


def delete_task(task_id: int, current_user_email: str) -> Dict[str, Any]:
    """Deletes a task only if current_user_email matches the task's ownerEmail."""
    # 1. Fetch task to check ownership
    task = get_task_by_id(task_id)

    # 2. Ownership Safeguard Check
    if task.get("ownerEmail") != current_user_email:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only delete tasks that you own."
        )

    try:
        res = requests.delete(f"{SPRINGBOOT_URL}/tasks/{task_id}", timeout=5)
        result = _handle_response(res, f"Failed to delete task #{task_id}")
        
        # Invalidate cache for the task owner
        invalidate_user_cache(current_user_email)
        return result
    except requests.RequestException as e:
        print(f"Connection error to Spring Boot: {str(e)}")
        raise HTTPException(status_code=503, detail="Task service unavailable")