import { PCI_CERTIFIED_LINK } from "../constants/links";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
  <footer className="w-full py-4 bg-transparent text-center fixed bottom-0 left-0 z-50">
    <span className="text-sm text-grey-500">
      © {currentYear} tranzpay.io, All Rights Reserved | {" "}
      <a
        href={PCI_CERTIFIED_LINK} // Replace with your actual PCI certification link if available
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline hover:text-blue-700"
      >
        Tranzpay is Level 1 PCI Certified Secure
      </a>
    </span>
  </footer>
  );
};

export default Footer;