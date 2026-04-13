import "../css/Favorites.css"
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";

function Favorites() {
    const { favorites, syncLocalFavoritesToDb } = useMovieContext();
    const rootRef = useRef(null)

    useEffect(() => {
        if (typeof syncLocalFavoritesToDb === "function") {
            void syncLocalFavoritesToDb();
        }
    }, [syncLocalFavoritesToDb]);

    useEffect(() => {
        if (!rootRef.current) return
        if (!Array.isArray(favorites) || favorites.length === 0) return

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".movie-card",
                { opacity: 0, y: 24 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "power2.out",
                    stagger: 0.03,
                }
            )
        }, rootRef)

        return () => ctx.revert()
    }, [favorites])

    if (Array.isArray(favorites) && favorites.length > 0) {
        return (
        <div className="favorites" ref={rootRef}>
            <h2>Your Favorites</h2>
            <div className="movies-grid">
                {favorites.map(movie => (
                    <MovieCard movie={movie} key={movie.id ?? movie.movie_id ?? `${movie.movie_desc ?? movie.title}-${movie.poster_path ?? ""}`} /> 
                ))}
            </div>
        </div>
        );
    }
    else{
        return <div className="favorites-empty">
            <h2>No favorite movies yet...</h2>
            <p>Start adding movies to your favorites and they will appear here</p>
        </div>
    }
}

export default Favorites;