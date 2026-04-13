import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "../css/Navbar.css"
function NavBar() {
    const navRef = useRef(null)

    useEffect(() => {
        if (!navRef.current) return
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".navbar",
                { y: -12, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
            )
            gsap.fromTo(
                ".nav-link",
                { y: -6, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.06, delay: 0.05 }
            )
        }, navRef)

        return () => ctx.revert()
    }, [])

    return <nav className="navbar" ref={navRef}>
        <div className="navbar-brand">
            <Link to="/">Movie App</Link>
        </div>
        <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/favorites" className="nav-link">Favorites</Link>
        </div>
    </nav>
}

export default NavBar;