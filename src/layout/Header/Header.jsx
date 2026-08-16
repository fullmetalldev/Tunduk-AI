import Logo from "../../components/Logo/Logo";
import "./Header.scss";

const Header = () => {
  return (
    <header className="Header">
      <div className="container">
        <ul className="Header__navbar">
          <Logo />
          <div className="Header__navbar_right">
            <li>
              <a href="">About</a>
            </li>
            <li>
              <a href="">ChatBot</a>
            </li>
          </div>
        </ul>
      </div>
    </header>
  );
};
export default Header;
