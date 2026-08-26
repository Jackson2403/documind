"""Capture a screenshot of the DocuMind window and save to docs/screenshot.png.
Uses Win32 API to find the window by title, then captures its region."""

import ctypes
import ctypes.wintypes
import time
import os
import sys

class RECT(ctypes.Structure):
    _fields_ = [
        ("left",   ctypes.c_long),
        ("top",    ctypes.c_long),
        ("right",  ctypes.c_long),
        ("bottom", ctypes.c_long),
    ]

# Find the DocuMind window
user32 = ctypes.windll.user32
hwnd = user32.FindWindowW(None, "DocuMind")

if not hwnd:
    print("DocuMind window not found, capturing full screen instead.")
    use_fullscreen = True
else:
    use_fullscreen = False
    user32.SetForegroundWindow(hwnd)
    user32.ShowWindow(hwnd, 9)
    time.sleep(0.5)
    rect = RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(rect))
    x, y, w, h = rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top
    print(f"Found DocuMind window: {x},{y} {w}x{h}")

# Try mss (fast), then PIL (ImageGrab)
try:
    import mss
    with mss.mss() as sct:
        if use_fullscreen:
            mon = sct.monitors[0]
            img = sct.grab(mon)
        else:
            img = sct.grab({"left": x, "top": y, "width": w, "height": h})
        from PIL import Image
        pil_img = Image.frombytes("RGB", img.size, img.rgb)
except ImportError:
    try:
        from PIL import ImageGrab
        if use_fullscreen:
            pil_img = ImageGrab.grab()
        else:
            pil_img = ImageGrab.grab(bbox=(x, y, x + w, y + h))
    except ImportError:
        print("ERROR: Need either mss or pillow (PIL). Install with: pip install pillow mss")
        sys.exit(1)

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "screenshot.png")
pil_img.save(out, "PNG")
size = os.path.getsize(out)
print(f"Saved to {out}  ({size} bytes)")