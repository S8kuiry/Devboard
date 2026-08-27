
from fastapi import HTTPException
import requests
import os

spring_boot_url = os.getenv("SPRINGBOOT_URL")
def get_tasks(user_email:str):
    try:
        response = requests.get(f"{spring_boot_url}/tasks",
                                params={"ownerEmail": user_email})

        return response.json()
    except Exception as e:
        # 2. Runs ONLY if an error occurs inside the try block
        print(f"Error fetching tasks for {user_email}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to retrieve user tasks from database."
        )
