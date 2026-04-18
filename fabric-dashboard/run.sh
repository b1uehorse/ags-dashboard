#!/bin/bash
export HYPRLAND_INSTANCE_SIGNATURE=521ece463c4a9d3d128670688a34756805a4328f_1776493829_1632957526
export WAYLAND_DISPLAY=wayland-1
export XDG_RUNTIME_DIR=/run/user/1000
cd ~/fabric-dashboard
exec ./.venv/bin/python main.py
