"""Runtime configuration validation for the KORA backend."""

from dataclasses import dataclass
import os
from typing import Mapping


DEPLOYED_ENVIRONMENTS = {"production", "staging"}
SUPPORTED_ENVIRONMENTS = DEPLOYED_ENVIRONMENTS | {"development", "test"}
DEVELOPMENT_JWT_SECRET = "development-only-jwt-secret"
DEVELOPMENT_ADMIN_SECRET = "development-only-admin-secret"
DEVELOPMENT_CORS_ORIGINS = ("http://localhost:3000", "http://localhost:8081")


@dataclass(frozen=True)
class Settings:
    app_env: str
    jwt_secret: str
    admin_secret: str
    cors_origins: tuple[str, ...]


def _required_secret(name: str, environment: Mapping[str, str], fallback: str) -> str:
    value = environment.get(name)
    if value is not None:
        value = value.strip()
    if value:
        return value
    raise ValueError(f"{name} must be set to a non-empty value")


def _development_secret(name: str, environment: Mapping[str, str], fallback: str) -> str:
    value = environment.get(name)
    if value is None:
        return fallback
    value = value.strip()
    if not value:
        raise ValueError(f"{name} must not be empty when set")
    return value


def _parse_cors_origins(raw_value: str) -> tuple[str, ...]:
    origins = tuple(origin.strip() for origin in raw_value.split(",") if origin.strip())
    if not origins:
        raise ValueError("CORS_ORIGINS must contain at least one origin")
    return origins


def load_settings(environment: Mapping[str, str] | None = None) -> Settings:
    """Read and validate runtime settings from an environment mapping."""
    env = os.environ if environment is None else environment
    app_env = env.get("APP_ENV", "development").strip().lower()
    if not app_env:
        raise ValueError("APP_ENV must not be empty")
    if app_env not in SUPPORTED_ENVIRONMENTS:
        raise ValueError(
            "APP_ENV must be one of: development, test, staging, production"
        )

    deployed = app_env in DEPLOYED_ENVIRONMENTS
    secret_loader = _required_secret if deployed else _development_secret
    jwt_secret = secret_loader("JWT_SECRET", env, DEVELOPMENT_JWT_SECRET)
    admin_secret = secret_loader("ADMIN_SECRET", env, DEVELOPMENT_ADMIN_SECRET)

    raw_origins = env.get("CORS_ORIGINS")
    cors_origins = (
        _parse_cors_origins(raw_origins)
        if raw_origins is not None
        else DEVELOPMENT_CORS_ORIGINS
    )
    if deployed and raw_origins is None:
        raise ValueError("CORS_ORIGINS must be set in production and staging")
    if deployed and "*" in cors_origins:
        raise ValueError("CORS_ORIGINS must not contain a wildcard in production or staging")

    return Settings(
        app_env=app_env,
        jwt_secret=jwt_secret,
        admin_secret=admin_secret,
        cors_origins=cors_origins,
    )
