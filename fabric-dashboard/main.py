from fabric import Application
from fabric.widgets.wayland import WaylandWindow as Window
from fabric.widgets.box import Box
from fabric.utils import get_relative_path


def tile(cls):
    return Box(style_classes=["tile", cls])


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
            children=[tile("t-meter") for _ in range(4)],
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
        col_right = Box(orientation="v", children=[tile("t-apps")])

        self.add(
            Box(
                name="shell",
                orientation="h",
                spacing=16,
                children=[col_left, col_mid, col_right],
            )
        )


app = Application("dashboard", Dashboard())
app.set_stylesheet_from_file(get_relative_path("style.css"))
app.run()
