import { useState, useEffect } from "react";
import FakeMovieCard from "../components/fakemoviecard";
import "../css/MovieCard.css"

function Home()
{
    return (
        <>
        <FakeMovieCard 
        movie={{title: "Mars movie", release_date: "2024",url: "https://m.media-amazon.com/images/M/MV5BNzQxNzQxNjk5NV5BMl5BanBnXkFtZTgwNTI4MTU0MzE@._V1_.jpg"}}
        />
        </>
    );

}

export default Home;