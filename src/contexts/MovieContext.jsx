/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "../services/supabase"

const MovieContext = createContext()

export const useMovieContext = () => useContext(MovieContext)

const getMovieId = (movie) => movie?.id ?? movie?.movie_id ?? null

const getPosterPath = (movie) => movie?.poster_path ?? null

const getMovieTitle = (movie) => movie?.title ?? movie?.movie_desc ?? null

const getMovieKey = (movie) => {
    const posterPath = getPosterPath(movie)
    if (posterPath) return `poster:${posterPath}`

    const movieId = getMovieId(movie)
    if (movieId != null) return `id:${movieId}`

    const title = movie?.title ?? movie?.movie_desc ?? ""
    const posterPathFallback = movie?.poster_path ?? ""
    const releaseDate = movie?.release_date ?? ""
    return `fallback:${title}|${posterPathFallback}|${releaseDate}`
}

const mergeFavorites = (current, incoming) => {
    const merged = []
    const seenKeys = new Set()

    for (const movie of [...(current ?? []), ...(incoming ?? [])]) {
        const key = getMovieKey(movie)
        if (seenKeys.has(key)) continue
        seenKeys.add(key)
        merged.push(movie)
    }

    return merged
}

const mapMovieToDbRow = (movie, { includeMovieId }) => {
    const row = {
        movie_desc: getMovieTitle(movie),
        poster_path: movie?.poster_path ?? null,
        release_date: movie?.release_date ?? null,
        is_favorite: true,
    }

    if (includeMovieId) row.movie_id = getMovieId(movie)
    return row
}

export const MovieProvider = ({ children }) => {
    const [favorites, setFavorites] = useState(() => {
        const storedFavs = localStorage.getItem("favorites")
        if (!storedFavs) return []

        try {
            const parsed = JSON.parse(storedFavs)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    })

    const refreshFavorites = useCallback(async () => {
        const { data, error } = await supabase
            .from("favorites")
            .select("*")

        if (error) {
            console.error(error)
            return
        }

        setFavorites((prev) => mergeFavorites(prev, data ?? []))
    }, [])

    const deleteFavorite = useCallback(async (movieOrIdentifier) => {
        const posterPath =
            typeof movieOrIdentifier === "object"
                ? getPosterPath(movieOrIdentifier)
                : movieOrIdentifier

        if (!posterPath) return

        const title =
            typeof movieOrIdentifier === "object"
                ? getMovieTitle(movieOrIdentifier)
                : null

        // Prefer matching on both poster_path + title when available.
        const withTitle = title
            ? await supabase
                .from("favorites")
                .delete()
                .eq("poster_path", posterPath)
                .eq("movie_desc", title)
            : { error: null }

        if (withTitle?.error) {
            // Fallback: poster_path is unique, so this is safe.
            const fallback = await supabase
                .from("favorites")
                .delete()
                .eq("poster_path", posterPath)

            if (fallback.error) console.error(fallback.error)
            return
        }

        if (title) return

        // No title provided: delete by poster_path.
        const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("poster_path", posterPath)

        if (error) console.error(error)
    }, [])

    const insertFavorite = useCallback(async (movie) => {
        const posterPath = getPosterPath(movie)
        if (posterPath) {
            const existing = await supabase
                .from("favorites")
                .select("poster_path")
                .eq("poster_path", posterPath)
                .limit(1)

            if (existing.error) {
                console.error(existing.error)
                return
            }

            if (Array.isArray(existing.data) && existing.data.length > 0) return
        }

        const candidatePayloads = [
            mapMovieToDbRow(movie, { includeMovieId: true }),
            mapMovieToDbRow(movie, { includeMovieId: false }),
        ]

        let lastError = null
        for (const payload of candidatePayloads) {
            const { error } = await supabase.from("favorites").insert(payload)

            if (!error) return
            lastError = error
        }

        console.error("Failed to insert favorite into Supabase.", lastError)
    }, [])

    const insertFavorites = useCallback(async () => {
        if (!Array.isArray(favorites) || favorites.length === 0) return
        await Promise.all(favorites.map((movie) => insertFavorite(movie)))
    }, [favorites, insertFavorite])

    const syncLocalFavoritesToDb = useCallback(async () => {
        const storedFavs = localStorage.getItem("favorites")
        if (!storedFavs) return

        let localFavorites
        try {
            localFavorites = JSON.parse(storedFavs)
        } catch {
            return
        }

        if (!Array.isArray(localFavorites) || localFavorites.length === 0) return

        const localByPoster = new Map()
        for (const movie of localFavorites) {
            const posterPath = getPosterPath(movie)
            if (!posterPath) continue
            if (!localByPoster.has(posterPath)) localByPoster.set(posterPath, movie)
        }

        const posterPaths = Array.from(localByPoster.keys())
        if (posterPaths.length === 0) return
        
        const existingPosterPaths = new Set()
        const chunkSize = 100

        for (let i = 0; i < posterPaths.length; i += chunkSize) {
            const chunk = posterPaths.slice(i, i + chunkSize)
            const { data, error } = await supabase
                .from("favorites")
                .select("poster_path")
                .in("poster_path", chunk)

            if (error) {
                console.error(error)
                return
            }

            for (const row of data ?? []) {
                if (row?.poster_path) existingPosterPaths.add(row.poster_path)
            }
        }

        const missingMovies = posterPaths
            .filter((p) => !existingPosterPaths.has(p))
            .map((p) => localByPoster.get(p))
            .filter(Boolean)

        if (missingMovies.length === 0) return

        const rowsWithId = missingMovies.map((m) => mapMovieToDbRow(m, { includeMovieId: true }))
        const insertWithId = await supabase.from("favorites").insert(rowsWithId)

        if (insertWithId.error) {
            const rowsWithoutId = missingMovies.map((m) => mapMovieToDbRow(m, { includeMovieId: false }))
            const insertWithoutId = await supabase.from("favorites").insert(rowsWithoutId)

            if (insertWithoutId.error) {
                console.error(insertWithoutId.error)
                return
            }
        }

        void refreshFavorites()
    }, [refreshFavorites])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refreshFavorites()
    }, [refreshFavorites])

    useEffect(() => {
        localStorage.setItem("favorites", JSON.stringify(favorites))
    }, [favorites])

    const isFavorite = useCallback((movie) => {
        const posterPath = getPosterPath(movie)
        const title = getMovieTitle(movie)

        if (!posterPath || !title) return false

        return favorites.some((fav) => (
            getPosterPath(fav) === posterPath && getMovieTitle(fav) === title
        ))
    }, [favorites])

    const addToFavorites = useCallback((movie) => {
        if (isFavorite(movie)) return
        setFavorites((prev) => [...prev, movie])
        void insertFavorite(movie)
    }, [insertFavorite, isFavorite])

    const removeFromFavorites = useCallback((movieOrIdentifier) => {
        const posterPath =
            typeof movieOrIdentifier === "object"
                ? getPosterPath(movieOrIdentifier)
                : movieOrIdentifier

        const title =
            typeof movieOrIdentifier === "object"
                ? getMovieTitle(movieOrIdentifier)
                : null

        setFavorites((prev) => prev.filter((fav) => {
            if (!posterPath) return true
            if (getPosterPath(fav) !== posterPath) return true
            if (!title) return false
            return getMovieTitle(fav) !== title
        }))

        void deleteFavorite(movieOrIdentifier)
    }, [deleteFavorite])

    const value = useMemo(() => (
        {
            favorites,
            refreshFavorites,
            insertFavorites,
            syncLocalFavoritesToDb,
            addToFavorites,
            removeFromFavorites,
            isFavorite,
        }
    ), [
        favorites,
        refreshFavorites,
        insertFavorites,
        syncLocalFavoritesToDb,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
    ])

    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    )
}
