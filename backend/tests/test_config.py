import pytest

from config import (
    DEVELOPMENT_ADMIN_SECRET,
    DEVELOPMENT_CORS_ORIGINS,
    DEVELOPMENT_JWT_SECRET,
    load_settings,
)


@pytest.mark.parametrize("app_env", ["production", "staging"])
@pytest.mark.parametrize("missing_secret", ["JWT_SECRET", "ADMIN_SECRET"])
def test_deployed_environments_require_secrets(app_env, missing_secret):
    environment = {
        "APP_ENV": app_env,
        "JWT_SECRET": "jwt-value",
        "ADMIN_SECRET": "admin-value",
        "CORS_ORIGINS": "https://kora.example",
    }
    del environment[missing_secret]

    with pytest.raises(ValueError, match=missing_secret):
        load_settings(environment)


@pytest.mark.parametrize("app_env", ["production", "staging"])
@pytest.mark.parametrize("empty_secret", ["JWT_SECRET", "ADMIN_SECRET"])
def test_deployed_environments_reject_empty_secrets(app_env, empty_secret):
    environment = {
        "APP_ENV": app_env,
        "JWT_SECRET": "jwt-value",
        "ADMIN_SECRET": "admin-value",
        "CORS_ORIGINS": "https://kora.example",
    }
    environment[empty_secret] = "   "

    with pytest.raises(ValueError, match=empty_secret):
        load_settings(environment)


def test_development_defaults_are_explicitly_development_only():
    settings = load_settings({})

    assert settings.app_env == "development"
    assert settings.jwt_secret == DEVELOPMENT_JWT_SECRET
    assert settings.admin_secret == DEVELOPMENT_ADMIN_SECRET
    assert settings.cors_origins == DEVELOPMENT_CORS_ORIGINS


@pytest.mark.parametrize("app_env", ["", "prod", "unknown"])
def test_invalid_app_environment_is_rejected(app_env):
    with pytest.raises(ValueError, match="APP_ENV"):
        load_settings({"APP_ENV": app_env})


def test_cors_origins_parses_multiple_trimmed_values():
    settings = load_settings(
        {"CORS_ORIGINS": " https://one.example,https://two.example , "}
    )

    assert settings.cors_origins == ("https://one.example", "https://two.example")


@pytest.mark.parametrize("app_env", ["production", "staging"])
def test_deployed_environments_reject_wildcard_cors(app_env):
    with pytest.raises(ValueError, match="wildcard"):
        load_settings(
            {
                "APP_ENV": app_env,
                "JWT_SECRET": "jwt-value",
                "ADMIN_SECRET": "admin-value",
                "CORS_ORIGINS": "https://kora.example,*",
            }
        )


@pytest.mark.parametrize("app_env", ["production", "staging"])
def test_deployed_environments_require_cors_origins(app_env):
    with pytest.raises(ValueError, match="CORS_ORIGINS"):
        load_settings(
            {
                "APP_ENV": app_env,
                "JWT_SECRET": "jwt-value",
                "ADMIN_SECRET": "admin-value",
            }
        )
