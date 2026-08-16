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
            First Web AI Kyrgyz Assistant that speaks clear Kyrgyz
          </h2>
          <span className="About__content_subtitle sub-1">
            Built for Kyrgyz-speaking users, it delivers natural answers,
            <br />
            clear pronunciation, and a more human way to interact with AI
            <br />
            directly in the browser.
          </span>
          <Button>Get Started</Button>
        </div>
      </div>
    </section>
  );
};
export default About;
