function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
        <div className="footer-links">
          <a
            className="social-icon"
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            title="Facebook"
          >
            f
          </a>
          <a
            className="social-icon"
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            title="Instagram"
          >
            ig
          </a>
          <a
            className="social-icon"
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            title="X"
          >
            x
          </a>
          <a
            className="social-icon"
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            in
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
