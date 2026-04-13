import "../css/MovieCard.css"
import { useMovieContext } from "../contexts/MovieContext";
function MovieCard({movie}) {
    const {isFavorite, addToFavorites, removeFromFavorites} = useMovieContext()
    const favorite = isFavorite(movie)
    
    function onFavoriteClick(e) {
        e.preventDefault()
        if (favorite) removeFromFavorites(movie)
        else addToFavorites(movie)
    }

    return (
    <div className="movie-card">
        <div className="movie-poster">
            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title ?? movie.movie_desc}/>
        </div>
        <div className="movie-overlay">
            <button className={`favorite-btn ${favorite ? "active" : ""}`} onClick={onFavoriteClick}>
                :3
            </button>
        </div>
        <div className="movie-info">
            <h3>{movie.title ?? movie.movie_desc}</h3>
            <p>{movie.release_date?.split("-")[0]}</p>
        </div>
    </div>
    );
}

export default MovieCard