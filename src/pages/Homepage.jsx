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

const Homepage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    const targetId = hash.replace("#", "");
    const el = document.getElementById(targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <>
      <Navbar onContactClick={() => setFormOpen((prev) => !prev)} />
      {formOpen && <Form onClose={() => setFormOpen(false)} />}
      <Seccion1 id="inicio"/>
      <Afiliados id="aliados"/>
      <Seccion3 id="destinos"/>
      <Seccion4 id="servicios"/>
      <Seccion2 id="proveedores"/>
      <Seccion5 id="salidas-grupales"/>
      <Footer />
    </>
  );
};

export default Homepage;
