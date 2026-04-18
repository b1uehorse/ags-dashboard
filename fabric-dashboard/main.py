import subprocess, os, socket, threading
from fabric import Application
from fabric.widgets.wayland import WaylandWindow as Window
from fabric.widgets.box import Box
from fabric.widgets.button import Button
from fabric.widgets.label import Label
from fabric.widgets.overlay import Overlay
from fabric.widgets.circularprogressbar import CircularProgressBar
from gi.repository import Gtk as _Gtk
from fabric.utils import get_relative_path


def tile(cls, child=None):
    kw = {"style_classes": ["tile", cls]}
    if child is not None:
        kw["children"] = [child] if not isinstance(child, list) else child
    return Box(**kw)


def meter(icon, value):
    ring = CircularProgressBar(
        value=value, min_value=0.0, max_value=1.0,
        line_width=8, line_style="round",
        style_classes=["meter-ring"],
        h_expand=True, v_expand=True,
        h_align="fill", v_align="fill",
    )
    ring.set_size_request(68, 68)
    icon_lbl = Label(label=icon, style_classes=["meter-icon"], h_align="center", v_align="center")
    pct_lbl = Label(label=f"{int(value*100)}%", style_classes=["meter-pct"])
    ov = Overlay(child=ring, overlays=[icon_lbl])
    ov.set_size_request(68, 68)
    return Box(
        style_classes=["tile", "t-meter"],
        orientation="v", spacing=2,
        h_align="center", v_align="center",
        children=[ov, pct_lbl],
    )


def launch_sm(*_):
    subprocess.Popen(
        ["kitty", "zsh", "-ic", "sm"],
        start_new_session=True,
    )


def sm_button():
    return Button(
        label="",
        style_classes=["app-btn"],
        on_clicked=launch_sm,
    )


class Dashboard(Window):
    def __init__(self):
        super().__init__(
            layer="bottom",
            anchor="center",
            exclusivity="none",
            visible=True,
            all_visible=True,
        )

        col_left = Box(
            orientation="v",
            spacing=10,
            children=[tile("t-profile"), tile("t-quote")],
        )

        meters_row = Box(
            orientation="h",
            spacing=10,
            children=[
                meter("", 0.42),
                meter("", 0.61),
                meter("", 0.18),
                meter("", 0.73),
            ],
        )

        mid_top = Box(
            orientation="h",
            spacing=10,
            children=[
                Box(
                    orientation="v",
                    spacing=10,
                    children=[meters_row, tile("t-clock")],
                ),
                tile("t-music"),
            ],
        )

        mid_bot = Box(
            orientation="h",
            spacing=10,
            children=[tile("t-weather"), tile("t-tasks")],
        )

        col_mid = Box(orientation="v", spacing=10, children=[mid_top, mid_bot])

        col_right = Box(
            style_classes=["tile", "t-apps"],
            orientation="v",
            spacing=8,
            h_align="center",
            v_align="start",
            children=[sm_button()],
        )

        self.add(
            Box(
                name="shell",
                orientation="h",
                spacing=16,
                children=[col_left, col_mid, col_right],
            )
        )


dash = Dashboard()
app = Application("dashboard", dash)
app.set_stylesheet_from_file(get_relative_path("style.css"))


PINNED_WS = 1
HIS = os.environ.get("HYPRLAND_INSTANCE_SIGNATURE", "")
SOCK = f"/run/user/{os.getuid()}/hypr/{HIS}/.socket2.sock"


def apply_visible(ws_id: int):
    from gi.repository import GLib
    GLib.idle_add(lambda: dash.show() if ws_id == PINNED_WS else dash.hide())


def listen_hypr():
    try:
        cur = subprocess.check_output(["hyprctl", "-j", "activeworkspace"]).decode()
        import json
        apply_visible(json.loads(cur).get("id", -1))
    except Exception:
        pass
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(SOCK)
    f = s.makefile("r")
    for line in f:
        if line.startswith("workspace>>"):
            try:
                apply_visible(int(line.split(">>", 1)[1].strip()))
            except Exception:
                pass


threading.Thread(target=listen_hypr, daemon=True).start()
app.run()
