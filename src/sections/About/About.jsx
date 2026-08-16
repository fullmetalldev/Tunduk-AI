import Button from "../../components/Button/Button";
import Logo from "../../components/Logo/Logo";
import "./About.scss";

const About = () => {
  return (
    <section className="About">
      <div className="container">
        <div className="About__content">
          <span className="tag">
            <Logo />
            is currently in beta
          </span>
          <h2 className="About__content_title head-1">
            First Kyrgyz Web AI Assistant
          </h2>
          <span className="About__content_subtitle sub-1">
            Scout gives you the tools to build custom agents and
            <br />
            workflows in record time.
          </span>
          <Button>Get Started</Button>
        </div>
      </div>
    </section>
  );
};
export default About;
