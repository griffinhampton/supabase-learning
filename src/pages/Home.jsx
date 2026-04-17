import MovieCard from "../components/MovieCard"
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import "../css/Home.css"
import { searchMovies, getPopularMovies, getMovieDetails } from "../services/api";


function Home() {
        const [searchQuery, setSearchQuery] = useState("");
        const [movies, setMovies] = useState([]);
        const [error, setError] = useState(null);
        const [loading, setLoading] = useState(true);
        const [debugMovieId, setDebugMovieId] = useState("550");
        const [movieJsonOutput, setMovieJsonOutput] = useState("");
        const [jsonLoading, setJsonLoading] = useState(false);
        const [jsonError, setJsonError] = useState(null);
    const rootRef = useRef(null)

        useEffect(() => {
            const loadPopularMovies = async () => {
                try {
                    const popularMovies = await getPopularMovies();
                    setMovies(popularMovies);
                } catch (err) {
                    console.log(err)
                    setError("Failed to load movies...")
                }
                finally {
                    setLoading(false)
                }
            }

            loadPopularMovies();
        }, [])

        useEffect(() => {
            if (loading) return
            if (!rootRef.current) return

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
        }, [loading, movies])
        //typical convention, get and set variables next to each other in useState
        //when a state change occurs, the entire component is reran or rerendered
    //put prevent default in the functions as seen below
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        if (loading) return;

        setLoading(true)
        try {
            const searchResults = await searchMovies(searchQuery)
            setMovies(searchResults)
            setError(null)
        } catch (err) {
            console.log(err)
            setError("Failed to search movies...")
        } finally {
            setLoading(false)
        }

        setSearchQuery("")
    };

    const handleInspectMovieJson = async () => {
        if (!debugMovieId.trim()) {
            setJsonError("Enter a movie ID first.")
            return
        }

        setJsonLoading(true)
        setJsonError(null)

        try {
            const movie = await getMovieDetails(debugMovieId.trim())
            setMovieJsonOutput(JSON.stringify(movie, null, 2))
        } catch (err) {
            console.log(err)
            setMovieJsonOutput("")
            setJsonError("Could not fetch movie details. Check the movie ID.")
        } finally {
            setJsonLoading(false)
        }
    }

    return (
    <div className = "home" ref={rootRef}>

        <form onSubmit={handleSearch} className="search-form">
            <input type="text"
             placeholder="Search for movies..."
             className="search-input" 
             value={searchQuery}
             onChange={(e)=> setSearchQuery(e.target.value)}
             />
            <button type="submit" className="search-button">Search</button>
        </form>

        <section className="json-debug-panel">
            <h2 className="json-debug-title">Single Movie JSON Inspector</h2>
            <p className="json-debug-copy">Use a TMDB movie ID (example: 550) to inspect the full response payload.</p>
            <div className="json-debug-controls">
                <input
                    type="text"
                    className="search-input"
                    value={debugMovieId}
                    onChange={(e) => setDebugMovieId(e.target.value)}
                    placeholder="Movie ID"
                />
                <button
                    type="button"
                    className="search-button"
                    onClick={handleInspectMovieJson}
                    disabled={jsonLoading}
                >
                    {jsonLoading ? "Loading JSON..." : "Fetch JSON"}
                </button>
            </div>
            {jsonError && <div className="error-message">{jsonError}</div>}
            {movieJsonOutput && (
                <pre className="json-debug-output">{movieJsonOutput}</pre>
            )}
        </section>

            {error && <div className="error-message">{error}</div>}

        {loading ? (
            <div className="loading">Loading...</div>
        ) : (
            <div className="movies-grid">
            {movies.map(movie => (
                <MovieCard movie={movie} key={movie.id} /> 
            ))}
        </div>
        )}
        
    </div>
    );
}

export default Home;