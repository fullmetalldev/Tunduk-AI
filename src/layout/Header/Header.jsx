import Logo from "../../components/Logo/Logo";
import { useI18n } from "../../i18n/useI18n";
import { LANGUAGES } from "../../i18n/translations";
import "./Header.scss";

const Header = () => {
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="Header">
      <div className="container">
        <ul className="Header__navbar">
          <Logo />
          <div className="Header__navbar_right">
            <li>
              <a href="">{t("nav.about")}</a>
            </li>
            <li>
              <a href="">{t("nav.chatbot")}</a>
            </li>
            <li className="Header__navbar_lang">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={language === lang.code ? "active" : ""}
                  aria-pressed={language === lang.code}
                  onClick={() => setLanguage(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </li>
          </div>
        </ul>
      </div>
    </header>
  );
};
export default Header;
