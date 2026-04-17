import Mpris from "gi://AstalMpris";
import { createBinding, createComputed } from "ags";

const mpris = Mpris.get_default();

function firstPlayer() {
    return createComputed([createBinding(mpris, "players")], (players) => {
        return players?.[0] ?? null;
    });
}

export const musicService = {
    player: firstPlayer(),

    title(player: Mpris.Player | null) {
        return player ? createBinding(player, "title") : null;
    },
    artist(player: Mpris.Player | null) {
        return player ? createBinding(player, "artist") : null;
    },
    cover(player: Mpris.Player | null) {
        return player ? createBinding(player, "coverArt") : null;
    },
    playing(player: Mpris.Player | null) {
        return player ? createBinding(player, "playbackStatus") : null;
    },

    toggle: (p: Mpris.Player | null) => p?.play_pause(),
    next:   (p: Mpris.Player | null) => p?.next(),
    prev:   (p: Mpris.Player | null) => p?.previous(),
    shuffle: (p: Mpris.Player | null) => p && (p.shuffle = !p.shuffle),
};
