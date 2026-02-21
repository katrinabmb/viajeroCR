import { Stack, Typography, useMediaQuery } from "@mui/material";
import PropTypes from "prop-types";

const CardService = ({ image, title, title2, description }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const computer = useMediaQuery('(min-width: 1025px) and (max-width: 1599px)');
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="center"
      spacing={2}
      style={{ width: isMobile ? "100%" : computer ? "90%" : "70%", height: isMobile ? "150px" : "220px" }}
    >
      <img
        src={image}
        alt={title}
        style={{ width: isMobile ? "50px" : computer ? "70px" : "120px", height: isMobile ? "50px" : computer ? "70px" : "120px" }}
      />
      <Stack
        direction="column"
        alignItems="flex-start"
        justifyContent="flex-start"
        spacing={3}
        style={{ height: "100%" }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          style={{ borderBottom: "1px solid #C39D65" }}
        >
          <Typography className="service-title">{title}</Typography>
          <Typography className="service-title2">{title2}</Typography>
        </Stack>
        {/* <Typography className="service-description">{description}</Typography> */}
      </Stack>
    </Stack>
  );
};

CardService.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  title2: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

const Seccion4 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const services = [
    {
      id: 1,
      title: "Salidas ",
      title2: "grupales exclusivas",
      description:
        "Nuestras salidas grupales, son planificadas con antelación, lo cual asegura 100% su realización",
      image: "images/servicios/salidasgrupales.svg",
    },
    {
      id: 2,
      title: "Boletos ",
      title2: "aereos y cruceros",
      description:
        "Llevamos a cabo la compra de boletos aereos, para que puedas viajar sin preocupaciones",
      image: "images/servicios/boletosaereos.svg",
    },
    {
      id: 3,
      title: "Paquetes",
      title2: "100% a la medida",
      description:
        "Si busca la mejor opción para viajar por el mundo, le ofrezco los mejores circuitos, de la mano de grandes socios comerciales.",
      image: "images/servicios/circuitosporelmundo.svg",
    },
    {
      id: 4,
      title: "Hoteles, tours",
      title2: "y seguros",
      description:
        "Te recomendaremos las mejores opciones de hotel dentro de tu presupuesto",
      image: "images/servicios/hotel.svg",
    }
  ];
  const rowSize = 2;
  const serviceRows = [];

  for (let i = 0; i < services.length; i += rowSize) {
    serviceRows.push(services.slice(i, i + rowSize));
  }
  return (
    <Stack
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={isMobile ? 2 : 4}
      style={{ paddingBottom: "4rem", backgroundColor: "#000" }}
    >
      <Typography className="seccion3-title">Servicios</Typography>
      {serviceRows.map((row, rowIndex) => (
        <Stack
          key={`services-row-${rowIndex}`}
          direction={isMobile ? "column" : "row"}
          spacing={0}
          alignItems="center"
          justifyContent="center"
          style={{ width: isMobile ? "100%" : "90%" }}
        >
          {row.map((service) => (
            <Stack
              key={service.id}
              direction="column"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              style={{ width: "80%" }}
            >
              <CardService
                image={service.image}
                title={service.title}
                title2={service.title2}
                description={service.description}
              />
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

Seccion4.propTypes = {
  id: PropTypes.string,
};

export default Seccion4;
