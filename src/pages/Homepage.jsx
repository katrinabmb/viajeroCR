import Navbar from "../components/global/Navbar";
import Seccion1 from "../components/HomeComponents/Seccion1";
import "../styles/home.css";
import Seccion2 from "../components/HomeComponents/Seccion2";
import Seccion3 from "../components/HomeComponents/Seccion3";
import { useEffect, useState } from "react";
import Form from "../components/componentsForm/Form";
import Afiliados from "../components/HomeComponents/Afiliados";
import Seccion4 from "../components/HomeComponents/Seccion4";
import Seccion5 from "../components/HomeComponents/Seccion5";
import Footer from "../components/global/Footer";
import { useLocation } from "react-router-dom";
import Testimonios from "../components/HomeComponents/Testimonios";
import Acercade from "../components/HomeComponents/Acercade";
import { getApiBaseUrl } from "../store/apiBase";

const Homepage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [waHref, setWaHref] = useState("https://wa.me/50683429727");
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    const targetId = hash.replace("#", "");
    let attempts = 0;
    let timeoutId;

    const scrollToHash = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < 30) {
        timeoutId = window.setTimeout(scrollToHash, 150);
      }
    };

    scrollToHash();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.hash]);

  useEffect(() => {
    let isMounted = true;

    const loadWhatsappConfig = async () => {
      try {
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/whatsapp`);
        const data = await response.json();

        if (!response.ok || data?.success === false || !data?.item?.phone) return;

        const rawPhone = String(data.item.phone);
        const phone = rawPhone.replace(/[^\d]/g, "");
        if (!phone) return;

        const rawMessage = String(data.item.default_message ?? "").trim();
        const href = rawMessage
          ? `https://wa.me/${phone}?text=${encodeURIComponent(rawMessage)}`
          : `https://wa.me/${phone}`;

        if (isMounted) setWaHref(href);
      } catch {
        // Mantiene fallback local si falla API
      }
    };

    loadWhatsappConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Navbar onContactClick={() => setFormOpen((prev) => !prev)} />
      {formOpen && <Form onClose={() => setFormOpen(false)} />}
      <a
        className="btnWA"
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/images/WA.svg" style={{ width: "50%" }} alt="WA" />
      </a>
      <Seccion1 id="inicio"/>
      <Afiliados id="aliados"/>
      <Seccion3 id="destinos"/>
      <Seccion4 id="servicios"/>
      <Seccion2 id="proveedores"/>
      <Seccion5 id="salidas-grupales"/>
      <Acercade id="acercade"/>
      <Testimonios id="testimonios"/>
      <Footer />
    </>
  );
};

export default Homepage;
