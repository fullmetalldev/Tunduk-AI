import Button from "../../components/Button/Button";
import Logo from "../../components/Logo/Logo";
import { useI18n } from "../../i18n/useI18n";
import "./About.scss";

const scrollToChat = () => {
  document.getElementById("chatbot")?.scrollIntoView({ behavior: "smooth" });
};

const About = () => {
  const { t } = useI18n();
  return (
    <section className="About" id="about">
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
            {["about.subtitle1", "about.subtitle2", "about.subtitle3"]
              .map((key) => t(key))
              .filter(Boolean)
              .map((line, index) => (
                <span key={index}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
          </span>
          <Button onClick={scrollToChat}>{t("about.cta")}</Button>
        </div>
      </div>
    </section>
  );
};
export default About;
