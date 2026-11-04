"use client";

import { useEffect, useState } from "react";
import { getErrorMessage, moveTrackInList } from "./helpers";
import type { ActivePlaylistTrack, AdminFetch, TrackRating } from "./types";

/**
 * Active playlist data and actions: loading, archiving, manual drag reorder,
 * star ratings, and re-applying the rating order. Loading and status state is
 * shared with the rest of the dashboard, so it is passed in.
 */
export function useActivePlaylist({
  token,
  adminFetch,
  setIsLoading,
  setWorkingId,
  setMessage,
}: {
  token: string;
  adminFetch: AdminFetch;
  setIsLoading: (isLoading: boolean) => void;
  setWorkingId: (id: string) => void;
  setMessage: (message: string) => void;
}) {
  const [tracks, setTracks] = useState<ActivePlaylistTrack[]>([]);
  const [draggedTrackUri, setDraggedTrackUri] = useState("");
  const [dragOverTrackUri, setDragOverTrackUri] = useState("");

  useEffect(() => {
    if (!token) setTracks([]);
  }, [token]);

  async function loadTracks() {
    if (!token) return;

    setIsLoading(true);
    setMessage("");

    try {
      const data = await adminFetch<{ tracks: ActivePlaylistTrack[] }>(
        "/api/admin/playlist/active"
      );
      setTracks(data.tracks);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function archiveTrack(trackUri: string) {
    setWorkingId(trackUri);
    setMessage("");

    try {
      await adminFetch("/api/admin/playlist/archive", {
        method: "POST",
        body: JSON.stringify({ trackUri }),
      });
      setTracks((current) => current.filter((track) => track.uri !== trackUri));
      setMessage("Track moved to the archive playlist.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  async function reorderTrack(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    const track = tracks[fromIndex];
    if (!track) return;

    const previousTracks = tracks;

    setTracks(moveTrackInList(tracks, fromIndex, toIndex));
    setWorkingId(`reorder:${track.uri}`);
    setMessage("");

    try {
      await adminFetch("/api/admin/playlist/reorder", {
        method: "POST",
        body: JSON.stringify({ fromIndex, toIndex }),
      });
      setMessage(`Moved ${track.name}.`);
    } catch (error) {
      setTracks(previousTracks);
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
      setDraggedTrackUri("");
      setDragOverTrackUri("");
    }
  }

  function handleTrackDrop(toIndex: number) {
    if (!draggedTrackUri) return;

    const fromIndex = tracks.findIndex(
      (track) => track.uri === draggedTrackUri
    );
    void reorderTrack(fromIndex, toIndex);
  }

  async function rateTrack(track: ActivePlaylistTrack, rating: TrackRating) {
    if (track.rating === rating) return;

    setWorkingId(`rating:${track.uri}`);
    setMessage("");

    try {
      const data = await adminFetch<{ tracks: ActivePlaylistTrack[] }>(
        "/api/admin/playlist/rating",
        {
          method: "POST",
          body: JSON.stringify({ trackUri: track.uri, rating }),
        }
      );
      setTracks(data.tracks);
      setMessage(
        `Rated ${track.name} ${rating} ${rating === 1 ? "star" : "stars"}.`
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  async function sortTracks() {
    setWorkingId("sort");
    setMessage("");

    try {
      const data = await adminFetch<{
        tracks: ActivePlaylistTrack[];
        moved: number;
      }>("/api/admin/playlist/sort", { method: "POST" });
      setTracks(data.tracks);
      setMessage(
        data.moved === 0
          ? "Playlist is already in rating order."
          : `Playlist sorted by rating (${data.moved} ${data.moved === 1 ? "move" : "moves"}).`
      );
    } catch (error) {
      // A failed sort can stop partway; show what Spotify actually has.
      await loadTracks();
      setMessage(getErrorMessage(error));
    } finally {
      setWorkingId("");
    }
  }

  return {
    tracks,
    draggedTrackUri,
    dragOverTrackUri,
    setDraggedTrackUri,
    setDragOverTrackUri,
    loadTracks,
    archiveTrack,
    handleTrackDrop,
    rateTrack,
    sortTracks,
  };
}
