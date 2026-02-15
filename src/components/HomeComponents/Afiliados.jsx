import { Stack, Typography, useMediaQuery } from "@mui/material"
import PropTypes from "prop-types";

const Afiliados = ({ id }) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
    const logos = [
        {
            id: 1,
            image: '/images/afiliados/klook.svg',
            url: 'https://www.klook.com/'
        },
        {
            id: 2,
            image: '/images/afiliados/tripadvisor.svg',
            url: 'https://www.tripadvisor.com/'
        },
        {
            id: 3,
            image: '/images/afiliados/holafly.svg',
            url: 'https://www.holafly.com/'
        },
        {
            id: 4,
            image: '/images/afiliados/booking.svg',
            url: 'https://www.booking.com/'
        },
        {
            id: 5,
            image: '/images/afiliados/getyourguide.svg',
            url: 'https://www.getyourguide.com/'
        },
        {
            id: 6,
            image: '/images/afiliados/skyscanner.svg',
            url: 'https://www.skyscanner.com/'
        },
       
        
    ]
    const marqueeLogos = [...logos, ...logos]

  return (
    <Stack id={id} direction="column" alignItems="flex-start" justifyContent="center" spacing={4} style={{width: "100%", padding: isMobile ? "8% 0" : "2% 0", backgroundColor: "#000"}}>

<Typography className="seccion2-title">Reserva tus servicios aqui</Typography>
<div style={{width: "100%", height: "2px", backgroundColor: "#C39D65"}}></div>
 <Stack className="seccion2-marquee" direction="row" alignItems="center">
        <Stack className="seccion2-track" direction="row" alignItems="center">
            {marqueeLogos.map((logo, index) => (
                <Stack className="seccion2-item" key={`${logo.id}-${index}`}>
                    <a href={logo.url} target="_blank" rel="noopener noreferrer">
                        <img className="seccion2-logo" src={logo.image} alt={`logo-${logo.id}`} loading="lazy" />
                    </a>
                </Stack>
            ))}
        </Stack>
    </Stack>
    <div style={{width: "100%", height: "2px", backgroundColor: "#C39D65"}}></div>
    </Stack>
   
  )
}

Afiliados.propTypes = {
  id: PropTypes.string,
};

export default Afiliados
