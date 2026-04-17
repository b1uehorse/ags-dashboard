// Snippet: новый сервис-источник.
// Скопировать в src/services/foo.ts

import { createBinding, createPoll, createComputed } from "ags";
// import SomeLib from "gi://AstalSomething";

// const lib = SomeLib.get_default();

export const fooService = {
    // реактивный property GObject-а:
    // active: createBinding(lib, "isActive"),

    // polling shell-команды:
    status: createPoll("", 5000, "bash -c 'systemctl is-active foo.service'"),

    // computed из нескольких:
    // label: createComputed([a, b], (a, b) => `${a}/${b}`),
};

// Не забыть задокументировать в docs/services.md
