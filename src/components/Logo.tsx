import { Link } from "react-router-dom";
import tranzpayLogo from "../assets/tranzpayio-logo.svg";

const Logo = ({ className = "h-11 w-auto" }) => (
  <Link to="/">
    <img
      src={tranzpayLogo}
      alt="Tranzpay Logo"
      className={className}
    />
  </Link>
);

export default Logo;