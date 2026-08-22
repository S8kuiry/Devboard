import os
import datetime
import jwt
import bcrypt

# Secret Key & Algorithm (Matches Spring Boot JwtService with fallback)
SECRET_KEY = os.getenv("JWT_SECRET") or "subhsecretmyverylongsecretkey123456"
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hashes a password using native BCrypt, truncating to 72 bytes safely."""
    # BCrypt silently truncates after 72 bytes; slice explicitly to avoid silent errors
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain text password against Spring Boot or Python BCrypt hashes ($2a$/$2b$)."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def generate_token(email: str) -> str:
    """
    Generates a JWT token valid for 100 days matching Spring Boot JwtService.
    Payload contains 'sub' (email), 'iat' (issued at), and 'exp' (expiration).
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    expiration = now + datetime.timedelta(days=100)

    payload = {
        "sub": email,
        "iat": now,
        "exp": expiration
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def extract_email(token: str) -> str | None:
    """Decodes the JWT and extracts user email (subject). Returns None if invalid or expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None