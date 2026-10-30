"""
Authentication Utilities: Password hashing and verification using PBKDF2.
"""

import hashlib
import secrets
import hmac


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2 HMAC SHA256 with a unique salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify a plain password against a stored salt:hash string."""
    try:
        salt, key_hex = hashed.split(":", 1)
        expected_key = bytes.fromhex(key_hex)
        calculated_key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return hmac.compare_digest(expected_key, calculated_key)
    except Exception:
        return False
