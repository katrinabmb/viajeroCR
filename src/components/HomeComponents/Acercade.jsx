import { Stack, Typography, useMediaQuery } from "@mui/material"


const Acercade = ({ id }) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
  return (
<Stack      
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{ paddingBottom: "4rem", backgroundColor: "#000", borderBottom: "2px solid #C39D65", paddingTop: isMobile ? "1rem" : "2rem" }}
    >
      <Typography className="seccion3-title">Acerca de VIAJERO CR</Typography>

      <Stack direction={isMobile ? "column" : "row"} alignItems="center" justifyContent="center" spacing={isMobile ? 4 : 18}
      >
        <img src="/images/viajerocr.jpeg" alt="Viajero CR" className="acercade-image" />


        <Stack direction="column" alignItems="center" justifyContent="center" spacing={2} style={{ width: isMobile ? "80%" : "40%" }}>
            <Typography className="acercade-descripcion">ViajeroCR nace de una pasión auténtica por descubrir el mundo y de la experiencia personal de Edgar Leiva, quien durante más de 15 años ha recorrido más de 80 países y una gran diversidad de ciudades y pueblos. Cada destino ha sido una fuente de aprendizaje y cada viaje una experiencia que hoy se transforma en asesoría cercana, honesta y estratégica para quienes confían en este proyecto.</Typography>
            <Typography className="acercade-descripcion">En ViajeroCR cada viaje se diseña como si fuera propio. Más allá de reservar vuelos, trenes y hoteles, el enfoque está en comprender lo que cada viajero sueña vivir y convertirlo en una experiencia bien planificada, segura y memorable. Con conocimiento directo de los destinos, atención personalizada y cuidado en cada detalle, el objetivo es que cada cliente viaje con confianza, ilusión y respaldo en todo momento, porque viajar no es solo trasladarse… es cumplir sueños con propósito.</Typography>
        </Stack>

      </Stack>
    </Stack>
  )
}

export default Acercade
