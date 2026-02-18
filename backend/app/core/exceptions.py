"""
Custom exceptions for the application.

Provides a hierarchy of exceptions for different error scenarios with
standardized error codes and response format.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from loguru import logger
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError

from app.core.error_codes import ErrorCode


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: ErrorCode | str | None = None
    ):
        self.message = message
        self.status_code = status_code
        # Accept both ErrorCode enum and string
        if isinstance(code, ErrorCode):
            self.code = code.value
        elif code:
            self.code = code
        else:
            self.code = ErrorCode.INTERNAL_ERROR.value
        super().__init__(message)


class NotFoundError(AppException):
    """Resource not found error."""

    def __init__(
        self,
        message: str = "Resource not found",
        resource: str = None,
        code: ErrorCode | str = ErrorCode.NOT_FOUND
    ):
        if resource:
            message = f"{resource} not found"
        super().__init__(message, 404, code)


class ValidationError(AppException):
    """Validation error."""

    def __init__(
        self,
        message: str = "Validation failed",
        code: ErrorCode | str = ErrorCode.VALIDATION_ERROR
    ):
        super().__init__(message, 422, code)


class AuthenticationError(AppException):
    """Authentication required error."""

    def __init__(
        self,
        message: str = "Authentication required",
        code: ErrorCode | str = ErrorCode.UNAUTHORIZED
    ):
        super().__init__(message, 401, code)


class AuthorizationError(AppException):
    """Permission denied error."""

    def __init__(
        self,
        message: str = "Permission denied",
        code: ErrorCode | str = ErrorCode.FORBIDDEN
    ):
        super().__init__(message, 403, code)


class ConflictError(AppException):
    """Resource conflict error."""

    def __init__(
        self,
        message: str = "Resource conflict",
        code: ErrorCode | str = ErrorCode.CONFLICT
    ):
        super().__init__(message, 409, code)


class RateLimitError(AppException):
    """Rate limit exceeded error."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: int = None,
        code: ErrorCode | str = ErrorCode.RATE_LIMITED
    ):
        self.retry_after = retry_after
        super().__init__(message, 429, code)


def register_exception_handlers(app: FastAPI):
    """Register custom exception handlers with FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle all AppException subclasses with standardized response format."""
        response_content = {
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
            },
        }

        # Add retry_after for rate limit errors
        if isinstance(exc, RateLimitError) and exc.retry_after:
            response_content["error"]["retry_after"] = exc.retry_after

        return JSONResponse(
            status_code=exc.status_code,
            content=response_content,
        )

    @app.exception_handler(PydanticValidationError)
    async def pydantic_validation_exception_handler(
        request: Request, exc: PydanticValidationError
    ):
        """Handle Pydantic validation errors with standardized response format."""
        errors = exc.errors()
        if errors:
            # Get the first error message for simplicity
            first_error = errors[0]
            field = ".".join(str(loc) for loc in first_error.get("loc", []))
            message = first_error.get("msg", "Validation failed")
            if field:
                message = f"{field}: {message}"
        else:
            message = "Validation failed"

        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.VALIDATION_ERROR.value,
                    "message": message,
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Handle FastAPI request validation errors."""
        body = await request.body()
        logger.error(f"Request validation error for {request.url}")
        logger.error(f"Detail: {exc.errors()}")
        logger.error(f"Body: {body.decode()}")

        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.VALIDATION_ERROR.value,
                    "message": str(exc.errors()),
                },
            },
        )
