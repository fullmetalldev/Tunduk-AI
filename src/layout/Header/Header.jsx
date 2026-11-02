import Logo from "../../components/Logo/Logo";
import { useI18n } from "../../i18n/useI18n";
import { LANGUAGES } from "../../i18n/translations";
import { FlagKG, FlagUS } from "../../components/Flags/Flags";
import "./Header.scss";

const FLAGS = { en: FlagUS, ky: FlagKG };

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
              {LANGUAGES.map((lang) => {
                const Flag = FLAGS[lang.code];
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={language === lang.code ? "active" : ""}
                    aria-pressed={language === lang.code}
                    aria-label={lang.label}
                    title={lang.label}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <Flag className="Header__flag" />
                  </button>
                );
              })}
            </li>
          </div>
        </ul>
      </div>
    </header>
  );
};
export default Header;
