import logging

def setup_logging():
    """Configure logging for the application."""
    # Configure root logger to WARNING to suppress most external logs
    logging.getLogger().setLevel(logging.WARNING)

    # Configure our logger for debug
    logger = logging.getLogger('whisper')
    logger.setLevel(logging.DEBUG)

    # Set botocore and urllib3 to WARNING
    logging.getLogger('botocore').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

    # Add a formatter and handler for our logger
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger 