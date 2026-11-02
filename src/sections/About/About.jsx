import Button from "../../components/Button/Button";
import Logo from "../../components/Logo/Logo";
import { useI18n } from "../../i18n/useI18n";
import "./About.scss";

const About = () => {
  const { t } = useI18n();
  return (
    <section className="About">
      <div className="container">
        <div className="About__content">
          <span className="tag">
            <Logo />
            {t("about.tag")}
          </span>
          <h2 className="About__content_title head-1">
            {t("about.title")}
          </h2>
          <span className="About__content_subtitle sub-1">
            {t("about.subtitle1")}
            <br />
            {t("about.subtitle2")}
            <br />
            {t("about.subtitle3")}
          </span>
          <Button>{t("about.cta")}</Button>
        </div>
      </div>
    </section>
  );
};
export default About;
