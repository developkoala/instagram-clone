"""
Logging configuration based on environment
"""
import logging
import sys
from app.config import get_settings

settings = get_settings()

def setup_logger(name: str = __name__) -> logging.Logger:
    """
    Set up logger with environment-specific configuration
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Set log level based on environment
    log_level = getattr(logging, settings.log_level, logging.INFO)
    logger.setLevel(log_level)
    
    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Create formatter
    if settings.environment == "development":
        # Detailed format for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        # Simpler format for production
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Prevent propagation to avoid duplicate logs
    logger.propagate = False
    
    return logger

# Default logger instance
logger = setup_logger(__name__)

# Usage example:
# from app.logger import logger
# logger.debug("Debug message - only shown in development")
# logger.info("Info message")
# logger.warning("Warning message")
# logger.error("Error message")