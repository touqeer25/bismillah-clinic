"""PyInstaller entrypoint; build on Windows only (cross-compiling from Linux won't work)."""
from tools.screen_parser.app import launch

if __name__ == "__main__":
    launch()
