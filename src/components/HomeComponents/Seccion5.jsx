import { Stack, Typography, useMediaQuery } from "@mui/material"
import PropTypes from "prop-types";

const CardSalidaGrupal = ({ title, description, fechas, precio, image, itinerario }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
    return (
        <Stack direction="column" alignItems="center" justifyContent= "space-between" spacing={3} className="card-salida-grupal">
            <img src={image} alt={title} className="card-salida-grupal-image" />
            <Stack direction="column" alignItems="center" justifyContent={isMobile ? "center" : "space-between"} spacing={isMobile ? 2 : 3} style={{ height: isMobile ? "10rem" : "15rem", padding:"0 1rem"}}>
            <Typography className="card-salida-grupal-title">{title}</Typography>
            <Typography className="card-salida-grupal-description">{description}</Typography>
            <Typography className="card-salida-grupal-fechas">{fechas}</Typography>
            <Typography className="card-salida-grupal-precio">{precio}</Typography>
            </Stack>
            <Stack alignItems="center" justifyContent="center"style={{ height: "3rem", width: "100%" }}>
            <a href={itinerario} className="card-salida-grupal-button" download>
              Descargar itinerario
            </a>
            </Stack>
        </Stack>
    )
}

CardSalidaGrupal.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  fechas: PropTypes.string.isRequired,
  precio: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  itinerario: PropTypes.string.isRequired,
};


const Seccion5 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');

    const salidasGrupales = [
        {
            id: 1,
            title: "Chile Bolivia Top",
            description: "Desierto de Atacama, Salar de Uyuni, Dunas Concón, Viña, Santiago y más.",
            fechas: "01 MAY 2026 - 10 MAY 2026",
            precio: "DESDE $2.950",
            image: "images/america/AMERICA2.jpg",
            itinerario: "docs/GRUPAL-ATA-UYU-MAYO-2026.pdf"
        },
        {
            id: 2,
            title: "LO MEJOR DE PERÚ",
            description: "Cusco, Machu Picchu, Humantay, Vinicunca, Puno, Lago Titicaca, Taquile y más.",
            fechas: "20 AGO 2026 al 29 AGO 2026",
            precio: "DESDE $2.600",
            image: "images/america/AMERICA10.jpg",
            itinerario: "docs/GRUPAL-PERU-AGO-2026.pdf"
        },
        {
            id: 3,
            title: "PATAGONIA ARGENTINA",
            description: "Buenos Aires, El Calafate, Perito Moreno, Torres del Paine, Chaltén, Ushuaia.",
            fechas: "15 OCT 2026 - 24 OCT 2026",
            precio: "DESDE $3.350",
            image: "images/america/AMERICA9.jpg",
            itinerario: "docs/GRUPAL-ARG-OCT-2026.pdf"
        }
    ]

  return (
<Stack      
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{ paddingBottom: "4rem", backgroundColor: "#000" }}
    >
      <Typography className="seccion3-title">Salidas Grupales</Typography>

<Stack direction={isMobile ? "column" : "row"} spacing={4} alignItems="center" justifyContent="center" style={{ width: "80%" }}>
    {salidasGrupales.map((salida) => (
        <CardSalidaGrupal key={salida.id} title={salida.title} description={salida.description} fechas={salida.fechas} precio={salida.precio} image={salida.image} itinerario={salida.itinerario} />
    ))}
</Stack>


</Stack>
  )
}

Seccion5.propTypes = {
  id: PropTypes.string,
};

export default Seccion5
