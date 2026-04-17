import { createPoll } from "ags";

export const clockService = {
    time: createPoll("", 1000, `date +"%H:%M"`),
    date: createPoll("", 60_000, `date +"%d/%m/%y"`),
    weekday: createPoll("", 60_000, `date +"%A"`),
};
