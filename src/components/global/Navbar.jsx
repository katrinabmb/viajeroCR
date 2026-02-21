import { Button, Drawer, Stack, useMediaQuery } from "@mui/material"
import "../../styles/navbar.css"
import { NavLink } from "react-router-dom"
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const Navbar = ({ onContactClick }) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const navItems = useMemo(
      () => [
        { to: "/#inicio", label: "INICIO" },
        { to: "/#aliados", label: "ALIADOS" },
        { to: "/#destinos", label: "DESTINOS" },
        { to: "/#servicios", label: "SERVICIOS" },
        { to: "/#salidas-grupales", label: "SALIDAS GRUPALES" },
      ],
      []
    );

    useEffect(() => {
      // Si cambia a desktop, cerramos el drawer automáticamente.
      if (!isMobile) setIsDrawerOpen(false);
    }, [isMobile]);

  return (
<Stack className="main-container-navbar" direction="row" justifyContent="space-between" alignItems="center">

    <img src="/images/logoNew.svg" alt="logo" className="logo-navbar"/>

    <Stack className="navbar-items" direction="row" spacing={4} alignItems="center" >

{!isMobile && (
  <>
    {navItems.map((item) => (
      <NavLink key={item.to} to={item.to} className="navbar-item">
        {item.label}
      </NavLink>
    ))}

    <Button className="navbar-button" onClick={onContactClick}>Contacto</Button>
  </>

)}
{isMobile && (
  <>
    <button
      type="button"
      className="navbar-menu-button"
      onClick={() => setIsDrawerOpen(true)}
      aria-label="Abrir menú"
      aria-haspopup="dialog"
      aria-expanded={isDrawerOpen}
      aria-controls="navbar-mobile-drawer"
    >
      <img src="/images/menuicon.svg" alt="menu" />
    </button>
    <Button className="navbar-button" onClick={onContactClick}>Contacto</Button>

    <Drawer
      anchor="right"
      open={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      PaperProps={{ className: "navbar-drawer-paper", id: "navbar-mobile-drawer" }}
      ModalProps={{ keepMounted: true }}
    >
      <div className="navbar-drawer" role="navigation" aria-label="Menú principal">
        <div className="navbar-drawer-header">
          <img src="/images/logoNew.svg" alt="logo" className="navbar-drawer-logo" />
          <button
            type="button"
            className="navbar-drawer-close"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <div className="navbar-drawer-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="navbar-drawer-item"
              onClick={() => setIsDrawerOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

 
      </div>
    </Drawer>
  </>
)}
        {/* <button className="translate-button" onClick={toggleLanguage}>
        <img src={translation.buttonText} alt="language" style={{width:"60%"}} />
      </button> */}

        {/* <button className="navbar-button">
            <img src="/images/menuicon.svg" alt="menu" />
        </button> */}
    </Stack>

</Stack>
  )
}

Navbar.propTypes = {
  onContactClick: PropTypes.func,
};

export default Navbar
