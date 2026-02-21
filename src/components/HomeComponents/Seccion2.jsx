import { Stack, Typography } from "@mui/material"
import PropTypes from "prop-types";


const Seccion2 = ({ id }) => {
    const logos = [
        {
            id: 1,
            image: '/images/partners/aeromexico.svg'
        },
        {
            id: 2,
            image: '/images/partners/airfrance.svg'
        },
        {
            id: 3,
            image: '/images/partners/american.svg'
        },
        {
            id: 4,
            image: '/images/partners/avianca.svg'
        },
        {
            id: 5,
            image: '/images/partners/barcelo.svg'
        },
        
        {
            id: 7,
            image: '/images/partners/copa.svg'
        },
        {
            id: 8,
            image: '/images/partners/decameron.svg'
        },
        {
            id: 9,
            image: '/images/partners/delta.svg'
        },
        {
            id: 10,
            image: '/images/partners/etihad.svg'
        },
        {
            id: 11,
            image: '/images/partners/flyemirates.svg'
        },
        {
            id: 12,
            image: '/images/partners/hamptoninn.svg'
        },
        {
            id: 13,
            image: '/images/partners/holidayinn.svg'
        },
        {
            id: 14,
            image: '/images/partners/iberia.svg'
        },
        {
            id: 15,
            image: '/images/partners/KLM.svg'
        },
        {
            id: 16,
            image: '/images/partners/ins.svg'
        },
        {
            id: 17,
            image: '/images/partners/qantas.svg'
        },
        {
            id: 18,
            image: '/images/partners/united.svg'
        },
        {
            id: 19,
            image: '/images/partners/usairways.svg'
        },
        {
            id: 20,
            image: '/images/partners/meic.svg'
        },
        {
            id: 21,
            image: '/images/partners/ict.svg'
        },
        
    ]
    const marqueeLogos = [...logos, ...logos]

  return (
    <Stack id={id} direction="column" alignItems="flex-start" justifyContent="center" spacing={4} style={{width: "100%", padding: "2% 0", backgroundColor: "#000"}}>

{/* <Typography className="seccion2-title">Proveedores y afiliados</Typography> */}
<div style={{width: "100%", height: "2px", backgroundColor: "#C39D65"}}></div>
 <Stack className="seccion2-marquee" direction="row" alignItems="center">
        <Stack className="seccion2-track" direction="row" alignItems="center">
            {marqueeLogos.map((logo, index) => (
                <Stack className="seccion2-item" key={`${logo.id}-${index}`}>
                    <img className="seccion2-logo" src={logo.image} alt={`logo-${logo.id}`} loading="lazy" />
                </Stack>
            ))}
        </Stack>
    </Stack>
    <div style={{width: "100%", height: "2px", backgroundColor: "#C39D65"}}></div>
    </Stack>
   
  )
}

Seccion2.propTypes = {
  id: PropTypes.string,
};

export default Seccion2
