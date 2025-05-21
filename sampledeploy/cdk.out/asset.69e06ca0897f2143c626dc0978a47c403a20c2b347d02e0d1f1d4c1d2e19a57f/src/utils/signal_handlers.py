import signal
import sys
import logging

logger = logging.getLogger('whisper')

def setup_signal_handlers():
    """Set up signal handlers for graceful shutdown."""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    logger.info("Signal handlers configured for graceful shutdown")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    signal_name = 'SIGINT' if signum == signal.SIGINT else 'SIGTERM'
    logger.info(f"\nReceived {signal_name}. Shutting down gracefully...")
    sys.exit(0) 