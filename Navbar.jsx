
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <h2>FileVault Pro</h2>

      <div>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
      </div>
    </nav>
  );
}

export default Navbar;
