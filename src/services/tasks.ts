import { createPoll } from "ags";

const todoFile = "~/.todo.txt";

export const tasksService = {
    raw: createPoll("", 10_000, `bash -c "cat ${todoFile} 2>/dev/null | head -20"`),

    total: createPoll(0, 10_000, `bash -c "wc -l < ${todoFile} 2>/dev/null || echo 0"`),
    highPriority: createPoll(0, 10_000, `bash -c "grep -c '^(A)' ${todoFile} 2>/dev/null || echo 0"`),
    next: createPoll("", 10_000, `bash -c "head -1 ${todoFile} 2>/dev/null | sed 's/^(.) //'"`),
};
