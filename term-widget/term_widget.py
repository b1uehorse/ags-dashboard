#!/usr/bin/env python3
# term-widget — терминал-виджет через layer-shell (background) + VTE.
# layer=BACKGROUND: не перекрывается обычными окнами, но и не крадёт фокус.
# keyboard_mode=NONE: клавиатура не захватывается — окно не killable через Super+Q.
# При смерти процесса внутри VTE — перезапуск в том же окне, layout чужих окон не дёргается.

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("Vte", "2.91")
gi.require_version("GtkLayerShell", "0.1")

from gi.repository import Gtk, Vte, GLib, Pango, GtkLayerShell  # noqa: E402

COMMAND = ["btop"]
FONT = "JetBrainsMono Nerd Font 10"
WIDTH, HEIGHT = 520, 360
MARGIN_TOP = 40
MARGIN_RIGHT = 40


def build_terminal(on_exit):
    term = Vte.Terminal()
    term.set_font(Pango.FontDescription.from_string(FONT))
    term.set_scrollback_lines(2000)
    term.set_mouse_autohide(True)
    term.set_cursor_blink_mode(Vte.CursorBlinkMode.OFF)
    term.set_size_request(WIDTH, HEIGHT)
    term.connect("child-exited", lambda *a: on_exit())

    def _spawned(_term, _pid, _err, *_):
        return None

    term.spawn_async(
        Vte.PtyFlags.DEFAULT,
        None,
        COMMAND,
        [],
        GLib.SpawnFlags.SEARCH_PATH,
        None,
        None,
        -1,
        None,
        _spawned,
    )
    return term


class TermWidget:
    def __init__(self):
        self.win = Gtk.Window(type=Gtk.WindowType.TOPLEVEL)
        self.win.set_name("term-widget")
        self.win.set_default_size(WIDTH, HEIGHT)
        self.win.set_resizable(False)

        GtkLayerShell.init_for_window(self.win)
        GtkLayerShell.set_namespace(self.win, "term-widget")
        GtkLayerShell.set_layer(self.win, GtkLayerShell.Layer.BACKGROUND)
        GtkLayerShell.set_anchor(self.win, GtkLayerShell.Edge.TOP, True)
        GtkLayerShell.set_anchor(self.win, GtkLayerShell.Edge.RIGHT, True)
        GtkLayerShell.set_margin(self.win, GtkLayerShell.Edge.TOP, MARGIN_TOP)
        GtkLayerShell.set_margin(self.win, GtkLayerShell.Edge.RIGHT, MARGIN_RIGHT)
        GtkLayerShell.set_keyboard_mode(
            self.win, GtkLayerShell.KeyboardMode.NONE
        )
        GtkLayerShell.set_exclusive_zone(self.win, 0)

        self.term = None
        self._mount()
        self.win.show_all()

    def _mount(self):
        if self.term is not None:
            self.win.remove(self.term)
        self.term = build_terminal(self._schedule_respawn)
        self.win.add(self.term)
        self.term.show()

    def _schedule_respawn(self):
        GLib.timeout_add(300, self._remount)

    def _remount(self):
        self._mount()
        return False


def main():
    TermWidget()
    Gtk.main()


if __name__ == "__main__":
    main()
